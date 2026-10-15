"""Helpers for keying her clips in world space. exec() this at the top of each step.
Bones are Rigify controls on Her_Rig; positions are world metres, directions are world vectors."""
import bpy, math
from mathutils import Vector, Matrix, Quaternion

sc = bpy.context.scene
rig = bpy.data.objects["Her_Rig"]
pb = rig.pose.bones
U = Vector((0, 0, 1))
FLOOR = 0.02  # top of the floorboards


def facing(yaw_deg):
    """forward and left vectors for a body that faces yaw_deg (0 = -Y, like the rest rig)."""
    a = math.radians(yaw_deg)
    return Vector((math.sin(a), -math.cos(a), 0)), Vector((math.cos(a), math.sin(a), 0))


def upd():
    rig.update_tag()
    bpy.context.view_layer.update()


def world(name):
    return rig.matrix_world @ pb[name].matrix


def place(name, loc=None, x=None, y=None):
    """Move a control in world space. y = the bone's Y axis direction, x = a hint for its X axis."""
    b = pb[name]
    cur_loc, cur_rot, scl = world(name).decompose()
    rot = cur_rot
    if y is not None:
        Y = y.normalized()
        X = (x if x is not None else (cur_rot.to_matrix() @ Vector((1, 0, 0))))
        X = (X - Y * X.dot(Y)).normalized()
        rot = Matrix((X, Y, X.cross(Y))).transposed().to_quaternion()
    b.matrix = rig.matrix_world.inverted() @ Matrix.LocRotScale(loc if loc is not None else cur_loc, rot, scl)
    upd()


def turn(name, axis, deg, about=None):
    """Rotate a control about a world axis through its own head (or a given point)."""
    mw = world(name)
    p = about if about is not None else mw.translation
    R = Matrix.Translation(p) @ Matrix.Rotation(math.radians(deg), 4, axis) @ Matrix.Translation(-p)
    pb[name].matrix = rig.matrix_world.inverted() @ (R @ mw)
    upd()


def aim(name, tip):
    """Point an FK bone's Y axis at a world point, rotating about its head."""
    mw = world(name)
    P = mw.translation
    q = (mw.to_3x3() @ Vector((0, 1, 0))).normalized().rotation_difference((tip - P).normalized())
    pb[name].matrix = rig.matrix_world.inverted() @ (Matrix.Translation(P) @ q.to_matrix().to_4x4() @ Matrix.Translation(-P) @ mw)
    upd()


CONTROLS = ["root", "torso", "hips", "chest", "neck", "head",
            "foot_ik.L", "foot_ik.R", "thigh_ik_target.L", "thigh_ik_target.R",
            "hand_ik.L", "hand_ik.R", "upper_arm_ik_target.L", "upper_arm_ik_target.R",
            "upper_arm_fk.L", "upper_arm_fk.R", "forearm_fk.L", "forearm_fk.R", "hand_fk.L", "hand_fk.R"]
PROPS = [("upper_arm_parent.L", "IK_FK"), ("upper_arm_parent.R", "IK_FK"),
         ("thigh_parent.L", "IK_FK"), ("thigh_parent.R", "IK_FK"),
         ("upper_arm_parent.L", "pole_vector"), ("upper_arm_parent.R", "pole_vector"),
         ("thigh_parent.L", "pole_vector"), ("thigh_parent.R", "pole_vector")]


def key(frame, names=None):
    """Key loc/rot/scale of the given controls (default: all) and the IK/FK switches."""
    for n in (names or CONTROLS):
        if n not in pb:
            continue
        b = pb[n]
        b.keyframe_insert("location", frame=frame)
        b.keyframe_insert("rotation_quaternion", frame=frame)
        b.keyframe_insert("scale", frame=frame)
    for bone, prop in PROPS:
        if prop in pb[bone]:
            pb[bone].keyframe_insert(f'["{prop}"]', frame=frame)


def fcurves(action):
    if hasattr(action, "fcurves"):
        return list(action.fcurves)
    out = []
    for lay in action.layers:
        for st in lay.strips:
            for cb in getattr(st, "channelbags", []):
                out.extend(cb.fcurves)
    return out


def key_obj(o, frame):
    o.keyframe_insert("location", frame=frame)
    o.keyframe_insert("rotation_euler", frame=frame)


def snapshot():
    """World matrices of all controls, to restore a pose later."""
    return {n: world(n).copy() for n in CONTROLS if n in pb}


def restore(snap):
    for n, mw in snap.items():
        pb[n].matrix = rig.matrix_world.inverted() @ mw
        upd()


# ---- No passing through objects: the gate every clip must pass before a preview -------------------
from mathutils.bvhtree import BVHTree

CHAR = ["Body.001", "Jumper", "Legs.001", "Head.001", "Hat 2.001", "Hair.001", "Vert.001", "Right Shoe.001"]
ROOM = ["Room_Furniture", "Room_Props", "Room_Shell", "ChairSeat", "ChairBase"]


def _mesh(o, dg, nosub=False):
    subs = [m for m in o.modifiers if m.type == "SUBSURF"] if nosub else []
    for m in subs:
        m.show_viewport = False
    dg.update()
    e = o.evaluated_get(dg)
    me = e.to_mesh()
    pts = [o.matrix_world @ v.co for v in me.vertices]
    polys = [tuple(p.vertices) for p in me.polygons]
    e.to_mesh_clear()
    for m in subs:
        m.show_viewport = True
    return pts, polys


def _face_mats(o, dg):
    e = o.evaluated_get(dg)
    me = e.to_mesh()
    names = [s.material.name if s.material else "" for s in o.material_slots]
    out = [names[p.material_index] if p.material_index < len(names) else "" for p in me.polygons]
    e.to_mesh_clear()
    return out


def _objs(names):
    out = []
    for n in names:
        o = bpy.data.objects.get(n)
        if o is None:
            continue
        out += [o] if o.type == "MESH" else [c for c in o.children_recursive if c.type == "MESH"]
    return out


def penetrations(frame, movers=None, obstacles=None, tol=0.01, allow=(), soft=()):
    """What passes through what on this frame.
    Closed room meshes (furniture, shell, props, chair): depth test, a mover vertex deeper than tol inside fails.
    Thin/open parts (the guitar, the cats): any surface crossing fails.
    allow: (mover_prefix, obstacle_prefix) pairs whose contact is intended (a hand holding the guitar).
    soft:  (mover_prefix, obstacle_prefix, extra_tol_m) for things that squash (sitting into a mattress)."""
    sc.frame_set(frame)
    dg = bpy.context.evaluated_depsgraph_get()
    movers = _objs(movers or CHAR + ["Guitar"])
    obstacles = _objs(obstacles or ROOM + ["Guitar", "Siamese", "Burmese"])
    closed = set(_objs(["Room_Furniture", "Room_Shell", "ChairSeat", "ChairBase"]))  # Room_Props are open meshes: crossing test
    data = {}
    for o in set(obstacles) | set(movers):
        data[o.name] = _mesh(o, dg)
    trees = {n: BVHTree.FromPolygons(*data[n]) for n in data}
    def same_thing(a, b):
        return a == b or (a.startswith("Guitar") and b.startswith("Guitar")) or \
               (a.split("_")[0] == b.split("_")[0] and a.split("_")[0] in ("Siamese", "Burmese", "Chair"))
    found = {}
    for m in movers:
        for o in obstacles:
            mn, on = m.name, o.name
            if same_thing(mn, on) or any(mn.startswith(x) and on.startswith(y) for x, y in allow):
                continue
            if o in closed and not mn.startswith(("Guitar", "Siamese", "Burmese")):
                t = tol + sum(e for x, y, e in soft if mn.startswith(x) and on.startswith(y))
                worst = 0.0
                pts = data[mn][0]
                for p in pts[:: max(1, len(pts) // 1500)]:
                    loc, nrm, _, dist = trees[on].find_nearest(p, 0.15)
                    if loc is not None and (p - loc).dot(nrm) < 0 and dist > t:
                        worst = max(worst, dist)
                if worst:
                    found[(mn, on)] = f"{round(worst * 1000)} mm deep"
            else:
                pairs = trees[mn].overlap(trees[on])
                if on == "Room_Props" and pairs:      # flat paper on the desk counts as the desk
                    mats = _face_mats(bpy.data.objects[on], dg)
                    pairs = [pq for pq in pairs if not mats[pq[1]].startswith("Sticky")]
                n = len(pairs)
                if n:
                    found[(mn, on)] = f"{n} crossings"
    return found


def check_clip(f0, f1, step=2, **kw):
    """Run penetrations() over a frame range; returns {frame: {pair: depth_mm}} for failing frames."""
    bad = {}
    for fr in range(f0, f1 + 1, step):
        r = penetrations(fr, **kw)
        if r:
            bad[fr] = r
    return bad


# ---- Body placement and a walk generator ----------------------------------------------------
def rest_frames():
    return {n: (rig.matrix_world @ pb[n].bone.matrix_local).to_3x3().normalized()
            for n in ("foot_ik.L", "foot_ik.R", "torso")}


def yaw_of(v):
    """yaw (degrees) whose facing() forward is the xy direction v."""
    return math.degrees(math.atan2(v.x, -v.y))


def set_hips(xy, z, yaw, pitch=0.0, roll=0.0):
    R0 = rest_frames()["torso"]
    fw, l = facing(yaw)
    R = Matrix.Rotation(math.radians(roll), 3, fw) @ Matrix.Rotation(math.radians(pitch), 3, l) @ \
        Matrix.Rotation(math.radians(yaw - 20), 3, "Z") @ R0
    _, _, scl = world("torso").decompose()
    pb["torso"].matrix = rig.matrix_world.inverted() @ Matrix.LocRotScale(Vector((xy[0], xy[1], z)), R.to_quaternion(), scl)
    upd()


def set_foot(side, xy, yaw, lift=0.0, toe=0.0):
    sole = sc["_walk"][0]
    R0 = rest_frames()[f"foot_ik.{side}"]
    fw, l = facing(yaw)
    R = Matrix.Rotation(math.radians(toe), 3, l) @ Matrix.Rotation(math.radians(yaw - 20), 3, "Z") @ R0
    _, _, scl = world(f"foot_ik.{side}").decompose()
    pb[f"foot_ik.{side}"].matrix = rig.matrix_world.inverted() @ Matrix.LocRotScale(
        Vector((xy[0], xy[1], FLOOR + sole + lift)), R.to_quaternion(), scl)
    upd()


def set_poles(yaw, knee_fwd=0.6):
    fw, l = facing(yaw)
    H = world("torso").translation
    for s, sg in (("L", 1), ("R", -1)):
        place(f"thigh_ik_target.{s}", Vector((H.x, H.y, 0.35)) + fw * knee_fwd + l * 0.12 * sg)
        S = rig.matrix_world @ pb[f"ORG-upper_arm.{s}"].head
        place(f"upper_arm_ik_target.{s}", S - fw * 0.4 - U * 0.25 + l * 0.08 * sg)


def set_hands_hang(yaw, swingL=0.0, swingR=0.0):
    fw, l = facing(yaw)
    H = world("torso").translation
    for s, sg, sw in (("L", 1, swingL), ("R", -1, swingR)):
        place(f"hand_ik.{s}", H + l * 0.21 * sg + fw * sw - U * 0.20 + U * abs(sw) * 0.25, x=fw, y=-U)


def path_points(pts, spacing=0.01):
    """Resample a polyline (list of Vector xy) evenly."""
    out = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        n = max(1, int((b - a).length / spacing))
        out += [a.lerp(b, i / n) for i in range(1, n + 1)]
    return out


def walk(frame0, pts, step=0.34, frames_per_step=9, z_stand=None, bob=0.025, swing=0.13, width=0.09, lead="L"):
    """Key a bouncy walk along pts (xy Vectors) starting at frame0. Returns (last_frame, end_xy, end_yaw)."""
    P = path_points(pts)
    L = [0.0]
    for a, b in zip(P, P[1:]):
        L.append(L[-1] + (b - a).length)
    total = L[-1]

    def at(s):
        s = max(0.0, min(total, s))
        i = max(0, min(len(L) - 2, next((k for k in range(len(L) - 1) if L[k + 1] >= s), len(L) - 2)))
        t = 0 if L[i + 1] == L[i] else (s - L[i]) / (L[i + 1] - L[i])
        p = P[i].lerp(P[i + 1], t)
        d = (P[i + 1] - P[i]).normalized() if (P[i + 1] - P[i]).length > 1e-6 else Vector((0, -1))
        return p, yaw_of(Vector((d.x, d.y, 0)))
    n_steps = max(2, round(total / step))
    step = total / n_steps
    zs = z_stand
    sides = [lead, "R" if lead == "L" else "L"]
    # plant positions: foot k plants at arc length (k)*step, offset to its side
    def plant(k, side):
        p, yw = at(k * step)
        fw, l = facing(yw)
        sg = 1 if side == "L" else -1
        return (p.to_3d() + l.normalized() * width * sg).xy, yw
    # both feet start beside the first point
    f = frame0
    # both feet start exactly where they are on the frame before the walk
    sc.frame_set(frame0 - 1)
    _, y0 = at(0)
    feet = {sd: (world(f"foot_ik.{sd}").translation.xy.copy(), y0) for sd in ("L", "R")}
    for k in range(1, n_steps + 1):
        mover = sides[(k - 1) % 2]
        other = "R" if mover == "L" else "L"
        target = plant(k, mover) if k < n_steps else plant(n_steps, mover)
        start = feet[mover]
        for sub, frac in ((0, 0.0), (1, 0.5), (2, 1.0)):
            fr = f + round(frames_per_step * frac)
            sc.frame_set(fr)
            s = (k - 1 + frac) * step
            p, yw = at(s)
            # hips: low at contact, high at passing
            z = zs - bob * (1 if frac in (0.0, 1.0) else -0.6)
            fw, l = facing(yw)
            side_sway = (1 if mover == "R" else -1) * 0.015 * (1 if frac == 0.5 else 0)
            set_hips((p.to_3d() + l * side_sway).xy, z, yw, pitch=4 if frac == 0.5 else 2)
            fx = start[0].lerp(target[0], frac)
            fyaw = start[1] + (target[1] - start[1]) * frac
            set_foot(mover, fx, fyaw, lift=0.07 if frac == 0.5 else 0.0, toe=-12 if frac == 0.5 else 0.0)
            set_foot(other, feet[other][0], feet[other][1])
            set_poles(yw)
            a = swing * (1 if mover == "L" else -1) * (1 if frac != 0.5 else 0.2)
            set_hands_hang(yw, swingL=-a, swingR=a)
            key(fr)
        feet[mover] = target
        f += frames_per_step
    # bring the trailing foot alongside to finish
    last = "R" if sides[(n_steps - 1) % 2] == "L" else "L"
    tgt = plant(n_steps, last)
    sc.frame_set(f + 3); p, yw = at(total)
    set_foot(last, feet[last][0].lerp(tgt[0], 0.5), tgt[1], lift=0.05); key(f + 3)
    sc.frame_set(f + 6); set_foot(last, tgt[0], tgt[1]); set_hips(p, zs, yw); set_poles(yw); set_hands_hang(yw); key(f + 6)
    return f + 6, p, yw
