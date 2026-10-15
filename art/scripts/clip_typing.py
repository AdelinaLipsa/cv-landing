"""ToDesk, frames 232-330: frantic cartoon typing with a head bob, two dramatic key smashes and a
satisfied final hit. exec() after anim_lib.py (and after clip_chair.py has keyed the chair)."""
KB = Vector((-1.30, 1.30, 0.815))   # the near edge of the keys      # keyboard centre, just above the keycaps
YAW = -135.0
fw, l = facing(YAW)
base = {}


def prune(f0, f1):
    for fc in fcurves(rig.animation_data.action):
        for i in reversed(range(len(fc.keyframe_points))):
            if f0 <= fc.keyframe_points[i].co.x <= f1:
                fc.keyframe_points.remove(fc.keyframe_points[i])


prune(233, 400)
sc.frame_set(232)
for n in ("torso", "chest", "head", "foot_ik.L", "foot_ik.R", "thigh_ik_target.L", "thigh_ik_target.R"):
    base[n] = world(n).copy()
SL = rig.matrix_world @ pb["ORG-upper_arm.L"].head
SR = rig.matrix_world @ pb["ORG-upper_arm.R"].head


def hands(frame, zl=0.0, zr=0.0, spread=0.085, fwd=0.0):
    sc.frame_set(frame)
    for n in base:
        pb[n].matrix = rig.matrix_world.inverted() @ base[n]
    upd()
    place("hand_ik.L", KB + l * spread + fw * fwd + U * zl, x=-fw, y=fw * 0.6 - U * 0.8)
    place("hand_ik.R", KB - l * spread + fw * fwd + U * zr, x=-fw, y=fw * 0.6 - U * 0.8)
    for s, sg in (("L", 1), ("R", -1)):
        S = SL if s == "L" else SR
        place(f"upper_arm_ik_target.{s}", S - fw * 0.3 - U * 0.3 + l * 0.35 * sg)


def lean(deg):
    turn("chest", l, deg)


def nod(deg, side=0.0):
    turn("head", l, deg)
    if side:
        turn("head", fw, side)


# 232-238: hands from the desk edge to the keyboard, lean in
hands(238, 0.03, 0.03); lean(16); key(238)
# 238-264: frantic typing, hands alternate every 2 frames, head bobs every 6
f = 240
i = 0
while f <= 262:
    up = 0.035 if i % 2 == 0 else 0.0
    hands(f, up, 0.035 - up, spread=0.085 + 0.01 * ((i // 3) % 2), fwd=0.01 * (i % 3 - 1)); lean(16)
    nod(-6 if (f // 6) % 2 else 2, side=3 if (f // 12) % 2 else -3)
    key(f)
    f += 2; i += 1
# 264-270: wind up both hands high... SMASH
hands(266, 0.20, 0.20, spread=0.10); lean(2); nod(8); key(266)
hands(270, 0.0, 0.0, spread=0.08); lean(16); nod(-12); key(270)
hands(274, 0.01, 0.01); lean(18); nod(-4); key(274)
# 274-296: more typing, a bit faster
f = 276
i = 0
while f <= 294:
    up = 0.04 if i % 2 == 0 else 0.0
    hands(f, up, 0.04 - up, spread=0.08 + 0.012 * ((i // 2) % 2)); lean(17)
    nod(-7 if (f // 4) % 2 else 3, side=4 if (f // 8) % 2 else -4)
    key(f)
    f += 2; i += 1
# 296-304: second smash, right hand only, big wind-up
hands(298, 0.0, 0.24, spread=0.09); lean(4); nod(6, side=-6); key(298)
hands(302, 0.0, 0.0, spread=0.09); lean(16); nod(-10); key(302)
hands(306, 0.01, 0.01); lean(18); key(306)
# 306-318: a few quick taps, then the final Enter: right hand flicks up and away, satisfied lean back
for k, fr in enumerate((308, 310, 312, 314)):
    up = 0.03 if k % 2 == 0 else 0.0
    hands(fr, up, 0.03 - up); lean(17); nod(-5 if k % 2 else 2); key(fr)
hands(318, 0.0, 0.0, spread=0.09); lean(18); nod(-6); key(318)              # the hit
hands(322, 0.0, 0.18, spread=0.09, fwd=-0.12); lean(-4); nod(10, side=6); key(322)   # flourish
hands(330, 0.0, 0.10, spread=0.10, fwd=-0.08); lean(-6); nod(8, side=4); key(330)    # proud hold

for fc in fcurves(rig.animation_data.action):
    for kp in fc.keyframe_points:
        if 238 <= kp.co.x <= 316:
            kp.interpolation = "LINEAR"      # snappy typing; the smashes read as hits
sc["_typing_end"] = 330
print("typing keyed 232-330")
