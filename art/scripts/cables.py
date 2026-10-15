"""Cables, re-routed so they rest on surfaces and plug into real sockets (no passing through the desk or floor).
smooth_tube() samples a Catmull-Rom path through the points and lifts any sample below its support surface."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
DZ = 0.75
def on_desk(x, y): return (-1.8 <= x <= -1.15 and 0.0 <= y <= 1.8) or (-1.8 <= x <= -0.55 and 1.15 <= y <= 1.8)
def on_rug(x, y):
    r = D.objects.get("Rug")
    if not r: return False
    p = r.matrix_world.inverted() @ Vector((x, y, 0))
    return abs(p.x) <= 1.05 and abs(p.y) <= 0.725   # rug plane is 2.1 x 1.45 in its own space
def support(x, y, z, r):
    if on_desk(x, y) and z > DZ - 0.05: return DZ + r + 0.0005
    if on_rug(x, y): return 0.014 + r + 0.0005
    return r + 0.0005
def catmull(pts, n=12):
    pts = [Vector(p) for p in pts]; P = [pts[0]] + pts + [pts[-1]]; out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(pts[-1]); return out
def smooth_tube(name, pts, r, m, c="Props", rest=True, n=12):
    kill(name)
    s = catmull(pts, n)
    if rest:
        for i, p in enumerate(s):
            if 0 < i < len(s) - 1: p.z = max(p.z, support(p.x, p.y, p.z, r))
    cu = D.curves.new(name, "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = r; cu.bevel_resolution = 2
    sp = cu.splines.new("POLY"); sp.points.add(len(s) - 1)
    for pt, p in zip(sp.points, s): pt.co = (*p, 1)
    o = D.objects.new(name, cu); bpy.context.scene.collection.objects.link(o); cu.materials.append(m); put(o, c)
    return o
blackp = D.materials["BlackPlastic"]; chrome = D.materials["Chrome"]
# ---- the Strat's output jack: recessed oval plate on the front, lower right, a 1/4" plug seated in it
for n in ("StratJackPlate", "StratJackCup", "StratPlug", "StratPlugSleeve", "AmpJackNut", "AmpPlug", "AmpPlugSleeve"): kill(n)
st = D.objects["Strat"]; M = st.matrix_world
J = Vector((0.115, -0.165, -0.0548))                         # on the body's front face (local)
OUT = Vector((0.35, -0.45, 0.82)).normalized()                # the plug leaves at the jack's angle
plate = cyl("StratJackPlate", 0.017, 0.002, J + Vector((0, 0, 0.0005)), chrome, c="Furniture", parent=st, verts=32)
plate.scale = (1.0, 0.62, 1.0); plate.rotation_euler = (0, 0, 0.6)
q = OUT.to_track_quat("Z", "Y").to_euler()
sleeve = cyl("StratPlugSleeve", 0.0066, 0.022, J + OUT * 0.011, chrome, c="Furniture", parent=st, verts=20); sleeve.rotation_euler = q
plug = cyl("StratPlug", 0.0085, 0.04, J + OUT * 0.042, blackp, c="Furniture", parent=st, verts=20); plug.rotation_euler = q
bpy.context.view_layer.update()
S = M @ (J + OUT * 0.062); Sdir = (M.to_3x3() @ OUT).normalized()
# ---- the amp's input jack on the front panel, right of the knobs, plug seated straight in
amp = D.objects["Amp"]; A = amp.matrix_world
AJ = Vector((0.15, -0.114, 0.29))
nut = cyl("AmpJackNut", 0.009, 0.004, AJ + Vector((0, -0.002, 0)), chrome, rot=(math.pi / 2, 0, 0), c="Furniture", parent=amp, verts=20)
asl = cyl("AmpPlugSleeve", 0.0066, 0.02, AJ + Vector((0, -0.012, 0)), chrome, rot=(math.pi / 2, 0, 0), c="Furniture", parent=amp, verts=20)
apl = cyl("AmpPlug", 0.0085, 0.04, AJ + Vector((0, -0.042, 0)), blackp, rot=(math.pi / 2, 0, 0), c="Furniture", parent=amp, verts=20)
bpy.context.view_layer.update()
E = A @ (AJ + Vector((0, -0.062, 0))); Edir = (A.to_3x3() @ Vector((0, -1, 0))).normalized()
R = 0.004
mid1 = S + Sdir * 0.07
floor1 = Vector((S.x + Sdir.x * 0.25, S.y + Sdir.y * 0.25, R))
floor2 = Vector((E.x + Edir.x * 0.35 + 0.05, E.y + Edir.y * 0.35 - 0.12, R))
up = Vector((E.x + Edir.x * 0.12, E.y + Edir.y * 0.12, E.z * 0.55))
smooth_tube("Cable", [S, mid1, floor1, floor2, up, E + Edir * 0.03, E], R, blackp, c="Furniture")
# a 1.5 cm cable gap between the desk and the walls (desktops and modesty panels set off the wall)
if not D.objects["DeskWingA"].get("gapped"):
    for n in ("DeskWingA", "DeskEdgeAFront", "DeskEdgeAEnd", "DeskChip"): D.objects[n].location.x += 0.005
    for n in ("DeskWingB", "DeskEdgeBFront", "DeskEdgeBEnd"): D.objects[n].location.y -= 0.005
    D.objects["DeskBack0"].location.x += 0.015; D.objects["DeskBack1"].location.y -= 0.015
    D.objects["DeskWingA"]["gapped"] = 1
# ---- desk leads: over the desk, down through the gap at the wall, to the socket (left wall, y 0.6, z 0.3)
wirem = D.materials["WireBlack"]
smooth_tube("WirePrinter", [(-1.72, 0.42, DZ + 0.02), (-1.76, 0.48, DZ + 0.004), (-1.7925, 0.5, DZ - 0.05), (-1.7925, 0.55, 0.45), (-1.776, 0.6, 0.3)], 0.003, wirem)
smooth_tube("WireLamp", [(-1.6, 0.8, DZ + 0.01), (-1.72, 0.78, DZ + 0.004), (-1.7925, 0.74, DZ - 0.05), (-1.7925, 0.66, 0.45), (-1.776, 0.6, 0.3)], 0.003, wirem)
pcm = D.materials["MatteBlack"]
# PC leads leave the tower's back, dip under the modesty panel, rise in the wall gap behind it
smooth_tube("PCWireVGA", [(-0.8, 1.72, 0.3), (-0.82, 1.74, 0.24), (-0.95, 1.79, 0.26), (-1.3, 1.79, 0.55), (-1.5, 1.79, DZ - 0.04), (-1.55, 1.7925, DZ + 0.006), (-1.6, 1.72, DZ + 0.006), (-1.6, 1.63, DZ + 0.06)], 0.004, D.materials["VgaBlue"])
smooth_tube("PCWireMonitorPower", [(-1.6, 1.64, DZ + 0.05), (-1.66, 1.73, DZ + 0.005), (-1.7, 1.7925, DZ - 0.04), (-1.72, 1.79, 0.4), (-1.66, 1.79, 0.13), (-1.58, 1.785, 0.1), (-1.47, 1.735, 0.035)], 0.003, pcm)
smooth_tube("PCWirePower", [(-0.86, 1.72, 0.3), (-0.9, 1.75, 0.2), (-1.0, 1.76, 0.12), (-1.15, 1.765, 0.1), (-1.32, 1.765, 0.07), (-1.4, 1.735, 0.035)], 0.004, pcm)
print("cables ok", tuple(round(v, 3) for v in S), tuple(round(v, 3) for v in E))
# ---- keyboard on the desktop in front of the monitor, mouse to its right; the tray pushed back in
u = Vector((0.7071, 0.7071, 0)); f = Vector((0.7071, -0.7071, 0))
C0 = Vector((-1.36, 1.36, DZ))
kb = D.objects["Keyboard"]; kb.location = C0; kb.rotation_euler = (0, 0, math.radians(45))
ms = D.objects["Mouse"]; ms.location = C0 + u * 0.245 + f * 0.01 + Vector((0, 0, 0.0035)); ms.rotation_euler = (0, 0, math.radians(30))
tray = D.objects["DeskTray"]; tray.location = Vector((-1.25, 1.25, 0.655)) - f * 0.2
for k in (-1, 1):
    r_ = D.objects.get(f"DeskRunner{k}")
    if r_: r_.location = Vector((-1.38, 1.38, 0.69)) + u * k * 0.28 + f * 0.03
bpy.context.view_layer.update()
kback = C0 - f * 0.06 + Vector((0, 0, 0.012))
smooth_tube("PCWireKeyboard", [kback, kback - f * 0.04 - u * 0.05, (-1.55, 1.42, DZ + 0.004), (-1.7, 1.52, DZ + 0.004), (-1.74, 1.66, DZ + 0.004),
            (-1.68, 1.7925, DZ - 0.04), (-1.5, 1.79, 0.5), (-1.2, 1.79, 0.3), (-0.95, 1.79, 0.24), (-0.84, 1.74, 0.21), (-0.84, 1.722, 0.21)], 0.0025, pcm)
mback = ms.location - (ms.matrix_world.to_3x3() @ Vector((0, -1, 0))).normalized() * 0.035 + Vector((0, 0, 0.004))
smooth_tube("PCWireMouse", [mback, (-1.14, 1.62, DZ + 0.004), (-1.25, 1.75, DZ + 0.004), (-1.35, 1.7925, DZ - 0.04), (-1.2, 1.79, 0.45), (-1.0, 1.79, 0.26), (-0.9, 1.74, 0.19), (-0.9, 1.722, 0.19)], 0.002, pcm)
print("desk ok")
