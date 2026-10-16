"""ToDesk, frames 398-458: a coffee break between the typing and the yawn. Her right hand leaves the keys, takes
the mug off wing B, she sips (head back, eyes on the screen), sets it down and goes back to the keys. Everything
ToDesk keyed after 398 (the yawn, the walk back, the chair, wheels and guitar) moves 60 frames later; ToDesk runs
1-646. The mug is a live object now ("Mug", out of the room bake), keyed to her hand while she holds it.
exec() after anim_lib.py:  STEP = "shift" | "mug" | "sip", then exec(open(ART + "/scripts/clip_sip.py").read())"""
import bpy, bmesh, math
from mathutils import Vector, Matrix

D = bpy.data
T0, GAP = 398, 60
ACTIONS = ["ToDesk", "Guitar_ToDesk", "ChairAction", "ChairSeatAction"] + [f"ChairWheel{i}Action.001" for i in range(5)]
MUG_AT = Vector((-0.68, 1.3, 0.0))
DZ = 0.75     # desk top (build_desk.py)


def shift():
    """Every key after T0 moves GAP later; T0's key is copied to T0 + GAP, so the yawn starts on the same pose."""
    for an in ACTIONS:
        for fc in fcurves(D.actions[an]):
            kps = fc.keyframe_points
            v0 = fc.evaluate(T0)
            for kp in sorted([k for k in kps if k.co.x > T0 + 0.5], key=lambda k: -k.co.x):
                kp.co.x += GAP; kp.handle_left.x += GAP; kp.handle_right.x += GAP
            kps.insert(T0 + GAP, v0)
            fc.update()
    sc.frame_end = max(sc.frame_end, 586 + GAP)
    print("ToDesk shifted:", T0, "->", T0 + GAP)


def hexc(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c) + (1,)


def pmat(name, hex_, rough, coat=0.0):
    m = D.materials.get(name) or D.materials.new(name); m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = hexc(hex_); b.inputs["Roughness"].default_value = rough
    if "Coat Weight" in b.inputs: b.inputs["Coat Weight"].default_value = coat
    return m


def make_mug():
    """The mug from build_desk.py as one live mesh, its origin on the bottom so it sits on the desk at z = DZ."""
    if "Mug" in D.objects: D.objects.remove(D.objects["Mug"])
    bm = bmesh.new()
    def ring(r, z, n=32): return [bm.verts.new((r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n), z)) for i in range(n)]
    def band(a, b, m):
        for i in range(len(a)): bm.faces.new((a[i], a[(i + 1) % len(a)], b[(i + 1) % len(a)], b[i])).material_index = m
    o_bot, o_top, i_top, i_bot = ring(0.040, 0.0), ring(0.042, 0.095), ring(0.037, 0.095), ring(0.035, 0.006)
    band(o_bot, o_top, 0); band(o_top, i_top, 0); band(i_top, i_bot, 0)
    bm.faces.new(o_bot[::-1]).material_index = 0                                 # the base
    cof = ring(0.0365, 0.078); bm.faces.new(cof).material_index = 1              # coffee, a few cm down
    # the handle: a torus segment on +X, an ellipse 2.5 x 3 cm, tube 6.5 mm
    seg, tube = 20, 8
    rows = []
    for i in range(seg + 1):
        a = -math.pi / 2 + math.pi * i / seg
        cx, cz = 0.042 + 0.022 * math.cos(a), 0.048 + 0.03 * math.sin(a)
        t = Vector((-0.022 * math.sin(a), 0, 0.03 * math.cos(a))).normalized(); nrm = Vector((math.cos(a), 0, math.sin(a))).normalized()
        b2 = t.cross(nrm)
        rows.append([bm.verts.new(Vector((cx, 0, cz)) + 0.0065 * (math.cos(2 * math.pi * k / tube) * nrm + math.sin(2 * math.pi * k / tube) * b2)) for k in range(tube)])
    for i in range(seg): band(rows[i], rows[i + 1], 0)
    me = D.meshes.new("Mug"); bm.normal_update(); bm.to_mesh(me); bm.free()
    for m in (pmat("Mug_Navy", "#2E2B6B", 0.25, 0.4), pmat("Mug_Coffee", "#2A170E", 0.1)): me.materials.append(m)
    for p in me.polygons: p.use_smooth = True
    mug = D.objects.new("Mug", me); sc.collection.objects.link(mug)
    mug.location = MUG_AT + Vector((0, 0, DZ)); mug.rotation_euler = (0, 0, math.radians(-120))
    return mug


GRAB, LIFT, MOUTH, SIP0, SIP1, AWAY, DOWN, SET, LET = 413, 417, 424, 428, 436, 441, 447, 449, 452


def sip():
    """Her right hand: keys -> mug handle -> mouth (a long sip, head back) -> desk -> keys. The mug is then keyed
    to her real (deformed) hand bone every frame she holds it, so it never slips off the mitten."""
    mug = D.objects["Mug"]
    sc.frame_set(T0)
    rest = {n: world(n).copy() for n in ("hand_ik.R", "upper_arm_ik_target.R", "head", "chest")}
    torso = world("torso").translation
    hands = (world("hand_ik.L").translation + world("hand_ik.R").translation) / 2
    fw = hands - torso; fw.z = 0; fw.normalize()
    l = U.cross(fw).normalized()                                    # her left
    teeth = D.objects["Teeth lower.001"]
    mouth = sum((teeth.matrix_world @ Vector(c) for c in teeth.bound_box), Vector()) / 8
    M0 = mug.matrix_world.copy()
    handle = (M0.to_3x3() @ Vector((1, 0, 0))).normalized()
    hpt = M0 @ Vector((0.064, 0, 0.048))                            # the handle's middle
    to_her = (torso - hpt); to_her.z = 0; to_her.normalize()

    def hand_at(f, M):
        pb["hand_ik.R"].matrix = rig.matrix_world.inverted() @ M; upd()   # the whole matrix: drinking is a wrist roll
        S = rig.matrix_world @ pb["ORG-upper_arm.R"].head
        place("upper_arm_ik_target.R", S - fw * 0.3 - U * 0.3 - l * 0.35)
        key(f, ["hand_ik.R", "upper_arm_ik_target.R"])

    # the grip: wrist 5 cm out from the handle, fingers through it toward the mug
    grip = Matrix.LocRotScale(hpt + to_her * 0.05, (-to_her).to_track_quat("Y", "Z"), Vector((1, 1, 1)))
    off = M0.inverted() @ grip                                      # the hand, in the mug's frame
    def mug_m(pos, tilt):                                           # the mug at pos, tipped toward her mouth
        R = Matrix.Rotation(math.radians(tilt), 4, -l)                # about her right: the rim tips toward her
        return Matrix.Translation(pos) @ R @ Matrix.Translation(-pos) @ Matrix.Translation(pos - M0.translation) @ M0
    at_mouth = mouth + fw * 0.05 - U * 0.05                         # the mug's base, its rim at her lips once tipped
    beats = [(GRAB - 9, Matrix.Translation(U * 0.06) @ grip),        # reach, a little above
             (GRAB - 3, Matrix.Translation(U * 0.015) @ grip),
             (GRAB, grip),
             (LIFT, mug_m(M0.translation + U * 0.06, 0) @ off),
             (MOUTH, mug_m(at_mouth, 24) @ off),
             (SIP0, mug_m(at_mouth + U * 0.012, 50) @ off),
             (SIP1, mug_m(at_mouth + U * 0.018, 58) @ off),
             (AWAY, mug_m(at_mouth - fw * 0.03 - U * 0.03, 12) @ off),
             (DOWN, mug_m(M0.translation + U * 0.012, 0) @ off),
             (SET, grip),
             (LET, Matrix.Translation(U * 0.04 - to_her * 0.02) @ grip)]
    for f, M in beats: sc.frame_set(f); hand_at(f, M)
    # head and chest: lean into the sip, head back as the mug tips, then back to the screen
    for f, back, lean in ((MOUTH, 6, 3), (SIP0, 16, -3), (SIP1, 22, -5), (AWAY, 4, 0)):
        sc.frame_set(f)
        for n, M in rest.items():
            if n in ("head", "chest"): pb[n].matrix = rig.matrix_world.inverted() @ M
        upd()
        turn("chest", l, -lean)
        turn("head", l, -back)
        key(f, ["head", "chest"])
    for f in (T0, LET + 2):
        sc.frame_set(f)
        for n in ("head", "chest"): pb[n].matrix = rig.matrix_world.inverted() @ rest[n]
        upd(); key(f, ["head", "chest"])
    # "ahh": a smile as the mug comes down
    for f, v in ((SIP1, 0.0), (AWAY + 1, 0.8), (LET + 4, 0.0)):
        rig["mouth_smile"] = v; rig.keyframe_insert('["mouth_smile"]', frame=f)

    # the mug: on the desk, then in her hand (keyed to ORG-hand.R every frame she holds it), then on the desk
    sc.frame_set(GRAB)
    hand0 = rig.matrix_world @ pb["ORG-hand.R"].matrix
    rel = hand0.inverted() @ M0
    mug.animation_data_clear()
    ad = mug.animation_data_create(); a = D.actions.get("Mug_ToDesk")
    if a: D.actions.remove(a)
    a = D.actions.new("Mug_ToDesk"); a.use_fake_user = True; ad.action = a
    mug.matrix_world = M0
    for f in (1, GRAB - 1): mug.keyframe_insert("location", frame=f); mug.keyframe_insert("rotation_euler", frame=f)
    for f in range(GRAB, SET + 1):
        sc.frame_set(f)
        mug.matrix_world = (rig.matrix_world @ pb["ORG-hand.R"].matrix) @ rel if f < SET else M0
        mug.keyframe_insert("location", frame=f); mug.keyframe_insert("rotation_euler", frame=f)
    mug.matrix_world = M0
    for f in (SET + 1, 646): mug.keyframe_insert("location", frame=f); mug.keyframe_insert("rotation_euler", frame=f)
    for fc in fcurves(a):
        for k in fc.keyframe_points: k.interpolation = "LINEAR"
    print("sip keyed", T0, "->", T0 + GAP)
