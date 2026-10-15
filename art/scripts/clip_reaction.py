"""The click reaction, its own action 'Reaction' (frames 1-72): startle, wave with a grin, settle.
Authored on the standing pose of ToDesk frame 47 with IK hands. On the site it plays additively over the
upper body (relative to its own frame 1); the head turn toward the camera is procedural. exec() after anim_lib.py."""
day = rig.animation_data.action
sc.frame_set(47)
ref = snapshot()
props = {(b, p): pb[b][p] for b, p in PROPS if p in pb[b]}

act = bpy.data.actions.get("Reaction") or bpy.data.actions.new("Reaction")
for fc in fcurves(act):
    fc.keyframe_points.clear()
act.use_fake_user = True
rig.animation_data.action = act
YAW = 20.0
fw, l = facing(YAW)


def base():
    restore(ref)
    for (b, p), v in props.items():
        pb[b][p] = v
    for s in "LR":
        pb[f"upper_arm_parent.{s}"]["IK_FK"] = 0.0
    upd()
    set_hands_hang(YAW)
    for s, sg in (("L", 1), ("R", -1)):
        S = rig.matrix_world @ pb[f"ORG-upper_arm.{s}"].head
        place(f"upper_arm_ik_target.{s}", S - fw * 0.4 - U * 0.25 + l * 0.08 * sg)


def mouth(frame, smile=0.0, yawn=0.0):
    rig["mouth_smile"] = smile
    rig["mouth_yawn"] = yawn
    rig.keyframe_insert('["mouth_smile"]', frame=frame)
    rig.keyframe_insert('["mouth_yawn"]', frame=frame)


def startle(a):
    turn("chest", l, -9 * a)
    turn("head", l, -14 * a)
    for s, sg in (("L", 1), ("R", -1)):
        h = world(f"hand_ik.{s}").translation
        place(f"hand_ik.{s}", h + l * 0.10 * a * sg + U * 0.12 * a + fw * 0.04 * a)
        if f"shoulder.{s}" in pb:
            turn(f"shoulder.{s}", fw, 14 * a * sg)


def wave(swing):
    S = rig.matrix_world @ pb["ORG-upper_arm.R"].head
    elbow = S - l * 0.26 + U * 0.02 + fw * 0.09
    hand = elbow + U * 0.21 + fw * 0.06 - l * 0.10 * swing      # out to the side and forward, clear of the head
    place("hand_ik.R", hand, x=fw, y=U)
    place("upper_arm_ik_target.R", S - l * 0.45 - U * 0.15 + fw * 0.05)


def kf(frame):
    key(frame)
    for n in ("shoulder.L", "shoulder.R"):
        if n in pb:
            pb[n].keyframe_insert("rotation_quaternion", frame=frame)


base(); kf(1); mouth(1)
base(); startle(1.0); kf(4); mouth(4)
base(); startle(1.25); kf(6)
base(); startle(0.55); kf(10)
base(); startle(0.15); kf(16)
base(); wave(0); turn("head", l, 4); kf(22); mouth(22, smile=1.0)
for i, fr in enumerate(range(28, 53, 6)):
    base(); wave(1 if i % 2 == 0 else -1); turn("head", fw, 4 if i % 2 == 0 else -3); kf(fr)
mouth(52, smile=1.0)
base(); wave(0); kf(56)
base(); kf(66); mouth(64, smile=0.0)
base(); kf(72); mouth(72)
for fc in fcurves(act):
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"
rig.animation_data.action = day
sc.frame_set(1)
print("Reaction action keyed 1-72 (IK hands)")
