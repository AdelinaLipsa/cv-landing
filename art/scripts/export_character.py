"""Export her, the guitar, the chair and both cats to art/bake/character_raw.glb, one glTF animation per clip.
Run from room.blend. It first re-saves the session as PREP (a throwaway copy), so the destructive prep
(modifiers applied, guitar joined, room deleted, NLA rebuilt) never touches room.blend, then reopens room.blend.

  exec(open(ART + "/scripts/export_character.py").read())

Set RUN = False before exec to call the steps one by one (prep, bake_morphs, apply_modifiers, join_guitar,
decimate, bbone_proxies, refit_weights, build_nla, export, reopen); the whole run takes ~1.5 min. Then compress:
  GT=<folder with @gltf-transform/core, /extensions, meshoptimizer> sh art/scripts/build_character.sh

Clips (glTF animation = NLA track name, shared by every object that moves in it):
  Strum 1-97, ToDesk 1-646, ReactBed 1-72, ReactDesk 1-72 (her + props + mouth morphs)
  Cat loops: each sub-loop keeps its own period, so it's its own clip (play them together, each looping)."""
import bpy, os

ART = "/Users/adelinalipsa/Documents/GitHub/adelina-cv/art"
OUT = globals().get("OUT", ART + "/bake/character_raw.glb")
PREP = globals().get("PREP", ART + "/bake/character_export.blend")
D = bpy.data
sc = bpy.context.scene
SRC = globals().get("SRC", D.filepath)   # room.blend, reopened at the end

RIG_CLIPS = {"Strum": "Strum", "ToDesk": "ToDesk", "ReactBed": "ReactBed", "ReactDesk": "ReactDesk"}
WHEELS = [f"ChairWheel{i}" for i in range(5)]
# object -> {clip: action}. Strum's guitar holds where ToDesk starts it (the guitar doesn't move in Strum).
PROP_CLIPS = {
    "Guitar": {"Strum": "Guitar_Strum", "ToDesk": "Guitar_ToDesk", "ReactBed": "Guitar_ReactBed"},
    "Chair": {"ToDesk": "ChairAction", "ReactDesk": "Chair_ReactDesk"},
    "ChairSeat": {"ToDesk": "ChairSeatAction", "ReactDesk": "ChairSeat_ReactDesk"},
    **{w: {"ToDesk": f"{w}Action.001", "ReactDesk": f"{w}_ReactDesk"} for w in WHEELS},
    # cats (build_munchkins.py): one rig each, every clip keys every bone, so they crossfade cleanly
    "Siamese_Rig": {"Siamese_Loop": "Siamese_Rig_Loop"},
    "Burmese_Rig": {"Burmese_Loop": "Burmese_Rig_Loop", "Burmese_Stretch": "Burmese_Rig_Stretch"},   # now and then she stretches
    "Burmese_Z": {"Burmese_Z": "Burmese_ZAction"},
    "Mug": {"ToDesk": "Mug_ToDesk"},   # out of the room bake: she takes a sip at the desk (clip_sip.py)
}
ROOTS = ["Her_Rig", "Guitar", "Chair", "Siamese", "Burmese", "Mug"]
MOUTH = {"Yawn": '["mouth_yawn"]', "Smile": '["mouth_smile"]'}   # shape key -> rig prop that drives it
MORPHS = globals().get("MORPHS", {})   # clip -> {mesh name: {shape: [values per frame]}}


def _rng(a):
    return int(a.frame_range[0]), int(a.frame_range[1])


def prep():
    """Re-save as PREP (from here on saves go there), drop everything that isn't exported."""
    bpy.ops.wm.save_as_mainfile(filepath=PREP)
    for a in D.actions:
        a.use_fake_user = True   # actions swapped off their object (Guitar_ToDesk) must survive a save/reopen of PREP
    keep = set()
    for n in ROOTS:
        keep.add(D.objects[n]); keep.update(D.objects[n].children_recursive)
    for o in list(D.objects):
        if o not in keep:
            D.objects.remove(o)
    for o in keep:
        o.hide_set(False); o.hide_viewport = False
    # Guitar_Strum: the guitar's ToDesk frame-1 transform, held over Strum's range
    g = D.objects["Guitar"]; g.animation_data.action = D.actions["Guitar_ToDesk"]; sc.frame_set(1)
    a = D.actions.new("Guitar_Strum"); g.animation_data.action = a
    for f in _rng(D.actions["Strum"]):
        g.keyframe_insert("location", frame=f); g.keyframe_insert("rotation_euler", frame=f)
    print("prep: kept", len(keep), "objects")


def bake_morphs():
    """Driven mouth values per frame of each rig clip, read straight off the rig props' fcurves (drivers are x)."""
    rig = D.objects.get("Her_Rig") or D.objects["Her"]
    keyed = [o for o in rig.children if o.type == "MESH" and o.data.shape_keys]
    for clip, an in RIG_CLIPS.items():
        a = D.actions[an]; f0, f1 = _rng(a)
        fcs = {fc.data_path: fc for l in a.layers for st in l.strips for cb in st.channelbags for fc in cb.fcurves}
        MORPHS[clip] = {o.name: {k.name: [fcs[MOUTH[k.name]].evaluate(f) if MOUTH[k.name] in fcs else 0.0
                                          for f in range(f0, f1 + 1)]
                                 for k in o.data.shape_keys.key_blocks[1:]} for o in keyed}
    for o in keyed:
        ad = o.data.shape_keys.animation_data
        if ad:
            for d in list(ad.drivers):
                ad.drivers.remove(d)
    print("morphs:", {c: {o: {k: round(max(v), 2) for k, v in s.items()} for o, s in m.items()} for c, m in MORPHS.items()})


def _apply_keep_shapes(o):
    """Apply the non-armature modifiers of a mesh with shape keys: evaluate each shape alone, rebuild the keys."""
    arm = [m for m in o.modifiers if m.type == "ARMATURE"]
    for m in arm:
        m.show_viewport = False
    names = [k.name for k in o.data.shape_keys.key_blocks]
    shapes = []
    for i in range(len(names)):
        o.show_only_shape_key = True; o.active_shape_key_index = i
        bpy.context.view_layer.update()
        ev = o.evaluated_get(bpy.context.evaluated_depsgraph_get()).data
        shapes.append([v.co.copy() for v in ev.vertices])
    o.show_only_shape_key = False
    bpy.context.view_layer.objects.active = o
    o.shape_key_clear()
    for m in [m for m in o.modifiers if m.type != "ARMATURE"]:
        bpy.ops.object.modifier_apply(modifier=m.name)
    assert len(o.data.vertices) == len(shapes[0]), o.name
    for n, co in zip(names, shapes):
        k = o.shape_key_add(name=n, from_mix=False)
        for v, c in zip(k.data, co):
            v.co = c
    for m in arm:
        m.show_viewport = True


def apply_modifiers():
    for o in D.objects["Her_Rig"].children:
        if o.type != "MESH" or all(m.type == "ARMATURE" for m in o.modifiers):
            continue
        if o.data.shape_keys:
            _apply_keep_shapes(o)
        else:
            bpy.context.view_layer.objects.active = o
            for m in [m for m in o.modifiers if m.type != "ARMATURE"]:
                bpy.ops.object.modifier_apply(modifier=m.name)
    print("modifiers applied; verts", sum(len(o.data.vertices) for o in D.objects["Her_Rig"].children if o.type == "MESH"))


def join_guitar():
    """55 guitar meshes -> one GuitarMesh child of the Guitar empty (one node, a primitive per material)."""
    g = D.objects["Guitar"]
    meshes = [o for o in g.children_recursive if o.type == "MESH"]
    for o in D.objects:
        o.select_set(False)
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    j = bpy.context.view_layer.objects.active
    mw = j.matrix_world.copy()
    j.parent = g; j.matrix_world = mw
    j.name = j.data.name = "GuitarMesh"
    for o in [o for o in g.children_recursive if o.type == "EMPTY"]:
        D.objects.remove(o)
    print("guitar:", j.name, len(j.data.vertices), "verts", len(j.data.materials), "materials")


DECIMATE = {"GuitarMesh": 0.08, "Right Shoe.001": 0.1, "Hat 2.001": 0.3}   # 332k / 179k / 50k verts -> web budget


def decimate():
    for n, r in DECIMATE.items():
        o = D.objects[n]; before = len(o.data.polygons)
        m = o.modifiers.new("Decimate", "DECIMATE"); m.ratio = r
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier=m.name)
        print("decimate", n, before, "->", len(o.data.polygons), "faces")


def _rig():
    return D.objects.get("Her_Rig") or D.objects["Her"]


def _lbs_parts(o, rig):
    """Per deform bone: world skinning matrix; and the mesh's rest coords in the rig's space (homogeneous)."""
    import numpy as np
    M = {pb.name: np.array(rig.matrix_world @ pb.matrix @ pb.bone.matrix_local.inverted())
         for pb in rig.pose.bones if pb.bone.use_deform}
    co = np.array([v.co[:] + (1.0,) for v in o.data.vertices]) @ np.array(rig.matrix_world.inverted() @ o.matrix_world).T
    return M, co


PROXY = ("DEF-upper_arm", "DEF-forearm", "DEF-thigh", "DEF-shin", "DEF-spine")   # B-bones that bend/twist a lot
K = 3   # straight segments per B-bone


def bbone_proxies():
    """glTF has no B-bones: the arms, legs and spine twist and curve along their 8-10 B-bone segments in Blender,
    and straight bones put a candy-wrapper on the sleeves (up to 6 cm). Each such DEF bone gets K deforming
    children that Copy Transforms points along its B-bone curve (Follow B-Bone); its weights are shared out
    between them by where the vertex sits along the bone. The exporter then bakes the children with the rest."""
    import numpy as np
    rig = _rig(); arm = rig.data
    src = [b.name for b in arm.bones if b.use_deform and b.bbone_segments > 1 and b.name.startswith(PROXY)]
    bpy.context.view_layer.objects.active = rig
    keep_pos = arm.pose_position
    # rest shape of each B-bone segment: evaluate the constraints with every pose bone cleared
    bpy.ops.object.mode_set(mode="EDIT")
    for n in src:
        e = arm.edit_bones[n]
        for i in range(K):
            s = arm.edit_bones.new(f"{n}.seg{i}")
            s.head = e.head.lerp(e.tail, i / K); s.tail = e.head.lerp(e.tail, (i + 1) / K)
            s.roll = e.roll; s.parent = e; s.use_deform = True
    bpy.ops.object.mode_set(mode="POSE")
    for n in src:
        for i in range(K):
            c = rig.pose.bones[f"{n}.seg{i}"].constraints.new("COPY_TRANSFORMS")
            c.target = rig; c.subtarget = n; c.head_tail = i / K; c.use_bbone_shape = True
    ad = rig.animation_data; keep_action = ad.action if ad else None
    mutes = [(t, t.mute) for t in ad.nla_tracks] if ad else []
    for t, _ in mutes:
        t.mute = True
    if ad:
        ad.action = None
    saved = {pb.name: (pb.location.copy(), pb.rotation_quaternion.copy(), pb.rotation_euler.copy(), pb.scale.copy()) for pb in rig.pose.bones}
    for pb in rig.pose.bones:
        pb.location = (0, 0, 0); pb.rotation_quaternion = (1, 0, 0, 0); pb.rotation_euler = (0, 0, 0); pb.scale = (1, 1, 1)
    bpy.context.view_layer.update()
    rest = {f"{n}.seg{i}": rig.pose.bones[f"{n}.seg{i}"].matrix.copy() for n in src for i in range(K)}
    drift = max(max(abs(x) for r in (rig.pose.bones[n].matrix - arm.bones[n].matrix_local) for x in r) for n in src)
    print("cleared-pose drift of the source B-bones from rest:", round(drift, 5))   # must be ~0
    for pb in rig.pose.bones:
        pb.location, pb.rotation_quaternion, pb.rotation_euler, pb.scale = saved[pb.name]
    bpy.ops.object.mode_set(mode="EDIT")
    for name, m in rest.items():
        arm.edit_bones[name].matrix = m          # segment rest = the B-bone's rest curve there, so rest pose is identity
    bpy.ops.object.mode_set(mode="OBJECT")
    for n in src:
        arm.bones[n].use_deform = False
    if ad:
        ad.action = keep_action
    for t, m in mutes:
        t.mute = m
    arm.pose_position = keep_pos
    # share each vertex's weight between the two nearest segment centres along the bone
    for o in rig.children:
        if o.type != "MESH":
            continue
        inv = rig.matrix_world.inverted() @ o.matrix_world
        co = np.array([(inv @ v.co)[:] for v in o.data.vertices])
        for n in src:
            vg = o.vertex_groups.get(n)
            if not vg:
                continue
            b = arm.bones[n]; h = np.array(b.head_local); ax = np.array(b.tail_local) - h
            ids, ws = [], []
            for v in o.data.vertices:
                for g in v.groups:
                    if g.group == vg.index and g.weight > 0:
                        ids.append(v.index); ws.append(g.weight)
            if not ids:
                o.vertex_groups.remove(vg); continue
            t = np.clip(((co[ids] - h) @ ax) / ax.dot(ax) * K - 0.5, 0, K - 1)   # in segment-centre units
            lo = np.floor(t).astype(int); fr = t - lo; hi = np.minimum(lo + 1, K - 1)
            segs = [o.vertex_groups.get(f"{n}.seg{i}") or o.vertex_groups.new(name=f"{n}.seg{i}") for i in range(K)]
            for vi, w, a, bb, f in zip(ids, ws, lo, hi, fr):
                segs[a].add([vi], float(w * (1 - f)), "ADD")
                if f > 0:
                    segs[bb].add([vi], float(w * f), "ADD")
            o.vertex_groups.remove(vg)
    print("bbone proxies:", len(src), "B-bones ->", len(src) * K, "segment bones")


def refit_weights(step=8, lam=10.0, mu=0.02):
    """glTF/three skin with 4 influences and straight bones; Blender deforms her with up to ~10 and B-bones.
    Truncating to the top 4 left 1-3 cm creases on the jumper and body. Instead, keep each vertex's top-4 bones
    and least-squares fit their weights so 4-influence linear skinning matches Blender's real deformation over
    poses sampled from every clip (sum = 1, weights >= 0, a small pull toward the original weights)."""
    import numpy as np
    rig = _rig(); ad = rig.animation_data
    keep_action, mutes = ad.action, [(t, t.mute) for t in ad.nla_tracks]
    for t, _ in mutes:
        t.mute = True
    meshes = []
    for o in rig.children:
        if o.type != "MESH":
            continue
        names = {g.index: g.name for g in o.vertex_groups}
        M0, _ = _lbs_parts(o, rig)
        top = []
        for v in o.data.vertices:
            ws = sorted(((g.weight, names[g.group]) for g in v.groups if names[g.group] in M0 and g.weight > 0), reverse=True)
            top.append(ws)
        if any(len(ws) > 4 for ws in top):
            meshes.append((o, top))
    if not meshes:
        return
    frames = [(an, f) for an in RIG_CLIPS.values() for f in range(_rng(D.actions[an])[0], _rng(D.actions[an])[1] + 1, step)]
    acc = {o.name: None for o, _ in meshes}
    for o, top in meshes:
        bones = sorted({n for ws in top for _, n in ws[:4]}); bi = {n: i for i, n in enumerate(bones)}
        V = len(top)
        idx = np.zeros((V, 4), int); w0 = np.zeros((V, 4)); valid = np.zeros((V, 4), bool)
        for i, ws in enumerate(top):
            ws = ws[:4]; s = sum(w for w, _ in ws) or 1.0
            for k, (w, n) in enumerate(ws):
                idx[i, k] = bi[n]; w0[i, k] = w / s; valid[i, k] = True
        acc[o.name] = [bones, idx, w0, valid, np.zeros((V, 4, 4)), np.zeros((V, 4))]
    dg = bpy.context.evaluated_depsgraph_get()
    for an, f in frames:
        ad.action = D.actions[an]; sc.frame_set(f)
        for o, top in meshes:
            bones, idx, w0, valid, AtA, Atb = acc[o.name]
            M, co = _lbs_parts(o, rig)
            Mb = np.stack([M[n] for n in bones])                       # (B,4,4)
            P = np.einsum("bij,vj->vbi", Mb, co)[..., :3]                # (V,B,3) each bone's prediction
            A = np.take_along_axis(P, idx[:, :, None], 1) * valid[:, :, None]   # (V,4,3)
            ev = o.evaluated_get(dg).data
            T = np.array([v.co[:] for v in ev.vertices]) @ np.array(o.matrix_world)[:3, :3].T + np.array(o.matrix_world)[:3, 3]
            AtA += np.einsum("vki,vli->vkl", A, A); Atb += np.einsum("vki,vi->vk", A, T)
    ad.action = keep_action
    for t, m in mutes:
        t.mute = m
    for o, top in meshes:
        bones, idx, w0, valid, AtA, Atb = acc[o.name]
        n = len(frames)
        H = AtA / n + lam * np.ones((4, 4)) + mu * np.eye(4)
        g = Atb / n + lam + mu * w0
        H += np.where(valid[:, :, None] & valid[:, None, :], 0, 1e6 * np.eye(4))   # unused slots pinned to 0
        w = np.linalg.solve(H, g[..., None])[..., 0] * valid
        w = np.clip(w, 0, None); w /= np.maximum(w.sum(1, keepdims=True), 1e-9)
        bad = ~np.isfinite(w).all(1); w[bad] = w0[bad]
        for vg in o.vertex_groups:
            vg.remove(range(len(o.data.vertices)))
        for vi in range(len(top)):
            for k in range(4):
                if valid[vi, k] and w[vi, k] > 1e-4:
                    o.vertex_groups[bones[idx[vi, k]]].add([vi], float(w[vi, k]), "REPLACE")
        print("refit", o.name, "verts", len(top), "over 4:", sum(len(ws) > 4 for ws in top))


def skin_error(o, frames):
    """Max / 99th percentile distance (mm) between 4-influence linear skinning and Blender's deformation."""
    import numpy as np
    rig = _rig(); ad = rig.animation_data; keep = ad.action
    mutes = [(t, t.mute) for t in ad.nla_tracks]
    for t, _ in mutes:
        t.mute = True
    names = {g.index: g.name for g in o.vertex_groups}; out = []
    for an, f in frames:
        ad.action = D.actions[an]; sc.frame_set(f)
        M, co = _lbs_parts(o, rig)
        ev = o.evaluated_get(bpy.context.evaluated_depsgraph_get()).data
        T = np.array([v.co[:] for v in ev.vertices]) @ np.array(o.matrix_world)[:3, :3].T + np.array(o.matrix_world)[:3, 3]
        for v in o.data.vertices:
            ws = sorted(((g.weight, names[g.group]) for g in v.groups if names[g.group] in M and g.weight > 0), reverse=True)[:4]
            s = sum(w for w, _ in ws)
            if s:
                p = sum((w / s) * (M[n] @ co[v.index]) for w, n in ws)[:3]
                out.append(np.linalg.norm(p - T[v.index]))
    ad.action = keep
    for t, m in mutes:
        t.mute = m
    out = np.array(out) * 1000
    return round(float(out.max()), 1), round(float(np.percentile(out, 99)), 1)


def _track(ad, clip, action, slot=None):
    t = ad.nla_tracks.new(); t.name = clip
    s = t.strips.new(clip, _rng(action)[0], action)
    if slot is not None and hasattr(s, "action_slot"):
        s.action_slot = slot
    s.frame_end = _rng(action)[1]
    t.mute = False


def build_nla():
    """Every exported object: no active action, one NLA track per clip, named as the clip."""
    (D.objects.get("Her_Rig") or D.objects["Her"]).name = "Her"
    objs = {"Her": RIG_CLIPS, **PROP_CLIPS}
    last = lambda kv: kv[0] == "ToDesk"   # ToDesk on top: at frame 1 the static (rest) transforms are ToDesk's first frame, as in room.glb
    for on, clips in objs.items():
        o = D.objects[on]
        ad = o.animation_data or o.animation_data_create()
        for t in list(ad.nla_tracks):
            ad.nla_tracks.remove(t)
        ad.action = None
        for clip, an in sorted(clips.items(), key=last):
            _track(ad, clip, D.actions[an])
    for k in D.shape_keys:
        if k.animation_data:
            for t in list(k.animation_data.nla_tracks):
                k.animation_data.nla_tracks.remove(t)
    for clip, meshes in sorted(MORPHS.items(), key=last):
        f0 = _rng(D.actions[RIG_CLIPS[clip]])[0]
        for mn, shapes in meshes.items():
            key = D.objects[mn].data.shape_keys
            a = D.actions.new(f"{clip}_{mn}_SK")
            ad = key.animation_data or key.animation_data_create()
            ad.action = a
            for sn, vals in shapes.items():
                kb = key.key_blocks[sn]
                for i, v in enumerate(vals):
                    kb.value = v; kb.keyframe_insert("value", frame=f0 + i)
            slot = ad.action_slot
            ad.action = None
            _track(ad, clip, a, slot)
    for k in D.shape_keys:
        for kb in k.key_blocks[1:]:
            kb.value = 0.0
    bpy.ops.wm.save_mainfile()
    print("nla built")


def export():
    sc.frame_set(1)
    for o in D.objects:
        o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=OUT, export_format="GLB", use_selection=True, export_yup=True, export_apply=False,
        export_cameras=False, export_lights=False, export_extras=False, export_materials="EXPORT",
        export_image_format="AUTO", export_texcoords=True, export_normals=True, export_tangents=False,
        export_skins=True, export_def_bones=True, export_all_influences=False, export_rest_position_armature=True,
        export_morph=True, export_morph_normal=True, export_morph_tangent=False,
        export_animations=True, export_animation_mode="NLA_TRACKS", export_force_sampling=True,
        export_frame_step=1, export_anim_slide_to_zero=True, export_reset_pose_bones=True,
        export_optimize_animation_size=False, export_optimize_animation_keep_anim_object=True, export_bake_animation=False)
    print("exported", OUT, os.path.getsize(OUT))


def reopen():
    bpy.ops.wm.open_mainfile(filepath=SRC)


if globals().get("RUN", True):
    for step in (prep, bake_morphs, apply_modifiers, join_guitar, decimate, bbone_proxies, refit_weights, build_nla, export, reopen):
        step()
