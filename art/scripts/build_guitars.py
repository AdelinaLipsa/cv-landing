exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
for p in ("Guitar", "Strat", "Acoustic", "Cable", "Stand"): kill(p)
C = "Furniture"
chrome = D.materials["Chrome"]; blackp = D.materials["BlackPlastic"]; stm = D.materials["DarkMetal"]

def outline(name, pts, depth, m, parent, z=0.0, bevel=0.004, res=10):
    cu = D.curves.new(name, "CURVE"); cu.dimensions = "2D"; cu.fill_mode = "BOTH"
    sp = cu.splines.new("BEZIER"); sp.bezier_points.add(len(pts) - 1); sp.use_cyclic_u = True
    for bp, p in zip(sp.bezier_points, pts):
        bp.co = (p[0], p[1], 0); bp.handle_left_type = bp.handle_right_type = "AUTO"
    cu.extrude = depth / 2; cu.bevel_depth = bevel; cu.bevel_resolution = 3; cu.resolution_u = res
    o = D.objects.new(name, cu); bpy.context.scene.collection.objects.link(o); cu.materials.append(m); put(o, C)
    o.parent = parent; o.location = (0, 0, z)
    return o

def rim(name, pts, r, m, parent, z, scale=1.0):
    """A tube following an outline: binding round a guitar's edge."""
    cu = D.curves.new(name, "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = r; cu.bevel_resolution = 2
    sp = cu.splines.new("BEZIER"); sp.bezier_points.add(len(pts) - 1); sp.use_cyclic_u = True
    for bp, p in zip(sp.bezier_points, pts):
        bp.co = (p[0] * scale, p[1] * scale, z); bp.handle_left_type = bp.handle_right_type = "AUTO"
    o = D.objects.new(name, cu); bpy.context.scene.collection.objects.link(o); cu.materials.append(m); put(o, C); o.parent = parent
    return o

def root(name):
    g = D.objects.new(name, None); bpy.context.scene.collection.objects.link(g); put(g, C); return g

# ================= Red Stratocaster-style electric (body face is local +Z, neck along +Y)
red = mat("StratRed", "#B5121B", rough=0.12, coat=1.0)
maple = woodmat("Maple", "#EBCB92", "#D9B072", rough=0.3, scale=8, axis="Y")
guardm = mat("Pickguard", "#F6F2E8", rough=0.3)
pickm = mat("PickupWhite", "#F2F0EA", rough=0.35)
dotm = mat("FretDot", "#1A1A1A", rough=0.4)
strm = mat("String", "#D5D5D8", rough=0.25, metal=1.0)
st = root("Strat")
body = [(0, -0.245), (0.09, -0.238), (0.145, -0.205), (0.163, -0.14), (0.158, -0.07), (0.135, -0.012), (0.126, 0.04),
        (0.136, 0.095), (0.142, 0.138), (0.13, 0.167), (0.108, 0.173), (0.088, 0.152), (0.068, 0.112), (0.045, 0.088),
        (0.0, 0.082), (-0.045, 0.088), (-0.07, 0.125), (-0.093, 0.185), (-0.113, 0.216), (-0.137, 0.214), (-0.149, 0.182),
        (-0.146, 0.12), (-0.136, 0.06), (-0.13, 0.01), (-0.15, -0.05), (-0.163, -0.12), (-0.15, -0.19), (-0.1, -0.236)]
outline("StratBody", body, 0.045, red, st, bevel=0.009)
guard = [(-0.055, 0.092), (-0.085, 0.15), (-0.108, 0.188), (-0.124, 0.15), (-0.12, 0.06), (-0.108, 0.0), (-0.118, -0.06),
         (-0.088, -0.118), (-0.03, -0.125), (0.035, -0.098), (0.092, -0.128), (0.118, -0.108), (0.104, -0.04), (0.066, 0.02),
         (0.046, 0.064), (0.03, 0.086)]
outline("StratGuard", guard, 0.003, guardm, st, z=0.0245, bevel=0.001)
for k, (y, a) in enumerate([(0.045, 0), (-0.005, 0), (-0.062, 0.18)]):
    box(f"StratPickup{k}", (0.072, 0.018, 0.008), (0, y, 0.029), pickm, bevel=0.004, rot=(0, 0, a), c=C, parent=st)
    for s in range(6):
        cyl(f"StratPole{k}{s}", 0.0022, 0.002, (-0.026 + s * 0.0104, y + (-0.026 + s * 0.0104) * math.tan(a), 0.0335), chrome, c=C, parent=st, verts=8)
box("StratBridge", (0.072, 0.04, 0.004), (0, -0.115, 0.0275), chrome, bevel=0.002, c=C, parent=st)
for s in range(6):
    box(f"StratSaddle{s}", (0.009, 0.012, 0.006), (-0.026 + s * 0.0104, -0.108 + (s % 2) * 0.003, 0.031), chrome, bevel=0.001, c=C, parent=st)
tube("StratTremArm", [(0.04, -0.13, 0.03), (0.06, -0.15, 0.045), (0.11, -0.18, 0.05)], 0.0025, chrome, c=C, parent=st)
for k, (x, y) in enumerate([(0.072, -0.085), (0.088, -0.12), (0.1, -0.16)]):
    cyl(f"StratKnob{k}", 0.0105, 0.015, (x, y, 0.034), pickm, c=C, parent=st, verts=20)
box("StratSwitch", (0.004, 0.012, 0.01), (0.055, -0.05, 0.03), pickm, bevel=0.001, rot=(0, 0, 0.6), c=C, parent=st)
cyl("StratJack", 0.011, 0.004, (0.11, -0.2, 0.0235), chrome, c=C, parent=st, verts=20)
# neck, fretboard, frets, dots
box("StratNeck", (0.05, 0.47, 0.022), (0, 0.32, 0.01), maple, bevel=0.006, c=C, parent=st)
for f in range(1, 22):
    y = 0.53 - 0.648 * (1 - 2 ** (-f / 12)) * 0.72
    box(f"StratFret{f}", (0.05, 0.0018, 0.0016), (0, y, 0.0215), chrome, bevel=0, c=C, parent=st)
    if f in (3, 5, 7, 9, 15, 17, 19, 21, 12):
        for dx in ((-0.009, 0.009) if f == 12 else (0,)):
            cyl(f"StratDot{f}{dx}", 0.003, 0.001, (dx, y + 0.012, 0.0215), dotm, c=C, parent=st, verts=10)
head = [(-0.022, 0.545), (-0.03, 0.6), (-0.045, 0.66), (-0.05, 0.72), (-0.03, 0.745), (-0.015, 0.73), (0.0, 0.7),
        (0.025, 0.66), (0.04, 0.62), (0.032, 0.575), (0.022, 0.545)]
outline("StratHead", head, 0.014, maple, st, z=0.01, bevel=0.003)
for s in range(6):
    y = 0.585 + s * 0.026
    cyl(f"StratTuner{s}", 0.0055, 0.016, (-0.028 - s * 0.0025, y, 0.026), chrome, c=C, parent=st, verts=12)
    box(f"StratTunerKey{s}", (0.022, 0.009, 0.004), (-0.055 - s * 0.0025, y, 0.0), chrome, bevel=0.002, c=C, parent=st)
for s in range(6):
    x0 = -0.026 + s * 0.0104; x1 = -0.0175 + s * 0.007
    L_ = Vector((x1, 0.535, 0.0245)) - Vector((x0, -0.108, 0.036))
    b = box(f"StratString{s}", (0.0009, L_.length, 0.0009), (0, 0, 0), strm, bevel=0, c=C, parent=st)
    b.location = Vector((x0, -0.108, 0.036)) + L_ / 2; b.rotation_euler = (math.atan2(L_.z, L_.y), 0, -math.atan2(L_.x, L_.y))
# ================= Black dreadnought acoustic
gloss = mat("AcousticBlack", "#0D0C10", rough=0.1, coat=1.0)
bind = mat("Binding", "#EFE7D6", rough=0.3)
rose = woodmat("Rosewood", "#3A2219", "#251410", rough=0.5, scale=10, axis="Y")
mahog = woodmat("Mahogany", "#4A2A1A", "#33190F", rough=0.4, scale=8, axis="Y")
ac = root("Acoustic")
dread = [(0, -0.255), (0.12, -0.248), (0.19, -0.2), (0.198, -0.11), (0.17, -0.02), (0.138, 0.04), (0.145, 0.12),
         (0.14, 0.2), (0.105, 0.245), (0.04, 0.262), (-0.04, 0.262), (-0.105, 0.245), (-0.14, 0.2), (-0.145, 0.12),
         (-0.138, 0.04), (-0.17, -0.02), (-0.198, -0.11), (-0.19, -0.2), (-0.12, -0.248)]
outline("AcousticBody", dread, 0.11, gloss, ac, bevel=0.006)
rim("AcousticBindTop", dread, 0.0028, bind, ac, 0.055, scale=1.0)
rim("AcousticBindBack", dread, 0.0028, bind, ac, -0.055, scale=1.0)
cyl("AcousticHole", 0.047, 0.003, (0, 0.11, 0.055), mat("HoleDark", "#020203", rough=1.0), c=C, parent=ac, verts=48)
bpy.ops.mesh.primitive_torus_add(major_radius=0.058, minor_radius=0.003, location=(0, 0.11, 0.056))
t = bpy.context.view_layer.objects.active; t.name = "AcousticRosette"; finish(t, bind, c=C, parent=ac); t.scale = (1, 1, 0.3)
bpy.ops.mesh.primitive_torus_add(major_radius=0.066, minor_radius=0.0015, location=(0, 0.11, 0.056))
t = bpy.context.view_layer.objects.active; t.name = "AcousticRosette2"; finish(t, bind, c=C, parent=ac); t.scale = (1, 1, 0.3)
box("AcousticBridge", (0.15, 0.03, 0.01), (0, -0.115, 0.06), rose, bevel=0.004, c=C, parent=ac)
box("AcousticSaddle", (0.075, 0.003, 0.004), (0, -0.108, 0.066), bind, bevel=0.001, c=C, parent=ac)
for s in range(6):
    cyl(f"AcousticPin{s}", 0.0035, 0.004, (-0.03 + s * 0.012, -0.124, 0.066), bind, c=C, parent=ac, verts=10)
box("AcousticNeck", (0.05, 0.4, 0.024), (0, 0.45, 0.04), mahog, bevel=0.006, c=C, parent=ac)
box("AcousticFretboard", (0.052, 0.42, 0.006), (0, 0.44, 0.0545), rose, bevel=0.0015, c=C, parent=ac)
for f in range(1, 21):
    y = 0.65 - 0.645 * (1 - 2 ** (-f / 12)) * 0.75
    if y < 0.235: break
    box(f"AcousticFret{f}", (0.052, 0.0018, 0.0016), (0, y, 0.058), chrome, bevel=0, c=C, parent=ac)
    if f in (5, 7, 9, 12, 3):
        cyl(f"AcousticDot{f}", 0.0028, 0.001, (0, y + 0.012, 0.058), bind, c=C, parent=ac, verts=10)
hd = [(-0.026, 0.655), (-0.04, 0.72), (-0.042, 0.8), (0.0, 0.81), (0.042, 0.8), (0.04, 0.72), (0.026, 0.655)]
outline("AcousticHead", hd, 0.016, gloss, ac, z=0.044, bevel=0.003)
for s in range(3):
    for sx in (-1, 1):
        y = 0.695 + s * 0.035
        cyl(f"AcousticTuner{s}{sx}", 0.0065, 0.014, (sx * 0.026, y, 0.058), chrome, c=C, parent=ac, verts=12)
        box(f"AcousticKey{s}{sx}", (0.022, 0.012, 0.005), (sx * 0.058, y, 0.044), chrome, bevel=0.002, c=C, parent=ac)
for s in range(6):
    x0 = -0.03 + s * 0.012; x1 = -0.018 + s * 0.0072
    L_ = Vector((x1, 0.652, 0.062)) - Vector((x0, -0.11, 0.07))
    b = box(f"AcousticString{s}", (0.0009, L_.length, 0.0009), (0, 0, 0), strm, bevel=0, c=C, parent=ac)
    b.location = Vector((x0, -0.11, 0.07)) + L_ / 2; b.rotation_euler = (math.atan2(L_.z, L_.y), 0, -math.atan2(L_.x, L_.y))
# ================= stands (a simple A-frame each) and placement
def stand(name, loc, rz, w=0.3):
    g = root(name); g.location = loc; g.rotation_euler = (0, 0, math.radians(rz))
    tube(name + "Leg1", [(-w / 2, 0.08, 0.01), (-0.05, 0.02, 0.32)], 0.008, stm, c=C, parent=g)
    tube(name + "Leg2", [(w / 2, 0.08, 0.01), (0.05, 0.02, 0.32)], 0.008, stm, c=C, parent=g)
    tube(name + "Back", [(0, 0.22, 0.01), (0, 0.08, 0.72)], 0.008, stm, c=C, parent=g)
    tube(name + "Cradle", [(-0.07, -0.02, 0.28), (0, -0.04, 0.26), (0.07, -0.02, 0.28)], 0.012, blackp, c=C, parent=g)
    tube(name + "Yoke", [(-0.025, 0.06, 0.74), (0, 0.04, 0.73), (0.025, 0.06, 0.74)], 0.009, blackp, c=C, parent=g)
    return g
def place(g, loc, rz, tilt=14):
    # face (+Z) to the room, neck (+Y) up and leaning back by `tilt` degrees
    g.rotation_euler = Euler((math.radians(90 - tilt), 0, math.radians(rz)), "XYZ")
    g.location = loc
place(ac, (-1.45, -1.12, 0.53), 70)
# The black acoustic belongs in her arms on the bed. Until her character is in, it waits in the Character
# collection, which is excluded from the bake and the export.
chc = coll("Character")
for o in [ac] + list(ac.children_recursive): put(o, "Character")
lc = bpy.context.view_layer.layer_collection.children.get("Character")
if lc: lc.exclude = True
stand("StandStrat", (-1.42, -0.55, 0), 62)
place(st, (-1.42, -0.55, 0.5), 62)
tube("Cable", [(-1.3, -0.62, 0.31), (-1.22, -0.5, 0.006), (-1.3, -0.3, 0.006), (-1.42, -0.2, 0.006), (-1.5, -0.12, 0.07)], 0.004, blackp, c=C)
print("guitars ok")
