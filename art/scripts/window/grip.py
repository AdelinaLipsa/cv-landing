"""Her grip, posed by hand: both hands cup the hot chocolate's body, like warming them on it, the handle turned away
between her fingertips, each thumb beside its index finger. Run after hands_pose.py (which imports and places the
rigged hands) and before sleeves.py. Nothing here searches or solves: every joint gets
an explicit angle, every hand an explicit place round the mug, and report() measures what touches.

The rig is the download's: per finger a knuckle (BASE = MCP), middle (MID = PIP) and tip (TOP = DIP) bone, weights
blended across each joint. A joint flexes about the axis it turns about in the download's own fist (frame 135; the
axes are copied below so no import is needed). Spread turns the knuckle sideways, about the axis across the finger.
The armature modifiers keep volume (Preserve Volume) so knuckles don't pinch when they bend.

Run with GRIP_TOOLS = True in globals to only define the tools (for posing live, a finger at a time)."""
import bpy, bmesh, math
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree
D = bpy.data
# flexion axes, bone-local, from the download's fist; HandL is the download's Object_60, HandR its Object_7
FLEX = {
    "HandL": {"INDEX_BASE": (-0.117, -0.993, -0.029), "INDEX_MID": (0.031, -1.0, 0.0), "INDEX_TOP": (0.029, -1.0, 0.0),
              "MIDDLE_F_BASE": (0.026, 0.999, 0.035), "MIDDLE_F_MID": (0.0, 1.0, 0.0), "MIDDLE_F_TOP": (0.025, -1.0, 0.0),
              "RING_BASE": (0.14, 0.988, 0.064), "RING_MID": (-0.026, 1.0, 0.0), "RING_TOP": (0.147, 0.976, 0.161),
              "PINK_BASE": (0.235, 0.968, 0.09), "PINK_MID": (-0.031, 0.999, 0.037), "PINK_TOP": (0.104, 0.926, 0.362),
              "THUMB_BASE": (-0.016, -0.605, 0.796), "THUMB_MID": (-0.06, -0.163, 0.985), "THUMB_TOP": (0.0, 0.0, -1.0)},
    "HandR": {"INDEX_BASE": (-0.136, -0.99, -0.036), "INDEX_MID": (0.031, -1.0, 0.0), "INDEX_TOP": (0.029, -1.0, 0.0),
              "MIDDLE_F_BASE": (-0.001, 1.0, 0.014), "MIDDLE_F_MID": (0.0, 1.0, 0.0), "MIDDLE_F_TOP": (0.025, -1.0, 0.0),
              "RING_BASE": (0.183, 0.983, 0.023), "RING_MID": (-0.026, 1.0, 0.0), "RING_TOP": (0.031, 0.983, 0.183),
              "PINK_BASE": (0.338, 0.941, 0.029), "PINK_MID": (-0.009, 1.0, 0.0), "PINK_TOP": (-0.079, 0.908, 0.412),
              "THUMB_BASE": (-0.304, -0.746, 0.592), "THUMB_MID": (0.0, 0.0, 1.0), "THUMB_TOP": (0.0, 0.0, -1.0)},
}
FINGERS = ("INDEX", "MIDDLE_F", "RING", "PINK")
def bn(a, key): return next(b.name for b in a.data.bones if b.name.split("_joint")[0] == key)
def pb_(a, key): return a.pose.bones[bn(a, key)]
def wp(a, key): return a.matrix_world @ pb_(a, key).head
def upd(): bpy.context.view_layer.update()
def _dir(a, key, child):   # the finger's direction in the bone's own space
    b = a.data.bones[bn(a, key)]; return (b.matrix_local.inverted() @ a.data.bones[bn(a, child)].head_local).normalized()
def finger(a, f, mcp, pip, dip, spread=0.0):
    """Flex one finger: knuckle, middle and tip joints in degrees (flexion > 0), spread in degrees at the knuckle."""
    fx = FLEX[a.name]
    for s, ang in (("BASE", mcp), ("MID", pip), ("TOP", dip)):
        q = Quaternion(Vector(fx[f"{f}_{s}"]).normalized(), math.radians(ang))
        if s == "BASE" and spread:
            ax = Vector(fx[f"{f}_BASE"]).normalized().cross(_dir(a, f"{f}_BASE", f"{f}_MID")).normalized()
            q = q @ Quaternion(ax, math.radians(spread))
        pb_(a, f"{f}_{s}").rotation_mode = "QUATERNION"; pb_(a, f"{f}_{s}").rotation_quaternion = q
        pb_(a, f"{f}_{s}").location = (0, 0, 0); pb_(a, f"{f}_{s}").scale = (1, 1, 1)
    upd()
def thumb(a, abd, rad, twist, mcp, ip):
    """The thumb, in the hand's own terms: its metacarpal leaves the palm plane by abd degrees (palmar abduction, out
    in front of the palm), turned rad degrees from the fingers' way toward the index side, rolled twist degrees about
    itself (its pad toward the mug); then its MCP and IP joints flex mcp and ip degrees."""
    fx = FLEX[a.name]; tb = pb_(a, "THUMB_BASE")
    for s in ("BASE", "MID", "TOP"):
        p = pb_(a, f"THUMB_{s}"); p.rotation_mode = "QUATERNION"; p.rotation_quaternion = (1, 0, 0, 0); p.location = (0, 0, 0); p.scale = (1, 1, 1)
    upd()
    _, F, A, N = frame(a); N = N * palm_normal_sign(a)
    h = wp(a, "THUMB_BASE"); d0 = (wp(a, "THUMB_MID") - h).normalized()
    ab, rd = math.radians(abd), math.radians(rad)
    d = (F * math.cos(rd) + A * math.sin(rd)) * math.cos(ab) + N * math.sin(ab)
    Rw = Quaternion(d, math.radians(twist)) @ d0.rotation_difference(d)
    M0t = a.matrix_world @ tb.matrix
    tb.matrix = a.matrix_world.inverted() @ (Matrix.Translation(h) @ Rw.to_matrix().to_4x4() @ Matrix.Translation(-h) @ M0t)
    pb_(a, "THUMB_MID").rotation_quaternion = Quaternion(Vector(fx["THUMB_MID"]).normalized(), math.radians(mcp))
    pb_(a, "THUMB_TOP").rotation_quaternion = Quaternion(Vector(fx["THUMB_TOP"]).normalized(), math.radians(ip))
    upd()
def rest_wrist(a):   # palm and forearm bones straight: the grip is all in the fingers and the hand's place
    for k in ("_rootJoint", "Root", "HANDPALM"):
        p = pb_(a, k); p.rotation_mode = "QUATERNION"; p.rotation_quaternion = (1, 0, 0, 0); p.location = (0, 0, 0)
    upd()
# ---------------------------------------------------------------- the mug, as the real mesh
cm = D.objects["CocoaMug"]
def mug_tree():
    bm = bmesh.new(); bm.from_object(cm, bpy.context.evaluated_depsgraph_get()); bm.transform(cm.matrix_world); bm.normal_update()
    t = BVHTree.FromBMesh(bm); bm.free(); return t
MUG = mug_tree()
AXIS = cm.matrix_world.translation.copy()           # bottom centre of the mug
def r_at(z, deg):   # the mug's outer radius at height z, at deg round it (a ray in from outside)
    u = Vector((math.cos(math.radians(deg)), math.sin(math.radians(deg)), 0))
    o = Vector((AXIS.x, AXIS.y, z)) + u * 0.2; hit = MUG.ray_cast(o, -u, 0.2)
    return 0.2 - hit[3] if hit[0] else None
def sd(p):
    loc, n, _, d = MUG.find_nearest(p, 0.3)
    return 0.3 if loc is None else (d if (p - loc).dot(n) >= 0 else -d)
def frame(a):
    """The hand's frame: palm point P, fingers' way F, index side A, palm normal N (the side fingers curl to)."""
    W = wp(a, "HANDPALM"); M = wp(a, "MIDDLE_F_BASE"); I = wp(a, "INDEX_BASE"); K = wp(a, "PINK_BASE")
    F = (M - W).normalized(); A = I - K; A = (A - F * A.dot(F)).normalized()
    return W.lerp(M, 0.55), F, A, F.cross(A)
_SIGN = {}
def palm_normal_sign(a):
    """+1 if F x A points out of the palm (the way the fingers curl), else -1: flex the middle finger and see."""
    if a.name not in _SIGN: _SIGN[a.name] = _palm_normal_sign(a)
    return _SIGN[a.name]
def _palm_normal_sign(a):
    keep = [(pb_(a, f"MIDDLE_F_{s}").rotation_mode, pb_(a, f"MIDDLE_F_{s}").rotation_quaternion.copy(), pb_(a, f"MIDDLE_F_{s}").rotation_euler.copy()) for s in ("BASE", "MID", "TOP")]
    _, F, A, N = frame(a); M = wp(a, "MIDDLE_F_BASE")
    finger(a, "MIDDLE_F", 0, 0, 0); t0 = wp(a, "MIDDLE_F_UP_TOP"); finger(a, "MIDDLE_F", 60, 60, 30); t1 = wp(a, "MIDDLE_F_UP_TOP")
    for s, (m, q, e) in zip(("BASE", "MID", "TOP"), keep):
        p = pb_(a, f"MIDDLE_F_{s}"); p.rotation_mode = m; p.rotation_quaternion = q; p.rotation_euler = e
    upd(); return 1 if (t1 - t0).dot(N) > 0 else -1
def place(a, deg, z, wrap, tilt=0.0, lean=0.0, yaw=0.0, off=0.0, forearm_to=None, wrist_max=50):
    """Put the hand's palm against the mug at deg round it and height z: palm toward the axis, fingers running round
    the mug (wrap +1 counter-clockwise seen from above, -1 clockwise), index side up. tilt turns the fingers down
    (degrees, about the palm normal), lean tips the palm up (about the fingers' way), yaw turns the fingers in toward
    the mug (about the index side). off: palm point's distance from
    the mug's surface (the palm's own thickness). forearm_to: a point the forearm turns toward at the wrist (by at
    most wrist_max degrees), the hand staying where it holds."""
    P0, F0, A0, N0 = frame(a); N0 = N0 * palm_normal_sign(a)
    u = Vector((math.cos(math.radians(deg)), math.sin(math.radians(deg)), 0)); t = Vector((-u.y, u.x, 0)) * wrap
    N1, F1, A1 = -u, t, Vector((0, 0, 1))
    R_t = Matrix.Rotation(math.radians(-tilt * wrap), 3, N1); F1, A1 = R_t @ F1, R_t @ A1
    R_l = Matrix.Rotation(math.radians(lean), 3, F1); A1, N1 = R_l @ A1, R_l @ N1
    R_y = Matrix.Rotation(math.radians(yaw * wrap), 3, A1); F1, N1 = R_y @ F1, R_y @ N1
    R = Matrix((F1, A1, N1)).transposed() @ Matrix((F0, A0, N0)).transposed().inverted()
    P1 = Vector((AXIS.x, AXIS.y, z)) + u * ((r_at(z, deg) or 0.046) + off)
    a.matrix_world = Matrix.Translation(P1) @ R.to_4x4() @ Matrix.Translation(-P0) @ a.matrix_world; upd()
    if forearm_to:
        w = wp(a, "HANDPALM"); q = (wp(a, "Root") - w).normalized().rotation_difference((Vector(forearm_to) - w).normalized())
        if q.angle > math.radians(wrist_max): q = Quaternion(q.axis, math.radians(wrist_max))
        hp = pb_(a, "HANDPALM"); Mh = a.matrix_world @ hp.matrix
        a.matrix_world = Matrix.Translation(w) @ q.to_matrix().to_4x4() @ Matrix.Translation(-w) @ a.matrix_world; upd()
        hp.matrix = a.matrix_world.inverted() @ Mh; upd()
def parts(a):
    me = a.children[0]; g = {x.index: x.name for x in me.vertex_groups}; out = {}
    for v in me.data.vertices:
        if not v.groups: continue
        n = g[max(v.groups, key=lambda e: e.weight).group].split("_joint")[0]
        out.setdefault(n, []).append(v.index)
    return out
def report(a, keys=None):
    """mm from the mug for each part of the hand: its nearest point (negative = inside). Nothing changes."""
    upd(); dg = bpy.context.evaluated_depsgraph_get(); hm = a.children[0].evaluated_get(dg); mw = hm.matrix_world
    vs = hm.data.vertices; out = {}
    for k, idx in parts(a).items():
        if keys and not any(k.startswith(x) for x in keys): continue
        out[k] = round(min(sd(mw @ vs[i].co) for i in idx) * 1000, 1)
    out["z"] = {f: round(wp(a, f + "_BASE").z, 3) for f in FINGERS}
    out["deg"] = {f: round(math.degrees(math.atan2(wp(a, f + "_UP_TOP").y - AXIS.y, wp(a, f + "_UP_TOP").x - AXIS.x))) for f in FINGERS + ("THUMB",)}
    return out
def fix_normals():
    """The download's mirrored hand carries mirrored custom normals, so it shades inside out (see-through, torn at the
    thumb's web): drop them and point every face outward, smooth shaded. Both hands, so they shade alike."""
    for h in ("HandLMesh", "HandRMesh"):
        o = D.objects[h]; me = o.data
        if me.has_custom_normals:
            with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o], selected_editable_objects=[o]):
                bpy.ops.mesh.customdata_custom_splitnormals_clear()
        bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
        for poly in me.polygons: poly.use_smooth = True
def preserve_volume():
    for h in ("HandLMesh", "HandRMesh"):
        for m in D.objects[h].modifiers:
            if m.type == "ARMATURE": m.use_deform_preserve_volume = True
# ---------------------------------------------------------------- her grip
# her left hand where it always sat, a little forward so its fingertips stop short of the handle (turned away from her,
# cocoa.py); her right hand its mirror (place: 180 - deg, lean flipped; same joint angles, within a few degrees); each
# thumb lies beside its index finger like a fifth finger round the side of the mug, below the rim; every pad 1-3 mm off
# the ceramic, nothing inside it (the palms sit a few mm off so the thenar doesn't sink)
POSE = globals().get("GRIP_POSE") or {
    "HandL": {"PLACE": {"deg": -142, "z": 1.171, "wrap": -1, "off": 0.029, "yaw": 16, "lean": -5, "forearm_to": (-0.40, -0.5, 0.9)},
              "INDEX": (15, 30, 0, 0), "MIDDLE_F": (20, 25, 15, 0), "RING": (20, 15, 15, 0), "PINK": (10, 15, 5, 0), "THUMB": (0, 45, 0, 15, 10)},
    "HandR": {"PLACE": {"deg": -38, "z": 1.171, "wrap": 1, "off": 0.031, "yaw": 16, "lean": 5, "forearm_to": (0.26, -0.5, 0.9)},
              "INDEX": (15, 30, 0, 0), "MIDDLE_F": (20, 25, 10, 0), "RING": (20, 15, 15, 0), "PINK": (15, 10, 0, 0), "THUMB": (5, 40, 0, 10, 5)},
}
if not globals().get("GRIP_TOOLS"):
    preserve_volume(); fix_normals()
    for h, p in POSE.items():
        a = D.objects[h]; rest_wrist(a)
        for f in FINGERS: finger(a, f, *p[f])
        thumb(a, *p["THUMB"])
        if "PLACE" in p: place(a, **p["PLACE"])   # else the hand stays where hands_pose.py put it
        print(h, report(a))
