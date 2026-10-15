"""The bed click reaction, its own action 'ReactBed' (frames 1-72, 24 fps), plus 'Guitar_ReactBed' for the guitar.
Starts and ends exactly on Strum frame 1 (on the bed edge, guitar in her lap) so it blends back into Strum.
Beats: startle (jolt up, shoulders up, head snaps to the View camera, the guitar jostles with her), a smile at
the camera, the right (strumming) hand leaves the strings and waves hi beside her head, palm to the camera,
then back to the strings as the smile fades. The left hand rides the guitar neck throughout.
Right arm is FK in Strum, so the wave is built in FK (limb lengths can't change). exec() after anim_lib.py."""
SRC = bpy.data.actions["Strum"]
GUIT = bpy.data.objects["Guitar"]
VIEW = bpy.data.objects["View"].matrix_world.translation.copy()
day = rig.animation_data.action
g_day = GUIT.animation_data.action
F_END = 72

# ---- the source pose: Strum frame 1, every channel Strum keys
rig.animation_data.action = SRC
GUIT.animation_data.action = bpy.data.actions["Guitar_ToDesk"]   # Strum plays with the guitar where ToDesk starts it
sc.frame_set(1)
BONES = sorted({fc.data_path.split('"')[1] for fc in fcurves(SRC) if fc.data_path.startswith("pose.bones")
                and not fc.data_path.endswith('"]')} | {"shoulder.L", "shoulder.R"})
REF = {b.name: (b.location.copy(), b.rotation_quaternion.copy(), b.rotation_euler.copy(), b.scale.copy()) for b in pb}
PROPV = {(b, p): pb[b][p] for b, p in PROPS if p in pb[b]}
G0 = GUIT.matrix_world.copy()
CH0 = world("chest").copy()
HL0, PL0 = world("hand_ik.L").copy(), world("upper_arm_ik_target.L").copy()
SL = rig.matrix_world @ pb["ORG-upper_arm.L"].head
SR = rig.matrix_world @ pb["ORG-upper_arm.R"].head
l = Vector((SL - SR).xy.to_3d()).normalized()      # her left
fw = l.cross(U)                                     # her forward

for name in ("ReactBed", "Guitar_ReactBed"):
    if name in bpy.data.actions:
        bpy.data.actions.remove(bpy.data.actions[name])
act = bpy.data.actions.new("ReactBed"); act.use_fake_user = True
gact = bpy.data.actions.new("Guitar_ReactBed"); gact.use_fake_user = True
rig.animation_data.action = act
GUIT.animation_data.action = gact


def base():
    for n, (lo, rq, re, s) in REF.items():
        b = pb[n]
        b.location, b.rotation_quaternion, b.rotation_euler, b.scale = lo, rq, re, s
    for (b, p), v in PROPV.items():
        pb[b][p] = v
    GUIT.matrix_world = G0
    upd()


def mouth(frame, smile=0.0):
    rig["mouth_smile"] = smile
    rig["mouth_yawn"] = 0.0
    rig.keyframe_insert('["mouth_smile"]', frame=frame)
    rig.keyframe_insert('["mouth_yawn"]', frame=frame)


def look(a, tilt=0.0):
    """Turn neck (40%) and head (the rest) so the face (head +Z) points at the camera, by fraction a."""
    for n, share in (("neck", 0.4), ("head", 1.0)):
        m = world("head")
        eye = m.translation + m.to_3x3().normalized().col[1] * 0.12
        face = m.to_3x3().normalized().col[2]
        q = face.rotation_difference((VIEW - eye).normalized())
        ax, ang = q.to_axis_angle()
        turn(n, ax, math.degrees(ang) * a * share)
    if tilt:
        turn("head", fw, tilt)


def jolt(a, jostle=0.0):
    """Startle: hips pop up, chest leans back, shoulders shrug; the guitar rides the chest and jostles (tilts and hops)."""
    p = world("torso").translation
    place("torso", p + U * 0.035 * a - fw * 0.01 * a)
    turn("chest", l, -6 * a)
    turn("shoulder.L", fw, 12 * a)
    turn("shoulder.R", fw, -12 * a)
    D = world("chest") @ CH0.inverted()                      # the guitar rides her chest
    c = (D @ G0).translation
    J = Matrix.Translation(c + U * 0.004 * abs(jostle)) @ Matrix.Rotation(math.radians(jostle), 4, fw) @ Matrix.Translation(-c)
    GUIT.matrix_world = J @ D @ G0
    upd()
    Dg = GUIT.matrix_world @ G0.inverted()
    pb["hand_ik.L"].matrix = rig.matrix_world.inverted() @ (Dg @ HL0)
    pb["upper_arm_ik_target.L"].matrix = rig.matrix_world.inverted() @ (Dg @ PL0)
    upd()


def wave(swing):
    """Right FK arm up beside her head, out to the side and forward, palm (hand -X) to the camera.
    swing rotates the forearm about the camera axis through the elbow (the side-to-side wave)."""
    S = world("upper_arm_fk.R").translation
    C = (VIEW - S).normalized()
    E = S + (-l * 0.15 + fw * 0.15 + U * 0.08).normalized() * pb["upper_arm_fk.R"].length
    F = Quaternion(C, math.radians(22 * swing)) @ (U * 0.95 - l * 0.05 + fw * 0.05).normalized()
    up_y = (E - S).normalized()
    place("upper_arm_fk.R", y=up_y, x=up_y.cross(F))           # hinge axis: the rig's natural elbow bend
    place("forearm_fk.R", y=F, x=up_y.cross(F))
    place("hand_fk.R", y=(F + C * 0.15).normalized(), x=-C)    # palm faces the camera


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
    GUIT.keyframe_insert("location", frame=frame)
    GUIT.keyframe_insert("rotation_euler", frame=frame)


base(); kf(1); mouth(1)
base(); jolt(1.0, 5); look(0.9); kf(5)                        # JOLT: up, shrug, head snaps to camera
base(); jolt(0.3, 1.5); look(1.05); kf(8)                     # drop back, the guitar settles
base(); jolt(0.08); look(1.0); kf(12); mouth(10)
base(); look(1.0); kf(16)
mouth(19, 1.0)
base(); look(1.0, tilt=-3); wave(0); kf(29)                   # hand up beside her head
for fr, s in ((33, 1), (38, -1), (43, 1), (48, -1)):            # two full side-to-side waves
    base(); look(1.0, tilt=3 * s); wave(s); kf(fr)
base(); look(1.0, tilt=-2); wave(0); kf(52)
mouth(54, 1.0)
base(); look(0.5); kf(64)                                     # hand back on the strings
mouth(66, 0.0)
base(); look(0.1); kf(68)
base(); kf(F_END); mouth(F_END)

for fc in fcurves(act) + fcurves(gact):
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"
rig.animation_data.action = day
GUIT.animation_data.action = g_day
sc.frame_set(1)
print(f"ReactBed keyed 1-{F_END}")
