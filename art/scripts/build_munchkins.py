"""Both cats from one Munchkin model (art/downloads/munchkin_cat.glb, Nyilonelycompany, CC BY-NC-SA 4.0), rigged
here and recoloured: a Birman on the desk (the "Siamese" slot) and a European brown tabby asleep on the bed (the
"Burmese" slot). Slot, root and bone names stay as the site wires them (Siamese_Head, Burmese_Body, Burmese_Z).

  exec(open(ART + "/scripts/build_munchkins.py").read())   # after STEP = "rig" / "skin" / "paint" / "place"

The cat faces -Y, Z up, feet at z = 0, ~22 cm to the top of the head (a munchkin: short legs)."""
import bpy, bmesh, math
import numpy as np
from mathutils import Vector, Matrix, Euler

D = bpy.data
sc = bpy.context.scene
ART = "/Users/adelinalipsa/Documents/GitHub/adelina-cv/art"
SRC = ART + "/downloads/munchkin_cat.glb"
SCALE = 0.55

# bone: (head, tail, parent, deform)
X = 0.031
BONES = {
    "root":   ((0, 0.0, 0.0), (0, 0.06, 0.0), None, True),   # deform (unweighted) so glTF keeps it: it carries the pose height
    "hips":   ((0, 0.10, 0.11), (0, 0.03, 0.115), "root", True),
    "spine":  ((0, 0.03, 0.115), (0, -0.05, 0.12), "hips", True),
    "neck":   ((0, -0.05, 0.12), (0, -0.095, 0.15), "spine", True),
    "head":   ((0, -0.095, 0.15), (0, -0.165, 0.16), "neck", True),
    "ear.L":  ((-0.03, -0.11, 0.19), (-0.04, -0.115, 0.225), "head", True),
    "ear.R":  ((0.03, -0.11, 0.19), (0.04, -0.115, 0.225), "head", True),
    "tail1":  ((0, 0.115, 0.11), (0, 0.15, 0.115), "hips", True),
    "tail2":  ((0, 0.15, 0.115), (0, 0.185, 0.11), "tail1", True),
    "tail3":  ((0, 0.185, 0.11), (0, 0.22, 0.1), "tail2", True),
    "tail4":  ((0, 0.22, 0.1), (0, 0.27, 0.08), "tail3", True),
    **{f"arm{i}.{s}": b for s, x in (("L", -X), ("R", X)) for i, b in enumerate((
        ((x, -0.08, 0.10), (x, -0.088, 0.045), "spine", True),
        ((x, -0.088, 0.045), (x, -0.092, 0.004), f"arm0.{s}", True)))},
    **{f"leg{i}.{s}": b for s, x in (("L", -X), ("R", X)) for i, b in enumerate((
        ((x, 0.085, 0.10), (x, 0.095, 0.045), "hips", True),
        ((x, 0.095, 0.045), (x, 0.10, 0.004), f"leg0.{s}", True)))},
}


def seg_dist(p, a, b):
    ab = b - a
    t = np.clip(((p - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(p - (a + t[:, None] * ab), axis=1), t


def weigh(o, rig, names):
    """Two nearest deform bones per vertex by distance to the bone segment, blended over a soft band. A leg bone
    only takes vertices on its own side and below the belly, so legs don't pull the flank or each other."""
    co = np.array([v.co[:] for v in o.data.vertices])
    dist = {}
    for n in names:
        h, t, _, deform = BONES[n]
        if not deform: continue
        d, _ = seg_dist(co, np.array(h), np.array(t))
        limb = n[:3] in ("arm", "leg")
        if limb:
            side = -1 if n.endswith(".L") else 1
            bad = (co[:, 0] * side < 0.004) | (co[:, 2] > (0.085 if n[3] == "0" else 0.05))
            d = np.where(bad, 9.0, d)
        if n.startswith("ear"):
            side = -1 if n.endswith(".L") else 1
            d = np.where((co[:, 0] * side < 0.012) | (co[:, 2] < 0.175), 9.0, d)
        dist[n] = d
    keys = list(dist); M = np.stack([dist[k] for k in keys], 1)
    order = np.argsort(M, 1)[:, :2]
    d0 = np.take_along_axis(M, order[:, :1], 1)[:, 0]; d1 = np.take_along_axis(M, order[:, 1:2], 1)[:, 0]
    w1 = np.clip((d0 - d1 + 0.02) / 0.04, 0, 0.5)          # within 2 cm of a tie, share up to 50/50
    for o_vg in list(o.vertex_groups): o.vertex_groups.remove(o_vg)
    vg = {k: o.vertex_groups.new(name=k) for k in keys}
    for i in range(len(co)):
        a, b = keys[order[i, 0]], keys[order[i, 1]]
        vg[a].add([i], float(1 - w1[i]), "REPLACE")
        if w1[i] > 0.001: vg[b].add([i], float(w1[i]), "REPLACE")


def build_rig(name):
    arm = D.armatures.new(name); rig = D.objects.new(name, arm); sc.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="EDIT")
    eb = {}
    for n, (h, t, p, deform) in BONES.items():
        b = arm.edit_bones.new(n); b.head, b.tail = h, t; b.use_deform = deform; eb[n] = b
    for n, (h, t, p, _) in BONES.items():
        if p: eb[n].parent = eb[p]; eb[n].use_connect = Vector(h) == eb[p].tail
    bpy.ops.object.mode_set(mode="OBJECT")
    for pb in rig.pose.bones: pb.rotation_mode = "XYZ"
    return rig


def pose(rig, d):
    """d: {bone: (rx, ry, rz) degrees} or {bone: ((rx, ry, rz), (lx, ly, lz))}; every other bone at rest."""
    for pb in rig.pose.bones: pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)
    for n, v in d.items():
        r, l = (v, None) if not isinstance(v[0], (tuple, list)) else v
        rig.pose.bones[n].rotation_euler = [math.radians(a) for a in r]
        if l: rig.pose.bones[n].location = l
    bpy.context.view_layer.update()


# ---------- the two cats in their slots
COATS = ART + "/textures/munchkin"   # birman_body.png ... written by munchkin_coats.py
SLOTS = {   # slot root: (bone prefix, {bone: site name}, coat)
    "Siamese": ("Sia.", {"head": "Siamese_Head"}, "birman"),
    "Burmese": ("Bur.", {"spine": "Burmese_Body"}, "tabby"),
}


def names(slot):
    pre, special, _ = SLOTS[slot]
    return {n: special.get(n, pre + n) for n in BONES}


def build_named_rig(slot):
    nm = names(slot)
    arm = D.armatures.new(slot + "_Rig"); rig = D.objects.new(slot + "_Rig", arm); sc.collection.objects.link(rig)
    for c in rig.users_collection: pass
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="EDIT")
    eb = {}
    for n, (h, t, p, deform) in BONES.items():
        b = arm.edit_bones.new(nm[n]); b.head, b.tail = h, t; b.use_deform = deform; eb[n] = b
    for n, (h, t, p, _) in BONES.items():
        if p: eb[n].parent = eb[p]; eb[n].use_connect = Vector(h) == Vector(BONES[p][1])
    bpy.ops.object.mode_set(mode="OBJECT")
    for pb in rig.pose.bones: pb.rotation_mode = "XYZ"
    return rig


def coat_material(name, src_mat, image_path, uv=None):
    m = src_mat.copy(); m.name = name
    t = next(n for n in m.node_tree.nodes if n.type == "TEX_IMAGE" and (n.label == "coat" or uv is None))
    t.image = D.images.load(image_path, check_existing=True); t.image.name = name + "_tex"
    for n in [n for n in m.node_tree.nodes if n.type == "UVMAP"]:
        if uv: n.uv_map = uv
    return m


def make_cat(slot, body_src, fur_src):
    root = D.objects[slot]
    for o in list(root.children):
        if o.name != "Burmese_Z":
            for c in list(o.children_recursive)[::-1]: D.objects.remove(c)
            D.objects.remove(o)
    nm = names(slot)
    rig = build_named_rig(slot); rig.parent = root; rig.matrix_parent_inverse.identity(); rig.location = (0, 0, 0)
    for c in list(rig.users_collection): c.objects.unlink(rig)
    for c in root.users_collection: c.objects.link(rig)
    coat = SLOTS[slot][2]
    for src, suffix, tex in ((body_src, "_Coat", f"{COATS}/{coat}_body.png"), (fur_src, "_TailFur", f"{COATS}/{coat}_tail.png")):
        o = D.objects.new(slot + suffix, src.data.copy()); o.data.name = slot + suffix
        for c in root.users_collection: c.objects.link(o)
        o.parent = rig; o.matrix_parent_inverse.identity()
        if "UVOld" in o.data.uv_layers: o.data.uv_layers.remove(o.data.uv_layers["UVOld"])
        o.data.materials[0] = coat_material(slot + suffix, src.data.materials[0], tex, "UVCat" if suffix == "_Coat" else None)
        md = o.modifiers.new("Armature", "ARMATURE"); md.object = rig
        weigh(o, rig, list(BONES))
        for vg in o.vertex_groups: vg.name = nm[vg.name]
    return rig


def spose(slot, d):
    """pose() by generic bone names for one slot's rig."""
    nm = names(slot)
    pose(D.objects[slot + "_Rig"], {nm[k]: v for k, v in d.items()})


SIT = {"root": ((0, 0, 0), (0, 0, -0.062)), "hips": (-26, 0, 0), "neck": (10, 0, 0), "head": (14, 0, 0),
       "arm0.L": (24, 0, 0), "arm0.R": (24, 0, 0), "leg0.L": (-62, 0, 0), "leg0.R": (-62, 0, 0),
       "leg1.L": (70, 0, 0), "leg1.R": (70, 0, 0),
       "tail1": (40, 0, 0), "tail2": (10, 0, -35), "tail3": (0, 0, -45), "tail4": (0, 0, -35)}
# asleep in a loaf: belly on the duvet, forelegs folded under, chin down on her chest, tail wrapped along her side
LOAF = {"root": ((0, 0, 0), (0, 0, -0.05)), "hips": (2, 0, 14), "spine": (0, 0, -16), "neck": (18, 0, -14), "head": (24, 0, -10),
        "arm0.L": (70, 0, 0), "arm0.R": (70, 0, 0), "arm1.L": (-110, 0, 0), "arm1.R": (-110, 0, 0),
        "leg0.L": (-60, 0, 0), "leg0.R": (-60, 0, 0), "leg1.L": (100, 0, 0), "leg1.R": (100, 0, 0),
        "tail1": (-20, 0, 25), "tail2": (-5, 0, 40), "tail3": (0, 0, 45), "tail4": (0, 0, 35),
        "ear.L": (8, 0, 0), "ear.R": (8, 0, 0)}


def clip(slot, name, base, keys, last):
    """An action on the slot's rig: at each frame, base overridden by keys[frame] (generic bone names; values add to
    the base rotation, location replaces it), every bone keyed. Frame 1 and `last` should match for a loop."""
    rig = D.objects[slot + "_Rig"]; nm = names(slot)
    ad = rig.animation_data or rig.animation_data_create()
    if name in D.actions: D.actions.remove(D.actions[name])
    a = D.actions.new(name); a.use_fake_user = True; ad.action = a
    for f in sorted(keys):
        d = {k: v for k, v in base.items()}
        for k, v in keys[f].items():
            r0, l0 = (base.get(k, (0, 0, 0)), None)
            if k in base and isinstance(base[k][0], (tuple, list)): r0, l0 = base[k]
            r, l = (v, None) if not isinstance(v[0], (tuple, list)) else v
            d[k] = (tuple(x + y for x, y in zip(r0, r)), l if l is not None else l0)
        pose(rig, {nm[k]: (v if isinstance(v[0], (tuple, list)) else v) for k, v in d.items()})
        for pb in rig.pose.bones:
            pb.keyframe_insert("rotation_euler", frame=f); pb.keyframe_insert("location", frame=f)
    ad.action = None
    return a


# Birman, sitting on the desk: breathes, tilts her head and looks round, licks her right paw, sways her tail, flicks an ear
SIA_LOOP = {
    1: {}, 10: {"tail3": (0, 0, 10), "tail4": (0, 0, 14)},
    13: {"arm0.R": (-55, 0, -8), "arm1.R": (70, 0, 0), "head": (14, 0, -6), "neck": (6, 0, 0)},
    19: {"arm0.R": (-78, 0, -10), "arm1.R": (95, 0, 0), "head": (22, 8, -8), "neck": (8, 0, 0), "spine": (1, 0, 0)},
    24: {"arm0.R": (-80, 0, -10), "arm1.R": (98, 0, 0), "head": (26, 12, -10), "neck": (8, 0, 0)},
    29: {"arm0.R": (-78, 0, -10), "arm1.R": (95, 0, 0), "head": (20, 6, -8), "neck": (8, 0, 0)},
    34: {"arm0.R": (-80, 0, -10), "arm1.R": (98, 0, 0), "head": (26, 12, -10), "neck": (8, 0, 0), "tail3": (0, 0, -10), "tail4": (0, 0, -14)},
    40: {"arm0.R": (-60, 0, -6), "arm1.R": (70, 0, 0), "head": (6, 0, 0)},
    46: {"head": (-6, -10, 18), "neck": (0, 0, 10), "spine": (-1, 0, 0)},
    55: {"head": (-4, -8, 20), "neck": (0, 0, 10)},
    62: {"head": (0, 6, -14), "neck": (0, 0, -8), "ear.L": (0, -30, 0)},
    64: {"head": (0, 6, -14), "neck": (0, 0, -8), "ear.L": (0, 8, 0)},
    66: {"head": (0, 6, -14), "neck": (0, 0, -8)},
    76: {"tail3": (0, 0, 12), "tail4": (0, 0, 18), "spine": (1, 0, 0)},
    84: {"tail3": (0, 0, -16), "tail4": (0, 0, -24)},
    88: {"tail3": (0, 0, 8), "tail4": (0, 0, 14)},
    96: {},
}
# Tabby, asleep: three slow breaths a loop, an ear twitch
BUR_LOOP = {f: ({"spine": (3, 0, 0), "hips": (-1, 0, 0), "head": (-2, 0, 0)} if (f - 1) % 32 == 16 else {}) for f in (1, 17, 33, 49, 65, 81, 97)}
BUR_LOOP.update({40: {}, 42: {"ear.R": (0, -35, 0)}, 44: {"ear.R": (0, 12, 0)}, 46: {}})
# Tabby's stretch, now and then: chest down and paws out ahead, rump up, chin up, then back into the loaf
STRETCH = {
    1: {}, 8: {"root": ((0, 0, 0), (0, 0, -0.054)), "spine": (2, 0, 0)},
    30: {"root": ((0, 0, 0), (0, 0, -0.02)), "hips": (-2, 0, -14), "spine": (6, 0, 16), "neck": (-30, 0, 14), "head": (-38, 0, 10),
         "arm0.L": (-150, 0, 0), "arm0.R": (-150, 0, 0), "arm1.L": (90, 0, 0), "arm1.R": (90, 0, 0),
         "leg0.L": (40, 0, 0), "leg0.R": (40, 0, 0), "leg1.L": (-70, 0, 0), "leg1.R": (-70, 0, 0),
         "tail1": (35, 0, -25), "tail2": (0, 0, -40), "tail3": (0, 0, -45), "tail4": (0, 0, -35), "ear.L": (-14, 0, 0), "ear.R": (-14, 0, 0)},
    44: {"root": ((0, 0, 0), (0, 0, -0.018)), "hips": (-2, 0, -14), "spine": (7, 0, 16), "neck": (-32, 0, 14), "head": (-42, 0, 10),
         "arm0.L": (-156, 0, 0), "arm0.R": (-156, 0, 0), "arm1.L": (92, 0, 0), "arm1.R": (92, 0, 0),
         "leg0.L": (42, 0, 0), "leg0.R": (42, 0, 0), "leg1.L": (-72, 0, 0), "leg1.R": (-72, 0, 0),
         "tail1": (38, 0, -25), "tail2": (0, 0, -40), "tail3": (0, 0, -45), "tail4": (0, 0, -35), "ear.L": (-14, 0, 0), "ear.R": (-14, 0, 0)},
    56: {"root": ((0, 0, 0), (0, 0, -0.024)), "hips": (-2, 0, -12), "spine": (5, 0, 14), "neck": (-24, 0, 12), "head": (-30, 0, 8),
         "arm0.L": (-140, 0, 0), "arm0.R": (-140, 0, 0), "arm1.L": (85, 0, 0), "arm1.R": (85, 0, 0),
         "leg0.L": (36, 0, 0), "leg0.R": (36, 0, 0), "leg1.L": (-62, 0, 0), "leg1.R": (-62, 0, 0),
         "tail1": (30, 0, -22), "tail2": (0, 0, -35), "tail3": (0, 0, -40), "tail4": (0, 0, -30)},
    84: {"root": ((0, 0, 0), (0, 0, -0.051)), "neck": (2, 0, 0), "head": (3, 0, 0)},
    104: {},
}


def anims():
    clip("Siamese", "Siamese_Rig_Loop", SIT, SIA_LOOP, 96)
    clip("Burmese", "Burmese_Rig_Loop", LOAF, BUR_LOOP, 97)
    clip("Burmese", "Burmese_Rig_Stretch", LOAF, STRETCH, 104)
    spose("Siamese", SIT); spose("Burmese", LOAF)
