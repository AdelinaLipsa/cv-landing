"""ToDesk, frames 446-END: push off the desk and roll back, stand, walk back to the bed while the empty chair
drifts round to where it started, then frames 47..1 replayed backwards (sit, pick the guitar up) so the
last frame is frame 1 again. exec() after anim_lib.py."""
chair = bpy.data.objects["Chair"]
seat = bpy.data.objects["ChairSeat"]
guitar = bpy.data.objects["Guitar"]
SEAT_REST = -43.9
ORIG_FRONT = -111.9
SEAT_TOP = 0.549 - 0.005
SIT_Z = 0.16
C0 = Vector((-0.82, 0.78))
zst = sc["_stand"][2]


def prune(o, f0, f1=10000):
    if o.animation_data and o.animation_data.action:
        for fc in fcurves(o.animation_data.action):
            for i in reversed(range(len(fc.keyframe_points))):
                if f0 <= fc.keyframe_points[i].co.x <= f1:
                    fc.keyframe_points.remove(fc.keyframe_points[i])


for o in (rig, chair, seat, guitar):
    prune(o, 447)
for w in [c for c in chair.children if c.name.startswith("ChairWheel")]:
    prune(w, 1)

sc.frame_set(446)
A0 = math.degrees(seat.rotation_euler.z)
C3 = chair.matrix_world.translation.xy.copy()


def chair_at(frame, xy, local_deg):
    sc.frame_set(frame)
    chair.location = (xy[0], xy[1], 0.005)
    seat.rotation_euler = (0, 0, math.radians(local_deg))
    chair.keyframe_insert("location", frame=frame)
    seat.keyframe_insert("rotation_euler", frame=frame)
    bpy.context.view_layer.update()


def sit_here(frame, C, yaw, lean=0.0, feet=0.60, hands="thighs"):
    sc.frame_set(frame)
    fw, l = facing(yaw)
    set_hips((C.to_3d() + fw * 0.04).xy, 0.005 + SEAT_TOP + SIT_Z, yaw, pitch=lean)
    for s, sg in (("L", 1), ("R", -1)):
        set_foot(s, (C.to_3d() + fw * feet + l * 0.12 * sg).xy, yaw)
    set_poles(yaw, knee_fwd=0.7)
    if hands == "thighs":
        for s, sg in (("L", 1), ("R", -1)):
            th = (rig.matrix_world @ pb[f"ORG-thigh.{s}"].tail) * 0.35 + (rig.matrix_world @ pb[f"ORG-thigh.{s}"].head) * 0.65
            place(f"hand_ik.{s}", th + U * 0.08 + l * 0.03 * sg, x=fw, y=fw * 0.5 - U * 0.8)
            S = rig.matrix_world @ pb[f"ORG-upper_arm.{s}"].head
            place(f"upper_arm_ik_target.{s}", S - fw * 0.4 - U * 0.25 + l * 0.08 * sg)
    key(frame)


# ---- 446-472: push off the desk, roll back to the chair's home, swivel to face the room
TOWARD_ROOM = 35.0      # toward the room, away from the hat on the bed frame
local_room = A0 + ((TOWARD_ROOM - (SEAT_REST + A0) + 540) % 360 - 180)
chair_at(446, C3, A0)
chair_at(452, C3, A0)
chair_at(462, C3.lerp(C0, 0.8), A0 + (local_room - A0) * 0.7)
chair_at(468, C0, local_room + 6)
chair_at(472, C0, local_room)
sit_here(452, C3, SEAT_REST + A0, lean=8)
sit_here(462, C3.lerp(C0, 0.8), SEAT_REST + A0 + (local_room - A0) * 0.7, lean=-4, feet=0.42)
sit_here(468, C0, SEAT_REST + local_room + 6, lean=0, feet=0.48)
sit_here(472, C0, TOWARD_ROOM, lean=2)

# ---- 472-490: stand up: lean in, push on the knees, rise (a touch past), settle
fw, l = facing(TOWARD_ROOM)
feet_xy = {s: (C0.to_3d() + fw * 0.56 + l * 0.11 * sg).xy for s, sg in (("L", 1), ("R", -1))}
stand_xy = (C0.to_3d() + fw * 0.52).xy
sc.frame_set(478)
set_hips((C0.to_3d() + fw * 0.14).xy, 0.005 + SEAT_TOP + SIT_Z, TOWARD_ROOM, pitch=26)
for s in "LR":
    set_foot(s, feet_xy[s], TOWARD_ROOM)
set_poles(TOWARD_ROOM)
for s, sg in (("L", 1), ("R", -1)):
    th = (rig.matrix_world @ pb[f"ORG-thigh.{s}"].tail)
    place(f"hand_ik.{s}", th + U * 0.06, x=fw, y=fw * 0.4 - U * 0.9)
key(478)
for fr, z, p in ((485, zst + 0.02, -3), (490, zst, 0)):
    sc.frame_set(fr)
    set_hips(stand_xy, z, TOWARD_ROOM, pitch=p)
    for s in "LR":
        set_foot(s, feet_xy[s], TOWARD_ROOM)
    set_poles(TOWARD_ROOM)
    set_hands_hang(TOWARD_ROOM)
    key(fr)

# the empty chair drifts round to where it started as she walks off (ease out, small wobble)
local_home = local_room + ((ORIG_FRONT - (SEAT_REST + local_room) + 540) % 360 - 180)
chair_at(490, C0, local_room)
chair_at(510, C0, local_room + (local_home - local_room) * 0.8)
chair_at(524, C0, local_home + 4)
chair_at(532, C0, local_home)

# ---- 490-: walk back to where she stood up from the bed (frame 47)
sc.frame_set(47)
target_hips = world("torso").translation.xy.copy()
pts = [stand_xy, Vector((-0.02, 0.36)), Vector((0.40, 0.46)), target_hips + Vector((-0.10, -0.14))]
end_f, end_xy, end_yaw = walk(491, pts, z_stand=zst, lead="L")

# ---- turn on the spot to face the room like at frame 47 (two shuffles), then hold frame 47's pose
snap47 = {}
sc.frame_set(47)
snap47 = snapshot()
yaw47 = 20.0
for k, t in enumerate((0.5, 1.0)):
    fr = end_f + 5 * (k + 1)
    sc.frame_set(fr)
    yw = end_yaw + ((yaw47 - end_yaw + 540) % 360 - 180) * t
    p = end_xy.lerp(target_hips, t)
    set_hips(p, zst, yw)
    fw, l = facing(yw)
    for s, sg in (("L", 1), ("R", -1)):
        set_foot(s, (p.to_3d() + l * 0.10 * sg + fw * 0.06).xy, yw, lift=0.05 if (k == 0 and s == "R") else 0)
    set_poles(yw)
    set_hands_hang(yw)
    key(fr)
T = end_f + 16                      # frame 47's pose lands here
sc.frame_set(T)
restore(snap47)
key(T)

# ---- frames 47..1 backwards: sit down on the bed, pick the guitar up, back to strumming
def mirror(o, f_from=1, f_to=47):
    if not (o.animation_data and o.animation_data.action):
        return
    for fc in fcurves(o.animation_data.action):
        src = [(kp.co.x, kp.co.y) for kp in fc.keyframe_points if f_from <= kp.co.x <= f_to]
        for x, y in src:
            if x == f_to:
                continue
            k = fc.keyframe_points.insert(T + (f_to - x), y)
            k.interpolation = "BEZIER"
            k.handle_left_type = k.handle_right_type = "AUTO_CLAMPED"
        fc.update()


mirror(rig)
# guitar: it rests against the bed until the pick-up starts (frame 25 backwards), then mirrors 25..1
sc.frame_set(25)
lean_mw = guitar.matrix_world.copy()
sc.frame_set(T)
guitar.matrix_world = lean_mw
key_obj(guitar, T)
mirror(guitar)
END = T + 46
sc["_day_end"] = END
for fc in fcurves(seat.animation_data.action) + fcurves(chair.animation_data.action):
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"
print("return keyed 446 ->", END, "| walk", 491, "->", end_f, "| frame 47 pose at", T)
