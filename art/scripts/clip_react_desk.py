"""The desk click reaction, its own action 'ReactDesk' (frames 1-72, 24 fps), plus 'Chair_ReactDesk',
'ChairSeat_ReactDesk' and 'ChairWheel0-4_ReactDesk'. Starts and ends exactly on ToDesk frame 330 (seated, typing).
Beats: startle WITH the chair (she pops up, the chair shoots back a few cm and the seat wobbles, the wheels roll),
a sheepish head drop, then she swivels the seat and twists her upper body round toward the View camera (behind
her) and waves hi with the right hand beside her head, then turns back and scoots in to the keyboard.
Her arms are IK at the desk, so the wave is built in IK (IK_Stretch 0: limb lengths can't change).
Wheel roll follows clip_chair.py's convention. exec() after anim_lib.py."""
SRC = bpy.data.actions["ToDesk"]
SRC_FRAME = 330
F_END = 72
chair = bpy.data.objects["Chair"]
seat = bpy.data.objects["ChairSeat"]
wheels = sorted([o for o in chair.children if o.name.startswith("ChairWheel")], key=lambda o: o.name)
VIEW = bpy.data.objects["View"].matrix_world.translation.copy()
HEAD_MAX = 80.0                 # most the neck + head turn away from the chest
ROLL_MAX = 105.0                # most the wave hand rolls off the forearm's hinge

# ---- the source pose: ToDesk 330, every channel ToDesk keys
rig.animation_data.action = SRC
sc.frame_set(SRC_FRAME)
BONES = sorted({fc.data_path.split('"')[1] for fc in fcurves(SRC) if fc.data_path.startswith("pose.bones")
                and not fc.data_path.endswith('"]')} | {"shoulder.L", "shoulder.R"})
REF = {b.name: (b.location.copy(), b.rotation_quaternion.copy(), b.rotation_euler.copy(), b.scale.copy()) for b in pb}
PROPV = {(b, p): pb[b][p] for b, p in PROPS if p in pb[b]}
SMILE0, YAWN0 = rig["mouth_smile"], rig["mouth_yawn"]
C0, SEAT0 = chair.location.copy(), seat.rotation_euler.copy()
WQ0 = {w.name: w.rotation_quaternion.copy() for w in wheels}
SL = rig.matrix_world @ pb["ORG-upper_arm.L"].head
SR = rig.matrix_world @ pb["ORG-upper_arm.R"].head
l = Vector((SL - SR).xy.to_3d()).normalized()      # her left
fw = l.cross(U)                                     # her forward (to the monitor)
AXIS = C0.copy()                                    # the seat swivels about the chair's post
LU = ((rig.matrix_world @ pb["ORG-forearm.R"].head) - SR).length      # world lengths (the rig object is scaled)
LF = ((rig.matrix_world @ pb["ORG-hand.R"].head) - (rig.matrix_world @ pb["ORG-forearm.R"].head)).length

# ---- fresh actions; the day actions are put back at the end
day = {o: o.animation_data.action for o in [rig, chair, seat] + wheels}
NEW = {rig: "ReactDesk", chair: "Chair_ReactDesk", seat: "ChairSeat_ReactDesk"}
NEW.update({w: f"{w.name}_ReactDesk" for w in wheels})
for o, name in NEW.items():
    if name in bpy.data.actions:
        bpy.data.actions.remove(bpy.data.actions[name])
    a = bpy.data.actions.new(name)
    a.use_fake_user = True
    o.animation_data.action = a


def base():
    for n, (lo, rq, re, s) in REF.items():
        b = pb[n]
        b.location, b.rotation_quaternion, b.rotation_euler, b.scale = lo, rq, re, s
    for (b, p), v in PROPV.items():
        pb[b][p] = v
    chair.location, seat.rotation_euler = C0, SEAT0
    upd()


def chair_pose(back=0.0, side=0.0, swivel=0.0, knees=False):
    """Move the chair (back = toward the camera, metres) and swivel the seat (deg, + = to her left); her hips ride along."""
    off = -fw * back - l * side
    chair.location = C0 + off
    seat.rotation_euler = (SEAT0.x, SEAT0.y, SEAT0.z + math.radians(swivel))
    P = AXIS + off
    M = Matrix.Translation(P) @ Matrix.Rotation(math.radians(swivel), 4, "Z") @ Matrix.Translation(-AXIS)
    pb["torso"].matrix = rig.matrix_world.inverted() @ (M @ world("torso"))
    for s in "LR":                                   # on the big swivel the knees follow the hips round, feet pivot in place
        if knees:
            pb[f"thigh_ik_target.{s}"].matrix = rig.matrix_world.inverted() @ (M @ world(f"thigh_ik_target.{s}"))
            turn(f"foot_ik.{s}", U, swivel * 0.5)
    upd()


def jolt(a):
    """Startle: pop up off the cushion, chest back, shoulders shrug, hands fly up off the keys."""
    place("torso", world("torso").translation + U * 0.025 * a)
    turn("chest", l, -7 * a)
    turn("shoulder.L", fw, 12 * a)
    turn("shoulder.R", fw, -12 * a)
    turn("head", l, -8 * a)
    hands(lift=0.09 * a, back=0.05 * a)


def hands(lift=0.0, back=0.0, only="LR"):
    for s in only:
        place(f"hand_ik.{s}", world(f"hand_ik.{s}").translation + U * lift - fw * back)


def sheepish(a):
    turn("neck", l, 10 * a)
    turn("head", l, 16 * a)
    turn("shoulder.L", fw, 7 * a)
    turn("shoulder.R", fw, -7 * a)


def face(n):
    m = world(n).to_3x3().normalized()
    return m.col[2], world(n).translation + m.col[1] * 0.12


def look(a):
    """Neck (40%) and head (the rest) turn the face toward the camera: a yaw of at most HEAD_MAX off the chest's
    forward, lifted at most 15 deg (the camera is behind and above her: aiming straight at it would crick her neck back)."""
    fc = world("chest").to_3x3().normalized() @ FW_IN_CHEST
    fc = Vector((fc.x, fc.y, 0)).normalized()
    for n, share in (("neck", 0.4), ("head", 1.0)):
        f, eye = face("head")
        to = VIEW - eye
        h = Vector((to.x, to.y, 0)).normalized()
        yaw = math.degrees(math.atan2(fc.cross(h).z, fc.dot(h)))
        yaw = max(-HEAD_MAX, min(HEAD_MAX, yaw))
        d = Quaternion(U, math.radians(yaw)) @ fc
        el = math.radians(min(15.0, math.degrees(math.atan2(to.z, to.xy.length))))
        Z = d * math.cos(el) + U * math.sin(el)
        Y = (U - Z * U.dot(Z)).normalized()                           # head upright: no cocked roll
        want = Matrix((Y.cross(Z), Y, Z)).transposed().to_quaternion()
        q = want @ world("head").to_quaternion().inverted()
        if q.w < 0:
            q.negate()                                                 # the short way round
        ax, ang = q.to_axis_angle()
        turn(n, ax, math.degrees(ang) * a * share)


def roll(s="R"):
    """Twist of the hand about its own Y relative to the forearm (deg, 0 = rest)."""
    rest = (rig.data.bones[f"ORG-forearm.{s}"].matrix_local.inverted() @ rig.data.bones[f"ORG-hand.{s}"].matrix_local).to_quaternion()
    q = rest.inverted() @ (pb[f"ORG-forearm.{s}"].matrix.inverted() @ pb[f"ORG-hand.{s}"].matrix).to_quaternion()
    return math.degrees(2 * math.atan2(q.y, q.w))


def wave(swing, t=1.0):
    """Right IK arm up beside her head, out to the side and a little forward; palm (hand -X) toward the camera
    as far as the wrist allows. swing rotates the forearm about the camera axis through the elbow.
    t < 1 blends from where the hand is now (lifting off the keys) toward the wave pose."""
    H0, P0 = world("hand_ik.R").copy(), world("upper_arm_ik_target.R").copy()
    cf = world("chest").to_3x3().normalized()
    lc, fc = cf @ L_IN_CHEST, cf @ FW_IN_CHEST
    S = rig.matrix_world @ pb["ORG-upper_arm.R"].head
    C = (VIEW - S).normalized()
    up_y = (-lc * 0.15 + fc * 0.10 + U * 0.08).normalized()
    E = S + up_y * LU
    F = Quaternion(C, math.radians(22 * swing)) @ (U * 0.95 - lc * 0.05 + fc * 0.05).normalized()
    W = E + F * LF
    hinge = up_y.cross(F).normalized()
    hy = (F - C * 0.1).normalized()
    want = -C - hy * (-C).dot(hy)
    h0 = hinge - hy * hinge.dot(hy)
    ang = h0.normalized().angle(want.normalized())
    sgn = 1 if h0.cross(want).dot(hy) > 0 else -1
    hx = Quaternion(hy, sgn * math.radians(min(math.degrees(ang), ROLL_MAX))) @ h0.normalized()
    place("hand_ik.R", W, x=hx, y=hy)
    place("upper_arm_ik_target.R", E + (E - (S + W) * 0.5).normalized() * 0.35)
    if t < 1:
        for n, M0 in (("hand_ik.R", H0), ("upper_arm_ik_target.R", P0)):
            a, b = M0.decompose(), world(n).decompose()
            pb[n].matrix = rig.matrix_world.inverted() @ Matrix.LocRotScale(a[0].lerp(b[0], t), a[1].slerp(b[1], t), b[2])
            upd()
        d = ROLL0 - roll()       # the blend must not wring the wrist: typing and the wave share this roll (about -107)
        turn("hand_ik.R", world("hand_ik.R").to_3x3().normalized().col[1], (d + 180) % 360 - 180)


def turned(a, swing=None, t=1.0):
    chair_pose(back=0.045, swivel=-30 * a, knees=True)
    turn("chest", U, -30 * a)
    look(a)
    if swing is not None:
        wave(swing, t)


def mouth(frame, smile=0.0):
    rig["mouth_smile"], rig["mouth_yawn"] = smile, YAWN0
    rig.keyframe_insert('["mouth_smile"]', frame=frame)
    rig.keyframe_insert('["mouth_yawn"]', frame=frame)


def kf(frame):
    for n in BONES:
        b = pb[n]
        if b.rotation_quaternion.dot(REF[n][1]) < 0:     # same hemisphere as the source pose: no flips between keys
            b.rotation_quaternion = -b.rotation_quaternion
        b.keyframe_insert("location", frame=frame)
        b.keyframe_insert("rotation_quaternion" if b.rotation_mode == "QUATERNION" else "rotation_euler", frame=frame)
        b.keyframe_insert("scale", frame=frame)
    for b, p in PROPV:
        pb[b].keyframe_insert(f'["{p}"]', frame=frame)
    chair.keyframe_insert("location", frame=frame)
    seat.keyframe_insert("rotation_euler", frame=frame)


base()
_cf = world("chest").to_3x3().normalized().inverted()
ROLL0 = roll()
L_IN_CHEST, FW_IN_CHEST = _cf @ l, _cf @ fw

base(); kf(1); mouth(1, SMILE0)
base(); chair_pose(0.04, 0.01, 6); jolt(1.0); kf(4)            # STARTLE: she pops, the chair shoots back
base(); chair_pose(0.05, 0.012, -4); jolt(0.35); kf(7)         # rolls on a touch, the seat wobbles back
base(); chair_pose(0.045, 0.01, 2); jolt(0.1); kf(10)
base(); chair_pose(0.045); hands(0.05, 0.04); kf(13)
base(); chair_pose(0.045); hands(0.03, 0.05); sheepish(1.0); kf(17)   # oops: head drops
base(); chair_pose(0.045); hands(0.03, 0.05); sheepish(0.9); kf(20)
for fr, a in ((26, 0.35), (32, 0.75)):                                             # swivel round, the hand rises
    base(); turned(a); hands(0.05, 0.06); wave(0, a); kf(fr)
mouth(24, 0.0)
base(); turned(1.0, 0); hands(0.05, 0.06, only="L"); kf(38); mouth(36, 1.0)      # facing the camera, hand up
for fr, s in ((41, 1), (45, -1), (49, 1)):                                         # side-to-side waves
    base(); turned(1.0, s); hands(0.05, 0.06, only="L"); kf(fr)
base(); turned(1.0, 0); hands(0.05, 0.06, only="L"); kf(52)
mouth(54, 1.0)
for fr, a in ((57, 0.75), (62, 0.35)):                                             # hand comes down, turning back
    base(); turned(a); hands(0.05, 0.06); wave(0, a); kf(fr)
base(); chair_pose(0.045); hands(0.04, 0.04); kf(66); mouth(68, SMILE0)          # back round to the desk
base(); chair_pose(0.01); kf(70)                                                  # scoot in
base(); kf(F_END); mouth(F_END, SMILE0)

for o, name in NEW.items():
    for fc in fcurves(bpy.data.actions[name]):
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"

# ---- wheels: roll each caster about its axle by the distance it travels (clip_chair.roll_wheels), on top of frame 330
for w in wheels:
    d = w.dimensions
    ax_local = Vector([1 if i == min(range(2), key=lambda k: d[k]) else 0 for i in range(3)])
    r = w.get("wheel_r", 0.02)
    ang = 0.0
    sc.frame_set(1)
    prev = w.matrix_world.translation.copy()
    for fr in range(1, F_END + 1):
        sc.frame_set(fr)
        p = w.matrix_world.translation.copy()
        axle = w.matrix_world.to_3x3() @ ax_local
        axle.z = 0
        roll_dir = U.cross(axle).normalized() if axle.length > 1e-6 else Vector((1, 0, 0))
        ang += (p - prev).dot(roll_dir) / r
        prev = p
        w.rotation_quaternion = WQ0[w.name] @ Quaternion(ax_local, ang)
        w.keyframe_insert("rotation_quaternion", frame=fr)
    w.rotation_quaternion = WQ0[w.name]
    w.keyframe_insert("rotation_quaternion", frame=F_END)   # lands exactly on the 330 pose

for o, a in day.items():
    o.animation_data.action = a
sc.frame_set(SRC_FRAME)
print(f"ReactDesk keyed 1-{F_END}")
