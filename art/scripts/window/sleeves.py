"""Her arms in her black jumper, at the real hands' proportions (her toy character's arms are twice their size):
for each arm, a shoulder a little below and behind her eyes, an elbow where a real forearm (24 cm) and upper arm
(28 cm) meet, and one knit sleeve from shoulder to a ribbed cuff just short of the wrist, fuller up the arm.
A soft knit chest joins the shoulders. The download's forearm ends inside the cuff."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
kill("Sleeve"); kill("Cuff"); kill("Chest")
knit = D.objects["Jumper"].data.materials[0]
EYE = D.objects["ViewCam"].location.copy()
SH = {"L": EYE + Vector((-0.17, -0.07, -0.19)), "R": EYE + Vector((0.17, -0.07, -0.19))}
LF, LU = 0.24, 0.28
def bn_(a, k): return next(b.name for b in a.data.bones if b.name.startswith(k))
def elbow_for(S, d, Sh):
    """The elbow: on the circle where the forearm (from the cuff) and the upper arm (from the shoulder) meet,
    nearest to the forearm carried straight back, and a little low and out (the way an elbow hangs)."""
    v = Sh - S; D_ = v.length
    if D_ >= LF + LU: return S + v.normalized() * LF
    u = v.normalized(); a_ = (LF * LF - LU * LU + D_ * D_) / (2 * D_); h = math.sqrt(max(0.0, LF * LF - a_ * a_))
    P_ = S + u * a_
    e1 = u.cross(Vector((0, 0, 1))); e1 = e1.normalized() if e1.length > 1e-6 else Vector((1, 0, 0)); e2 = u.cross(e1).normalized()
    want = S - d * LF + Vector((0, 0, -0.08)) + Vector((-0.06 if (Sh.x < S.x) else 0.06, 0, 0))
    best = min((P_ + (e1 * math.cos(t) + e2 * math.sin(t)) * h for t in [i * math.tau / 72 for i in range(72)]), key=lambda q: (q - want).length)
    return best
for side, h in (("L", "HandL"), ("R", "HandR")):
    a = D.objects[h]
    root = a.matrix_world @ a.pose.bones[bn_(a, "Root_joint")].head
    wrist = a.matrix_world @ a.pose.bones[bn_(a, "HANDPALM")].head
    d = (wrist - root).normalized()
    start = root + d * 0.052                                        # the cuff stops just short of the wrist
    E = elbow_for(start, d, SH[side])
    mid_ = (SH["L"] + SH["R"]) / 2
    pts = [start, start - d * 0.05, E, SH[side], SH[side].lerp(mid_, 0.3) + Vector((0, 0, -0.04))]   # the top end buried in the torso
    cu = D.curves.new(f"Sleeve{side}", "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = 0.04; cu.bevel_resolution = 6
    cu.use_fill_caps = True
    sp = cu.splines.new("BEZIER"); sp.bezier_points.add(len(pts) - 1)
    for bp, p, r in zip(sp.bezier_points, pts, (1.0, 1.02, 1.25, 1.45, 1.4)):   # slim at the wrist, fuller up the arm
        bp.co = p; bp.handle_left_type = bp.handle_right_type = "AUTO"; bp.radius = r
    o = D.objects.new(f"Sleeve{side}", cu); bpy.context.scene.collection.objects.link(o); cu.materials.append(knit); put(o, "Window")
    cuff = cyl(f"Cuff{side}", 0.043, 0.03, start - d * 0.012, knit, verts=48, bevel=0.004, c="Window")
    cuff.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    bm = bmesh.new(); bm.from_mesh(cuff.data)
    for v in bm.verts:
        ang = math.atan2(v.co.y, v.co.x); r = math.hypot(v.co.x, v.co.y)
        if r > 0.03: s = 1 + 0.04 * (0.5 + 0.5 * math.cos(ang * 24)); v.co.x *= s; v.co.y *= s
    bm.to_mesh(cuff.data); bm.free()
# a soft knit torso, shoulder to shoulder and topping out just above them, so each sleeve ends inside it
mid = (SH["L"] + SH["R"]) / 2; top = mid.z + 0.075; hgt = 0.46
chest = box("Chest", (0.44, 0.24, hgt), (mid.x, mid.y, top - hgt / 2), knit, bevel=0.085, segs=8, c="Window")   # rounded, full size
# her toy character stays in the file, out of the render
for n in ("Jumper", "Body.001"):
    D.objects[n].hide_render = True; D.objects[n].hide_set(True)
print("arms on")
