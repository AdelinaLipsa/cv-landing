"""Out the window: her room's window wall, the outer sill and her street (she lives on the parter).
Units are metres. Her floor is z = 0, the street z = STREET. The window wall's inner face is y = 0; outside is +y."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
import random
R = random.Random(7)
STREET = -1.3                                               # her flat is on the parter, raised over the pavement
WX0, WX1, WZ0, WZ1, WT = -1.05, 1.05, 0.95, 2.2, 0.3      # the opening, and the wall's thickness
for c in ("Interior", "Window", "Street", "Wires", "Occluders"):
    for o in list(coll(c).objects): D.objects.remove(o, do_unlink=True)

# ---------- materials (blockout: plain colours; textures come later) ----------
plaster = mat("Plaster", "#ECE6F2", rough=0.9)
paint = mat("PaintWhite", "#F3F0EA", rough=0.45)
pvc = mat("PVC", "#F4F3EF", rough=0.35)
tin = mat("Tin", "#9EA3A8", rough=0.35, metal=0.8)
facade = mat("FacadeOurs", "#D8CFC2", rough=0.95)
asphalt = mat("Asphalt", "#3E3F45", rough=0.95)
def old_asphalt(m):
    """Asphalt with a grain, darker tyre tracks and lighter dusty patches, in world space."""
    nt = m.node_tree; b = bsdf_of(m)
    for n in [n for n in nt.nodes if n.type not in ("BSDF_PRINCIPLED", "OUTPUT_MATERIAL")]: nt.nodes.remove(n)
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    big = nt.nodes.new("ShaderNodeTexNoise"); big.inputs["Scale"].default_value = 0.35; big.inputs["Detail"].default_value = 4
    fine = nt.nodes.new("ShaderNodeTexNoise"); fine.inputs["Scale"].default_value = 60; fine.inputs["Detail"].default_value = 2
    ramp = nt.nodes.new("ShaderNodeValToRGB"); ramp.color_ramp.elements[0].color = hexc("#2F3035"); ramp.color_ramp.elements[1].color = hexc("#55565B")
    add = nt.nodes.new("ShaderNodeMath"); add.operation = "ADD"
    mul = nt.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; mul.inputs[1].default_value = 0.5
    for t in (big, fine): nt.links.new(geo.outputs["Position"], t.inputs["Vector"])
    nt.links.new(big.outputs["Fac"], add.inputs[0]); nt.links.new(fine.outputs["Fac"], add.inputs[1]); nt.links.new(add.outputs[0], mul.inputs[0])
    nt.links.new(mul.outputs[0], ramp.inputs["Fac"]); nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    return m
old_asphalt(asphalt)
curb = mat("Curb", "#9C978F", rough=0.9)
pave = mat("Paving", "#8F8A84", rough=0.95)
def pavers(m, size=0.3, c1="#9A958D", c2="#858079", mortar="#6E6A64"):
    """Square concrete pavers in world space: a brick texture with no offset, each slab a slightly different grey."""
    nt = m.node_tree; b = bsdf_of(m)
    for n in [n for n in nt.nodes if n.type not in ("BSDF_PRINCIPLED", "OUTPUT_MATERIAL")]: nt.nodes.remove(n)
    geo = nt.nodes.new("ShaderNodeNewGeometry"); br = nt.nodes.new("ShaderNodeTexBrick")
    br.offset = 0.0; br.squash = 1.0; br.inputs["Scale"].default_value = 1 / size; br.inputs["Mortar Size"].default_value = 0.012
    br.inputs["Brick Width"].default_value = 1.0; br.inputs["Row Height"].default_value = 1.0
    br.inputs["Color1"].default_value = hexc(c1); br.inputs["Color2"].default_value = hexc(c2); br.inputs["Mortar"].default_value = hexc(mortar)
    nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 0.8; nz.inputs["Detail"].default_value = 6
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"; mix.inputs["Factor"].default_value = 0.35
    nt.links.new(geo.outputs["Position"], br.inputs["Vector"]); nt.links.new(geo.outputs["Position"], nz.inputs["Vector"])
    nt.links.new(br.outputs["Color"], mix.inputs[6]); nt.links.new(nz.outputs["Color"], mix.inputs[7]); nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.4; nt.links.new(br.outputs["Fac"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m
pavers(pave)
grass = mat("TramGrass", "#5E6E43", rough=1.0)
rail = mat("Rail", "#7A7B80", rough=0.3, metal=1.0)
blocA = mat("BlocA", "#CFC6B6", rough=0.95)
blocB = mat("BlocB", "#E2B9A0", rough=0.95)
glassdark = mat("WinDark", "#2C3343", rough=0.15)
far = mat("Far", "#9AA0B5", rough=1.0)

# ---------- interior: the wall with its window hole, the inner sill ----------
def wall_with_hole(name, y0, y1, x0, x1, z0, z1, m, c):
    parts = [((x0, WX0), (z0, z1)), ((WX1, x1), (z0, z1)), ((WX0, WX1), (z0, WZ0)), ((WX0, WX1), (WZ1, z1))]
    for k, ((a, b), (lo, hi)) in enumerate(parts):
        box(f"{name}{k}", (b - a, y1 - y0, hi - lo), ((a + b) / 2, (y0 + y1) / 2, (lo + hi) / 2), m, bevel=0, c=c)
wall_with_hole("WallIn", -0.02, WT, -1.9, 1.9, 0.4, 2.6, plaster, "Interior")   # only what her eyes can reach: the bake spends its pixels here
box("SillIn", (WX1 - WX0 + 0.14, 0.32, 0.035), (0, 0.0, WZ0 - 0.0175 + 0.003), paint, bevel=0.008, c="Interior")
# reveal: the white lined jambs inside the opening, up to the frame
FY = 0.17                                                  # the frame sits here, nearer the outside like a bloc's
for k, (sx, loc) in enumerate([((0.02, FY + 0.02, WZ1 - WZ0), (WX0 + 0.01, FY / 2 - 0.01, (WZ0 + WZ1) / 2)),
                               ((0.02, FY + 0.02, WZ1 - WZ0), (WX1 - 0.01, FY / 2 - 0.01, (WZ0 + WZ1) / 2)),
                               ((WX1 - WX0, FY + 0.02, 0.02), (0, FY / 2 - 0.01, WZ1 - 0.01))]):
    box(f"Reveal{k}", sx, loc, paint, bevel=0, c="Interior")

# ---------- the window: white frame, two mullions (three sashes), a transom, the glass ----------
fw, fd = 0.065, 0.07
W, H = WX1 - WX0, WZ1 - WZ0
box("FrameTop", (W, fd, fw), (0, FY, WZ1 - fw / 2), pvc, bevel=0.006, c="Window")
box("FrameBot", (W, fd + 0.01, fw), (0, FY, WZ0 + fw / 2), pvc, bevel=0.006, c="Window")
box("FrameL", (fw, fd, H), (WX0 + fw / 2, FY, (WZ0 + WZ1) / 2), pvc, bevel=0.006, c="Window")
box("FrameR", (fw, fd, H), (WX1 - fw / 2, FY, (WZ0 + WZ1) / 2), pvc, bevel=0.006, c="Window")
TZ = WZ0 + H * 0.72
for k, x in enumerate((-W / 6, W / 6)):
    box(f"Mullion{k}", (0.075, fd, H), (x, FY, (WZ0 + WZ1) / 2), pvc, bevel=0.006, c="Window")
box("Transom", (W, fd, 0.06), (0, FY, TZ), pvc, bevel=0.006, c="Window")
# sash frames inside each lower pane (the opening casements have their own frame lip)
for k, x in enumerate((-W / 3, 0, W / 3)):
    w_, h_ = W / 3 - 0.075, TZ - WZ0 - fw - 0.03
    for j, (s, l) in enumerate([((w_, 0.05, 0.045), (x, FY - 0.03, WZ0 + fw + 0.0225)), ((w_, 0.05, 0.045), (x, FY - 0.03, TZ - 0.03 - 0.0225)),
                                ((0.045, 0.05, h_), (x - w_ / 2 + 0.0225, FY - 0.03, WZ0 + fw + h_ / 2)), ((0.045, 0.05, h_), (x + w_ / 2 - 0.0225, FY - 0.03, WZ0 + fw + h_ / 2))]):
        box(f"Sash{k}{j}", s, l, pvc, bevel=0.005, c="Window")
    if k != 1:   # a PVC lever handle: a small base, the lever pointing down
        hx = x + (w_ / 2 - 0.05) * (1 if k == 0 else -1); hz = WZ0 + fw + h_ * 0.5
        hm = mat("HandleWhite", "#ECEAE5", rough=0.3)
        box(f"HandleBase{k}", (0.032, 0.014, 0.075), (hx, FY - 0.062, hz), hm, bevel=0.006, c="Window")
        box(f"HandleNeck{k}", (0.016, 0.03, 0.016), (hx, FY - 0.083, hz + 0.015), hm, bevel=0.005, c="Window")
        box(f"HandleLever{k}", (0.019, 0.016, 0.11), (hx, FY - 0.098, hz - 0.035), hm, bevel=0.007, c="Window")
gl = empty("WindowGlass", (0, FY, (WZ0 + WZ1) / 2), c="Window", size=0.5); gl.empty_display_type = "CUBE"
gl.scale = (W / 2, 0.005, H / 2)

# ---------- outside our wall: the facade around the opening, the tin outer sill (the pigeon's) ----------
wall_with_hole("FacadeOut", WT, WT + 0.02, -1.8, 1.8, 0.2, 2.9, facade, "Interior")
# the rest of her room and her bloc: they shade and bounce light in the bake but are never seen, so never baked
box("RoomFloor", (5, 4.2, 0.05), (0, -2.1, -0.025), mat("FloorWood", "#7A5238", rough=0.7), bevel=0, c="Occluders")
box("RoomCeiling", (5, 4.2, 0.05), (0, -2.1, 2.725), plaster, bevel=0, c="Occluders")
box("RoomBack", (5, 0.05, 2.8), (0, -4.2, 1.35), plaster, bevel=0, c="Occluders")
for k, x in enumerate((-2.5, 2.5)): box(f"RoomSide{k}", (0.05, 4.2, 2.8), (x, -2.1, 1.35), plaster, bevel=0, c="Occluders")
for k, (sz, loc) in enumerate([((0.6, WT, 2.85), (-2.2, WT / 2 - 0.02, 1.32)), ((0.6, WT, 2.85), (2.2, WT / 2 - 0.02, 1.32)),
                               ((3.8, WT, 0.5), (0, WT / 2 - 0.02, 0.15)), ((3.8, WT, 0.15), (0, WT / 2 - 0.02, 2.675))]):
    box(f"RoomWall{k}", sz, loc, plaster, bevel=0, c="Occluders")   # the window wall beyond the baked part
for k, (a, b) in enumerate([(-30, -1.8), (1.8, 30)]):
    box(f"BlocFace{k}", (b - a, 0.3, 22 - STREET), ((a + b) / 2, WT + 0.15, (22 + STREET) / 2), facade, bevel=0, c="Occluders")
box("BlocFaceLow", (3.6, 0.3, 0.2 - STREET), (0, WT + 0.15, (0.2 + STREET) / 2), facade, bevel=0, c="Occluders")
box("BlocFaceHigh", (3.6, 0.3, 22 - 2.9), (0, WT + 0.15, (22 + 2.9) / 2), facade, bevel=0, c="Occluders")
SILL_Y0, SILL_Y1 = WT - 0.02, WT + 0.17
bm = bmesh.new()
# a bent tin sill: flat top falling 2 cm outward, drip lip down at the front
for v in [(WX0 - 0.06, SILL_Y0, WZ0 - 0.005), (WX1 + 0.06, SILL_Y0, WZ0 - 0.005), (WX1 + 0.06, SILL_Y1, WZ0 - 0.025), (WX0 - 0.06, SILL_Y1, WZ0 - 0.025)]:
    bm.verts.new(v)
bm.faces.new(bm.verts)
o = mesh_obj("SillOut", bm); finish(o, tin, c="Window", smooth=False)
s = o.modifiers.new("Solid", "SOLIDIFY"); s.thickness = 0.004
lip = box("SillOutLip", (W + 0.12, 0.004, 0.035), (0, SILL_Y1, WZ0 - 0.04), tin, bevel=0.001, c="Window")
box("SillCurbOut", (W, 0.02, 0.03), (0, WT - 0.01, WZ0 + 0.012), facade, bevel=0.003, c="Window")
empty("PigeonSpot", (0.42, (SILL_Y0 + SILL_Y1) / 2 + 0.01, WZ0 - 0.012), c="Window", size=0.1)

# ---------- the street: she lives on the parter, raised a little over the pavement ----------
# y: her facade 0.3 | a strip of front garden to 1.6 | pavement to 3.8 | road to 11.2 | far pavement to 14.4 | verge, then fences and houses
Y = {"garden": (WT, 1.6), "walk": (1.6, 3.8), "road": (3.8, 11.2), "walk2": (11.2, 14.4), "verge": (14.4, 16.0)}
X0, X1 = -42, 42
def slab(name, y, z, m, h=0.15):
    box(name, (X1 - X0, y[1] - y[0], h), (0, (y[0] + y[1]) / 2, STREET + z - h / 2), m, bevel=0, c="Street")
soil = mat("Soil", "#5B4636", rough=1.0)
slab("Garden", Y["garden"], 0.25, soil, h=0.4); slab("Walk", Y["walk"], 0.15, pave); slab("Road", Y["road"], 0.0, asphalt)
slab("Walk2", Y["walk2"], 0.15, pave); slab("Verge", Y["verge"], 0.17, grass)
for k, y in enumerate((3.8, 11.2)):
    box(f"Curb{k}", (X1 - X0, 0.2, 0.17), (0, y, STREET + 0.075), curb, bevel=0.01, c="Street")
box("GardenKerb", (X1 - X0, 0.12, 0.35), (0, 1.6, STREET + 0.2), curb, bevel=0.01, c="Street")
dash = mat("Paint", "#E6E2D6", rough=0.6)
for k in range(-8, 9):
    box(f"Dash{k}", (2.5, 0.12, 0.01), (k * 5.0, 7.5, STREET + 0.006), dash, bevel=0, c="Street")
# patched asphalt, a manhole: the street is old
patch = mat("AsphaltPatch", "#34353A", rough=0.95)
for k in range(9):
    box(f"Patch{k}", (R.uniform(0.8, 3.0), R.uniform(0.6, 1.8), 0.012), (R.uniform(-20, 20), R.uniform(4.5, 10.5), STREET + 0.004), patch, bevel=0, rot=(0, 0, R.uniform(-0.3, 0.3)), c="Street")
cyl("Manhole", 0.35, 0.02, (2.5, 9.0, STREET + 0.01), mat("Manhole", "#4A4A48", rough=0.6, metal=0.6), verts=24, bevel=0.005, c="Street")
# her lampposts (Assets/Lamppost, lamppost.py): concrete posts with a curved arm over the road; the far ones carry
# the tangle of cables Bucharest strings between posts. LampBulb* empties mark the bulbs (the site's light cones).
wire = mat("Wire", "#1F2124", rough=0.4, metal=0.6)

BULB = Vector((1.133, 0.0, 5.374)) * 1.5
def lamppost(name, x, y, rz):
    src = D.objects["Lamppost"]
    root = D.objects.new(name, None); bpy.context.scene.collection.objects.link(root); put(root, "Lamps")
    root.location = (x, y, STREET + 0.15); root.rotation_euler = (0, 0, rz); root.scale = src.scale
    for ch in src.children:
        c = ch.copy(); bpy.context.scene.collection.objects.link(c); put(c, "Lamps"); c.parent = root
        c.matrix_parent_inverse = Matrix.Identity(4); c.matrix_basis = src.matrix_world.inverted() @ ch.matrix_world   # same place under the copy
        c.name = f"{name}_{ch.name}"
        if ch.name == "LampPoleMesh":   # 41k triangles each as downloaded: a tenth is plenty at this distance
            d = c.modifiers.new("Dec", "DECIMATE"); d.ratio = 0.08
    bulb = Vector((x, y, STREET + 0.15)) + Matrix.Rotation(rz, 3, "Z") @ BULB
    empty(f"LampBulb{name[4:]}", bulb, c="Lamps", size=0.1)
    return root
for o in list(coll("Lamps").objects): D.objects.remove(o, do_unlink=True)
POLES = [(-26.0, 12.3), (-7.5, 12.3), (10.5, 12.3), (29.0, 12.3)]
for k, (x, y) in enumerate(POLES): lamppost(f"LampF{k}", x, y, -math.pi / 2)
for k, x in enumerate((-11.0, 7.0)): lamppost(f"LampN{k}", x, 2.9, math.pi / 2)
def cable(name, a, b, sag, r=0.01):
    a, b = Vector(a), Vector(b)
    tube(name, [a.lerp(b, u / 16) - Vector((0, 0, sag * math.sin(u / 16 * math.pi))) for u in range(17)], r, wire, c="Wires")
for k in range(len(POLES) - 1):
    (xa, ya), (xb, yb) = POLES[k], POLES[k + 1]
    for j in range(5):   # bundles along the street
        z = STREET + 7.0 - j * 0.28
        cable(f"Cable{k}_{j}", (xa, ya + R.uniform(-0.2, 0.2), z), (xb, yb + R.uniform(-0.2, 0.2), z + R.uniform(-0.2, 0.2)), R.uniform(0.4, 1.1), r=R.choice((0.008, 0.012, 0.02)))
# and across the street to her bloc, crossing the top of her view (the pigeons' perch is PerchWire)
cable("PerchWire", (-7.5, 12.3, STREET + 6.9), (-1.5, WT + 0.05, 2.9), 0.55, r=0.012)
cable("Cross1", (10.5, 12.3, STREET + 6.8), (2.5, WT + 0.05, 3.1), 0.7, r=0.01)
cable("Cross2", (-7.5, 12.3, STREET + 6.5), (6.0, WT + 0.05, 2.7), 0.4, r=0.016)

# ---------- the camera: standing at her window, a step back ----------
cam = D.objects.get("ViewCam") or D.objects.new("ViewCam", D.cameras.new("ViewCam"))
if not cam.users_collection: bpy.context.scene.collection.objects.link(cam)
cam.location = (0.0, -1.6, 1.75); cam.rotation_euler = (math.radians(90), 0, 0)   # level: verticals stay vertical; shift frames the window
cam.data.lens = 18; cam.data.shift_y = -0.055; cam.data.sensor_fit = "HORIZONTAL"; cam.data.sensor_width = 36; cam.data.clip_end = 1000
sc = bpy.context.scene; sc.camera = cam
sc.render.resolution_x, sc.render.resolution_y = 1600, 800
print("built", len(D.objects))
# crumbs on the tin sill, in front of the pigeon (what it pecks at)
crumb = mat("Crumb", "#D6AE72", rough=0.85, bump=0.3)
kill("Crumb")
for k in range(9):
    s = R.uniform(0.006, 0.013)
    box(f"Crumb{k}", (s, s * R.uniform(0.7, 1.2), s * 0.7), (R.uniform(-0.06, 0.08), R.uniform(0.33, 0.43), WZ0 - 0.012 - (R.uniform(0.33, 0.43) - 0.28) * 0.1 + s * 0.3),
        crumb, bevel=0.002, rot=(R.uniform(0, 1), R.uniform(0, 1), R.uniform(0, 3)), c="Window")
