"""ToDesk, frames 81-232: grab the chair and swivel it to face her, turn, plop (the chair rolls back),
spin about 2.5 turns with feet tucked, then grab the desk and pull herself in. exec() after anim_lib.py."""
chair = bpy.data.objects["Chair"]
seat = bpy.data.objects["ChairSeat"]
wheels = sorted([o for o in chair.children if o.name.startswith("ChairWheel")], key=lambda o: o.name)
SEAT_REST = -43.9           # world yaw the seat front faces when ChairSeat rotation_euler is 0 (measured)
ORIG_FRONT = -111.9         # how the room has the chair: facing the window-side desk
SEAT_TOP = 0.549 - 0.005    # seat surface above the chair root
SIT_Z = 0.16                # her hips above the seat surface
DESK_Z = 0.75


def chair_at(frame, xy, front_yaw):
    sc.frame_set(frame)
    chair.location = (xy[0], xy[1], 0.005)
    seat.rotation_euler = (0, 0, math.radians(front_yaw - SEAT_REST))
    chair.keyframe_insert("location", frame=frame)
    seat.keyframe_insert("rotation_euler", frame=frame)
    bpy.context.view_layer.update()


def chair_now():
    return chair.matrix_world.translation.xy.copy(), SEAT_REST + math.degrees(seat.rotation_euler.z)


def hands_on_thighs(yaw):
    fw, l = facing(yaw)
    for s, sg in (("L", 1), ("R", -1)):
        th = (rig.matrix_world @ pb[f"ORG-thigh.{s}"].tail) * 0.6 + (rig.matrix_world @ pb[f"ORG-thigh.{s}"].head) * 0.4
        place(f"hand_ik.{s}", th + U * 0.07 + fw * 0.03, x=fw, y=fw * 0.7 - U * 0.7)


def sit(frame, feet="floor", squash=0.0, lean=0.0, hands="thighs", feet_world=None):
    """Seated on the chair as it is on this frame. feet: floor | tuck | keep (feet_world xy list)."""
    sc.frame_set(frame)
    C, yaw = chair_now()
    fw, l = facing(yaw)
    set_hips((C.to_3d() + fw * 0.04).xy, 0.005 + SEAT_TOP + SIT_Z - squash, yaw, pitch=lean)
    for s, sg in (("L", 1), ("R", -1)):
        if feet == "tuck":
            set_foot(s, (C.to_3d() + fw * 0.36 + l * 0.11 * sg).xy, yaw, lift=0.24, toe=10)
        elif feet == "keep":
            set_foot(s, feet_world[s], yaw)
        else:
            set_foot(s, (C.to_3d() + fw * 0.60 + l * 0.12 * sg).xy, yaw)
    set_poles(yaw, knee_fwd=0.7)
    if hands == "thighs":
        hands_on_thighs(yaw)
    key(frame)


def roll_wheels(f0, f1):
    """Turn each caster about its axle by the distance the chair travels (no slipping)."""
    for w in wheels:
        w.rotation_mode = "QUATERNION"
        if w.animation_data:
            w.animation_data_clear()
        d = w.dimensions
        ax_local = Vector([1 if i == min(range(2), key=lambda k: d[k]) else 0 for i in range(3)])
        r = w.get("wheel_r", 0.02)
        ang = 0.0
        sc.frame_set(f0)
        prev = w.matrix_world.translation.copy()
        for fr in range(f0, f1 + 1):
            sc.frame_set(fr)
            p = w.matrix_world.translation.copy()
            axle = (w.matrix_world.to_3x3() @ ax_local)
            axle.z = 0
            roll_dir = U.cross(axle).normalized() if axle.length > 1e-6 else Vector((1, 0, 0))
            ang += (p - prev).dot(roll_dir) / r
            prev = p
            w.rotation_quaternion = Quaternion(ax_local, ang)
            w.keyframe_insert("rotation_quaternion", frame=fr)


# ---- prune anything already keyed in this range
for o in (rig, chair, seat):
    if o.animation_data and o.animation_data.action:
        for fc in fcurves(o.animation_data.action):
            for i in reversed(range(len(fc.keyframe_points))):
                if 82 <= fc.keyframe_points[i].co.x <= 400:
                    fc.keyframe_points.remove(fc.keyframe_points[i])
zst = sc["_stand"][2]
C0 = Vector((-0.82, 0.78))
chair_at(1, C0, ORIG_FRONT)
chair_at(84, C0, ORIG_FRONT)

# 81-88: a shuffle step closer, reach for the backrest (it faces her)
sc.frame_set(81)
y0 = sc["_walk_end"][3]
sc.frame_set(87)
fw, l = facing(y0)
set_hips(Vector((-0.40, 0.47)), zst - 0.01, y0, pitch=8)
for s, sg in (("L", 1), ("R", -1)):
    set_foot(s, (Vector((-0.40, 0.47, 0)) + l * 0.09 * sg + fw * 0.02).xy, y0)
set_poles(y0)
back_top = C0.to_3d() - facing(ORIG_FRONT)[0] * 0.24 + Vector((0, 0, 0.92))
for s, sg in (("L", 1), ("R", -1)):
    place(f"hand_ik.{s}", back_top + l * 0.09 * sg, x=fw, y=fw * 0.6 - U * 0.4)
key(87)

# 88-98: pull it out a little and flick the seat round to face her (overshoot, settle)
C1 = Vector((-0.72, 0.56))
face_her = yaw_of((Vector((-0.30, 0.40)) - C1).to_3d())
chair_at(92, C0.lerp(C1, 0.7), ORIG_FRONT + 60)
sc.frame_set(92)
set_hips(Vector((-0.28, 0.40)), zst - 0.01, y0, pitch=4)
for s, sg in (("L", 1), ("R", -1)):
    set_foot(s, (Vector((-0.18, 0.35, 0)) + l * 0.10 * sg).xy, y0)
set_poles(y0)
set_hands_hang(y0)
key(92)
chair_at(95, C1, face_her + 14)
chair_at(98, C1, face_her - 4)
chair_at(101, C1, face_her)

# 98-108: turn round, back to the seat
sit_front = facing(face_her)[0]
stand_xy = (C1.to_3d() + sit_front * 0.52).xy
for fr, t in ((101, 0.5), (106, 1.0)):
    sc.frame_set(fr)
    yw = y0 + ((face_her - y0 + 540) % 360 - 180) * t
    fw, l = facing(yw)
    p = Vector((-0.28, 0.40)).lerp(stand_xy, t)
    set_hips(p, zst - 0.01, yw)
    for s, sg in (("L", 1), ("R", -1)):
        set_foot(s, (p.to_3d() + l * 0.10 * sg + fw * 0.02).xy, yw, lift=0.09 if (fr == 101 and s == "L") else 0)
    set_poles(yw)
    set_hands_hang(yw)
    key(fr)

# 106-113: anticipation, a little crouch, arms forward
yw = face_her
fw, l = facing(yw)
feet_plant = {s: (stand_xy.to_3d() + l * 0.11 * sg + fw * 0.06).xy for s, sg in (("L", 1), ("R", -1))}
sc.frame_set(112)
set_hips((stand_xy.to_3d() - fw * 0.06).xy, zst - 0.10, yw, pitch=18)
for s in "LR":
    set_foot(s, feet_plant[s], yw)
set_poles(yw)
for s, sg in (("L", 1), ("R", -1)):
    place(f"hand_ik.{s}", world("torso").translation + fw * 0.30 + l * 0.15 * sg + U * 0.05, x=fw, y=fw)
key(112)

# 113-117: plop! squash on landing, the chair shoots back
chair_at(113, C1, face_her)
sit(117, feet="floor", squash=0.025, lean=-6)
C2 = (C1.to_3d() - sit_front * 0.13).xy
chair_at(117, (C1.to_3d() - sit_front * 0.03).xy, face_her)
chair_at(121, (C1.to_3d() - sit_front * 0.15).xy, face_her)
chair_at(125, C2, face_her - 3)
chair_at(129, C2, face_her)
sit(121, feet="floor", squash=-0.012, lean=4)
sit(125, feet="floor", lean=0)
sit(129, feet="floor")

# 129-136: tuck the feet, lean back, wind up
sit(135, feet="tuck", lean=-8)

# 136-200: about 2.5 spins, fast then slowing, ending facing the monitor
END_YAW = -135.0
start = face_her
delta = ((END_YAW - start) % 360) + 720
for fr in range(136, 201, 1):
    t = (fr - 136) / 64
    a = delta * (1 - (1 - t) ** 2.4)
    chair_at(fr, C2, start + a)
    sit(fr, feet="tuck", lean=-8 + 6 * t)
chair_at(204, C2, start + delta + 4)
chair_at(208, C2, start + delta)
sit(204, feet="tuck", lean=-2)

# 208-214: feet down, reach both hands to the desk edge
desk_L = Vector((-1.22, 0.58, DESK_Z + 0.02))   # well clear of the Siamese at y 0.86
desk_R = Vector((-0.88, 1.08, DESK_Z + 0.02))
def hands_on_desk():
    fw, l = facing(END_YAW)
    place("hand_ik.L", desk_L, x=-fw, y=fw * 0.8 - U * 0.3)
    place("hand_ik.R", desk_R, x=-fw, y=fw * 0.8 - U * 0.3)
sit(213, feet="floor", lean=18, hands=None)
hands_on_desk(); key(213)

# 213-232: pull in, two tugs, the chair overshoots a touch and settles
C3 = Vector((-0.98, 0.98))
fwE = facing(END_YAW)[0]
for fr, t, lean in ((219, 0.55, 10), (222, 0.6, 12), (228, 1.04, 4), (232, 1.0, 2)):
    chair_at(fr, C2.lerp(C3, t), start + delta)   # keep the wound-up angle: no extra turns
    sit(fr, feet="floor", lean=lean, hands=None)
    hands_on_desk()
    key(fr)

roll_wheels(1, 232)
for fc in fcurves(chair.animation_data.action) + fcurves(seat.animation_data.action):
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"
sc["_chair_end"] = 232
print("chair sequence keyed 81-232")
