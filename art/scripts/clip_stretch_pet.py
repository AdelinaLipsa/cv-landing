"""ToDesk, frames 232-300: stretch the hands out toward the monitor (knuckle-crack pulse, shake out),
swivel toward the Siamese and pet her three times, swivel back. Typing then runs 300-398
(clip_typing.py keyed at 232-330 and shifted +68 here). exec() after anim_lib.py and clip_typing.py."""
chair = bpy.data.objects["Chair"]
seat = bpy.data.objects["ChairSeat"]
SEAT_REST = -43.9
SEAT_TOP = 0.549 - 0.005
SIT_Z = 0.16
SHIFT = 68

# ---- move the typing keys (233-330) to 301-398 (iterate from the end so keys don't collide)
for fc in fcurves(rig.animation_data.action):
    pts = sorted([kp for kp in fc.keyframe_points if 233 <= kp.co.x <= 330], key=lambda k: -k.co.x)
    for kp in pts:
        kp.co.x += SHIFT
        kp.handle_left.x += SHIFT
        kp.handle_right.x += SHIFT
    fc.update()
sc["_typing_end"] = 330 + SHIFT

# the wound-up seat angle that means "facing the monitor"
sc.frame_set(232)
A_END = math.degrees(seat.rotation_euler.z)       # local angle at the end of the spin
C3 = chair.matrix_world.translation.xy.copy()


def seat_at(frame, extra_deg):
    sc.frame_set(frame)
    chair.location = (C3.x, C3.y, 0.005)
    seat.rotation_euler = (0, 0, math.radians(A_END + extra_deg))
    chair.keyframe_insert("location", frame=frame)
    seat.keyframe_insert("rotation_euler", frame=frame)
    bpy.context.view_layer.update()


def body(frame, extra_deg, lean=0.0, roll=0.0):
    """Seated, turned with the seat, feet on the floor."""
    sc.frame_set(frame)
    yaw = SEAT_REST + A_END + extra_deg
    fw, l = facing(yaw)
    set_hips((C3.to_3d() + fw * 0.04).xy, 0.005 + SEAT_TOP + SIT_Z, yaw, pitch=lean, roll=roll)
    for s, sg in (("L", 1), ("R", -1)):
        set_foot(s, (C3.to_3d() + fw * 0.60 + l * 0.12 * sg).xy, yaw)
    set_poles(yaw, knee_fwd=0.7)
    return yaw, fw, l


def arm_poles(fw, l):
    for s, sg in (("L", 1), ("R", -1)):
        S = rig.matrix_world @ pb[f"ORG-upper_arm.{s}"].head
        place(f"upper_arm_ik_target.{s}", S - fw * 0.3 - U * 0.3 + l * 0.35 * sg)


# ---- 232-262: the stretch
yaw, fw, l = body(238, 0, lean=4)
chest = world("torso").translation + U * 0.38
place("hand_ik.L", chest + fw * 0.22 + l * 0.04, x=fw, y=l * -1)
place("hand_ik.R", chest + fw * 0.22 - l * 0.04, x=fw, y=l)
arm_poles(fw, l); key(238)                                   # hands meet at the chest, fingers laced
for fr, reach, up in ((244, 0.34, 0.06), (248, 0.37, 0.08), (250, 0.34, 0.08), (252, 0.37, 0.08)):
    yaw, fw, l = body(fr, 0, lean=-6)
    place("hand_ik.L", chest + fw * reach + U * up + l * 0.03, x=fw, y=-l)
    place("hand_ik.R", chest + fw * reach + U * up - l * 0.03, x=fw, y=l)
    arm_poles(fw, l); key(fr)                                # push out, crack, crack
for k, fr in enumerate((255, 257, 259, 261)):                # shake them out
    yaw, fw, l = body(fr, 0, lean=0)
    j = 0.04 if k % 2 == 0 else -0.04
    place("hand_ik.L", chest + fw * 0.25 + l * 0.20 + U * j - U * 0.05, x=fw, y=-U)
    place("hand_ik.R", chest + fw * 0.25 - l * 0.20 - U * j - U * 0.05, x=fw, y=-U)
    arm_poles(fw, l); key(fr)
seat_at(232, 0); seat_at(262, 0)

# ---- 262-296: swivel toward the Siamese and pet her
cat = bpy.data.objects["Siamese"]
cat_pts = [o.matrix_world @ Vector(c) for o in cat.children_recursive if o.type == "MESH" for c in o.bound_box]
cat_top = max(p.z for p in cat_pts)
cat_c = sum(cat_pts, Vector()) / len(cat_pts)
to_cat = yaw_of((cat_c - chair.matrix_world.translation).normalized())
turn_to = ((to_cat - (SEAT_REST + A_END)) + 540) % 360 - 180
turn_to = max(-75, min(75, turn_to * 0.8))                   # turn partly, then lean the rest
seat_at(268, turn_to + (4 if turn_to > 0 else -4))
seat_at(271, turn_to)
yaw, fw, l = body(268, turn_to, lean=10)
hands_free = world("torso").translation
key(268)
cat_fw = (cat_c - chair.matrix_world.translation); cat_fw.z = 0; cat_fw.normalize()
head_pt = cat_c + cat_fw * -0.0 + U * 0.0
head_pt = Vector((cat_c.x, cat_c.y, cat_top + 0.06))   # the mitten rests on her fur, not in it
side = "L" if (cat_c - world("torso").translation).dot(l) > 0 else "R"
other = "R" if side == "L" else "L"
back_dir = -facing(yaw_of(Vector((0, 0, 0)) - Vector((0, 0, 0))) if False else 0)[0] if False else None
# stroke from the head along her back: three strokes, the hand lifts between them
for k in range(3):
    f0 = 272 + k * 8
    yaw, fw, l = body(f0, turn_to, lean=10, roll=(10 if side == "L" else -10))
    place(f"hand_ik.{side}", head_pt + U * 0.01, x=fw, y=-U)
    key(f0)
    yaw, fw, l = body(f0 + 5, turn_to, lean=10, roll=(10 if side == "L" else -10))
    place(f"hand_ik.{side}", head_pt - cat_fw * 0.10 + U * -0.025, x=fw, y=-U)
    key(f0 + 5)
yaw, fw, l = body(296, turn_to, lean=8)
key(296)
seat_at(296, turn_to)
seat_at(301, 0)
yaw, fw, l = body(301, 0, lean=12)
key(301, ["torso", "foot_ik.L", "foot_ik.R", "thigh_ik_target.L", "thigh_ik_target.R"])
print("stretch 232-262, petting the Siamese 262-296 with the", side, "hand, typing 301-398")
