"""ToDesk, frames 398-446: lean back, arms up overhead, a big yawn, then slump. exec() after anim_lib.py."""
chair = bpy.data.objects["Chair"]
seat = bpy.data.objects["ChairSeat"]
SEAT_REST = -43.9
SEAT_TOP = 0.549 - 0.005
SIT_Z = 0.16

for fc in fcurves(rig.animation_data.action):
    for i in reversed(range(len(fc.keyframe_points))):
        if 399 <= fc.keyframe_points[i].co.x <= 460:
            fc.keyframe_points.remove(fc.keyframe_points[i])
sc.frame_set(398)
A = math.degrees(seat.rotation_euler.z)
C = chair.matrix_world.translation.xy.copy()
YAW = SEAT_REST + A


def body(frame, lean=0.0, slide=0.0, sink=0.0):
    sc.frame_set(frame)
    fw, l = facing(YAW)
    set_hips((C.to_3d() + fw * (0.04 + slide)).xy, 0.005 + SEAT_TOP + SIT_Z - sink, YAW, pitch=lean)
    for s, sg in (("L", 1), ("R", -1)):
        set_foot(s, (C.to_3d() + fw * (0.60 + slide) + l * 0.12 * sg).xy, YAW)
    set_poles(YAW, knee_fwd=0.7)
    return fw, l


def arms_up(fw, l, height, spread, back):
    top = world("torso").translation + U * height - fw * back
    for s, sg in (("L", 1), ("R", -1)):
        place(f"hand_ik.{s}", top + l * spread * sg, x=fw, y=U)
        S = rig.matrix_world @ pb[f"ORG-upper_arm.{s}"].head
        place(f"upper_arm_ik_target.{s}", S + l * 0.4 * sg - fw * 0.1)


def mouth(frame, yawn=0.0, smile=0.0):
    rig["mouth_yawn"] = yawn
    rig["mouth_smile"] = smile
    rig.keyframe_insert('["mouth_yawn"]', frame=frame)
    rig.keyframe_insert('["mouth_smile"]', frame=frame)


mouth(1, 0, 0); mouth(398, 0, 0)
# 398-406: lean back, hands come up past the face
fw, l = body(406, lean=-10)
arms_up(fw, l, 0.62, 0.14, 0.02); turn("head", l, -8); key(406); mouth(406, 0.15)
# 406-414: full stretch, arms high, head back, yawn opens
fw, l = body(414, lean=-16)
arms_up(fw, l, 0.86, 0.10, 0.06); turn("head", l, -18); key(414); mouth(414, 1.0)
# 414-424: hold the stretch, a little tremble of effort
fw, l = body(419, lean=-17)
arms_up(fw, l, 0.88, 0.09, 0.07); turn("head", l, -20); key(419); mouth(419, 1.0)
fw, l = body(424, lean=-16)
arms_up(fw, l, 0.86, 0.11, 0.06); turn("head", l, -16); key(424); mouth(424, 0.85)
# 424-434: arms drop, mouth closes
fw, l = body(430, lean=-4, slide=0.02, sink=0.01)
for s, sg in (("L", 1), ("R", -1)):
    place(f"hand_ik.{s}", world("torso").translation + l * 0.27 * sg - fw * 0.04 + U * 0.16, x=fw, y=-U)   # down beside her, not over the desk
turn("head", l, 6); key(430); mouth(430, 0.2)
# 434-446: slump, satisfied little smile
fw, l = body(440, lean=-9, slide=-0.02, sink=0.03)
for s, sg in (("L", 1), ("R", -1)):
    th = (rig.matrix_world @ pb[f"ORG-thigh.{s}"].tail) * 0.25 + (rig.matrix_world @ pb[f"ORG-thigh.{s}"].head) * 0.75
    place(f"hand_ik.{s}", th + U * 0.08 - fw * 0.02 + l * 0.04 * sg, x=fw, y=fw * 0.5 - U * 0.8)   # near the hips, clear of the desk
    S = rig.matrix_world @ pb[f"ORG-upper_arm.{s}"].head
    place(f"upper_arm_ik_target.{s}", S - fw * 0.4 - U * 0.25 + l * 0.08 * sg)
turn("head", l, 10); key(440); mouth(436, 0.0, 0.0); mouth(440, 0.0, 0.6)
fw, l = body(446, lean=-8, slide=-0.02, sink=0.03); key(446); mouth(446, 0.0, 0.5)
sc["_yawn_end"] = 446
print("stretch and yawn keyed 398-446")
