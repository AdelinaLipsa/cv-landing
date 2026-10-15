exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
for p in ("Monitor", "Screen", "Keyboard", "Mouse", "Tower", "PCWire", "PowerStrip", "FanGlow"): kill(p)
kill("NoteScreen"); kill("MonitorGlow")
P = "Props"; DZ = 0.75
gloss = mat("GlossBlack", "#16151B", rough=0.18, coat=0.5)
matte = mat("MatteBlack", "#1D1C22", rough=0.55)
blue = mat("BlueGlow", "#4FA8FF", rough=0.3, emit="#4FA8FF", strength=14)
def grp(name, loc, rz):
    g = D.objects.new(name, None); bpy.context.scene.collection.objects.link(g); put(g, P)
    g.location = loc; g.rotation_euler = (0, 0, math.radians(rz)); return g
# ---- late-2000s 19" widescreen LCD in the corner, facing the room
mo = grp("Monitor", (-1.585, 1.585, DZ), 45)
cyl("MonitorBase", 0.11, 0.014, (0, 0.02, 0.007), gloss, c=P, parent=mo, verts=48).scale = (1, 0.72, 1)
box("MonitorNeck", (0.06, 0.03, 0.13), (0, 0.03, 0.075), gloss, bevel=0.008, c=P, parent=mo)
box("MonitorBezel", (0.448, 0.045, 0.3), (0, 0.0, 0.27), gloss, bevel=0.008, c=P, parent=mo)
box("MonitorBack", (0.3, 0.03, 0.2), (0, 0.03, 0.27), matte, bevel=0.02, c=P, parent=mo)
box("MonitorChin", (0.448, 0.004, 0.03), (0, -0.0232, 0.135), matte, bevel=0.001, c=P, parent=mo)
box("MonitorLed", (0.006, 0.002, 0.004), (0.19, -0.0255, 0.134), blue, bevel=0, c=P, parent=mo)
for k in range(4):
    box(f"MonitorBtn{k}", (0.008, 0.002, 0.004), (0.11 + k * 0.016, -0.0255, 0.134), mat("BtnGrey", "#55535C", rough=0.4), bevel=0, c=P, parent=mo)
gl = D.lights.new("MonitorGlow", "AREA"); gl.shape = "RECTANGLE"; gl.size = 0.4; gl.size_y = 0.25; gl.energy = 9; gl.color = hexc("#DCE6FF")[:3]
glo = D.objects.new("MonitorGlow", gl); bpy.context.scene.collection.objects.link(glo); put(glo, "Lights"); glo.parent = mo
glo.location = (0, -0.03, 0.28); glo.rotation_euler = (-math.pi / 2, 0, 0); glo.visible_camera = False  # the screen is on in the bake: a soft cool-white glow onto the desk
empty("NoteScreen", (0.224, -0.02, 0.45), parent=mo, c="Interactive")
scr = planeuv("Screen", 0.408, 0.255, (0, -0.0228, 0.28), (math.pi / 2, 0, 0), mat("ScreenDark", "#07080C", rough=0.07, coat=0.0), c="Interactive", parent=mo)
# ---- keyboard and mouse on the pulled-out tray
TZ = 0.655 + 0.008
kb = grp("Keyboard", (-1.255, 1.255, TZ), 45)
box("KeyboardBody", (0.44, 0.16, 0.02), (0, 0, 0.01), matte, bevel=0.006, rot=(0.05, 0, 0), c=P, parent=kb)
bm = bmesh.new()
rows = [(15, 0.025), (14, 0.026), (13, 0.026), (12, 0.026), (11, 0.026)]
for r, (n, kw) in enumerate(rows):
    y = 0.055 - r * 0.024
    for i in range(n):
        x = -0.2 + i * 0.0262 + r * 0.004
        if x > 0.18: break
        c = bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=Vector((0.022, 0.02, 0.008)), verts=c["verts"])
        bmesh.ops.translate(bm, vec=Vector((x, y, 0.024 - r * 0.0012)), verts=c["verts"])
c = bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.scale(bm, vec=Vector((0.13, 0.02, 0.008)), verts=c["verts"])
bmesh.ops.translate(bm, vec=Vector((-0.04, -0.066, 0.017)), verts=c["verts"])  # space bar
keys = mesh_obj("KeyboardKeys", bm); finish(keys, mat("Keycap", "#2A2930", rough=0.5), bevel=0.0025, segs=1, c=P, parent=kb)
ms = grp("Mouse", (-1.06, 1.05, TZ), 30)
sphere("MouseBody", 0.03, (0, 0, 0.012), matte, c=P, seg=24, ring=12, scale=(0.75, 1.15, 0.5), parent=ms)
box("MouseWheel", (0.004, 0.012, 0.006), (0, 0.016, 0.026), mat("BtnGrey", "#55535C", rough=0.4), bevel=0.001, c=P, parent=ms)
tube("PCWireMouse", [(-1.06, 1.08, TZ + 0.01), (-1.12, 1.2, TZ + 0.005), (-1.3, 1.45, 0.68), (-1.5, 1.7, 0.6)], 0.002, matte, c=P)
tube("PCWireKeyboard", [(-1.33, 1.33, TZ + 0.012), (-1.42, 1.42, 0.665), (-1.55, 1.6, 0.6), (-1.6, 1.74, 0.45)], 0.0025, matte, c=P)
# ---- black mid-tower on the floor under wing B: front to the room, the side fan glowing blue
tw = grp("Tower", (-0.86, 1.5, 0), 0); put(tw, "Interactive")
box("TowerCase", (0.19, 0.44, 0.42), (0, 0, 0.23), matte, bevel=0.006, c=P, parent=tw)
for sx in (-1, 1):
    for sy in (-1, 1):
        cyl(f"TowerFoot{sx}{sy}", 0.012, 0.02, (sx * 0.07, sy * 0.18, 0.01), matte, c=P, parent=tw, verts=12)
box("TowerBezel", (0.19, 0.02, 0.42), (0, -0.225, 0.23), gloss, bevel=0.006, c=P, parent=tw)
box("TowerDVD", (0.148, 0.004, 0.042), (0, -0.236, 0.385), mat("DvdFace", "#2C2B31", rough=0.25, metal=0.4), bevel=0.002, c=P, parent=tw)
box("TowerDVDSlot", (0.13, 0.002, 0.002), (0, -0.2385, 0.392), mat("SlotBlack", "#050506", rough=0.8), bevel=0, c=P, parent=tw)
box("TowerDVDBtn", (0.012, 0.003, 0.005), (0.055, -0.239, 0.375), mat("BtnGrey", "#55535C", rough=0.4), bevel=0.001, c=P, parent=tw)
box("TowerBay2", (0.148, 0.004, 0.042), (0, -0.236, 0.335), gloss, bevel=0.002, c=P, parent=tw)
cyl("TowerPower", 0.014, 0.006, (0, -0.237, 0.27), gloss, rot=(math.pi / 2, 0, 0), c=P, parent=tw, verts=32)
bpy.ops.mesh.primitive_torus_add(major_radius=0.016, minor_radius=0.0018, location=(0, -0.239, 0.27), rotation=(math.pi / 2, 0, 0))
t = bpy.context.view_layer.objects.active; t.name = "TowerLED"; finish(t, blue, c="Interactive", parent=tw)  # the power LED: the site can blink it
box("TowerReset", (0.008, 0.003, 0.008), (0.05, -0.237, 0.27), gloss, bevel=0.001, c=P, parent=tw)
for k in range(2):
    box(f"TowerUSB{k}", (0.014, 0.003, 0.006), (-0.04 + k * 0.022, -0.237, 0.235), mat("SlotBlack", "#050506", rough=0.8), bevel=0, c=P, parent=tw)
box("TowerGrille", (0.15, 0.003, 0.17), (0, -0.236, 0.115), mat("GrilleMesh", "#2E2D33", rough=0.8), bevel=0.002, c=P, parent=tw)
# side vent on the +X side: a ring of blue light round a dark fan
cyl("TowerFanHub", 0.06, 0.004, (0.097, 0.05, 0.25), mat("FanDark", "#0C0C10", rough=0.6), rot=(0, math.pi / 2, 0), c=P, parent=tw, verts=40)
bpy.ops.mesh.primitive_torus_add(major_radius=0.066, minor_radius=0.005, location=(0.098, 0.05, 0.25), rotation=(0, math.pi / 2, 0))
t = bpy.context.view_layer.objects.active; t.name = "TowerFanRing"; finish(t, blue, c=P, parent=tw)
for k in range(7):
    b = box(f"TowerFanBlade{k}", (0.003, 0.022, 0.05), (0.1, 0.05, 0.25), mat("FanBlade", "#1A1A22", rough=0.5), bevel=0, c=P, parent=tw)
    b.rotation_euler = (k / 7 * 2 * math.pi, 0, 0); b.location = (0.1, 0.05 + 0.03 * math.sin(k / 7 * 2 * math.pi), 0.25 + 0.03 * math.cos(k / 7 * 2 * math.pi))
for k in range(8):
    box(f"TowerVent{k}", (0.002, 0.11, 0.004), (0.096, -0.12, 0.08 + k * 0.012), mat("SlotBlack", "#050506", rough=0.8), bevel=0, c=P, parent=tw)
ld = D.lights.new("FanGlow", "POINT"); ld.energy = 2.5; ld.color = hexc("#4FA8FF")[:3]; ld.shadow_soft_size = 0.05
fl = D.objects.new("FanGlow", ld); bpy.context.scene.collection.objects.link(fl); put(fl, "Lights"); fl.location = (-0.86 + 0.14, 1.55, 0.25)
# power strip in the corner on the floor, with the tower's and monitor's leads
box("PowerStrip", (0.3, 0.06, 0.04), (-1.45, 1.72, 0.02), mat("SocketWhite", "#F2EFE8", rough=0.4), bevel=0.008, rot=(0, 0, 0.1), c=P)
cyl("PowerStripSwitch", 0.008, 0.006, (-1.32, 1.73, 0.042), mat("LedRed", "#E03030", rough=0.3, emit="#FF3B30", strength=3), c=P, verts=12)
tube("PCWirePower", [(-0.86, 1.72, 0.3), (-0.9, 1.78, 0.1), (-1.1, 1.78, 0.01), (-1.4, 1.73, 0.03)], 0.004, matte, c=P)
tube("PCWireVGA", [(-0.8, 1.72, 0.35), (-0.95, 1.78, 0.5), (-1.3, 1.78, 0.68), (-1.58, 1.64, 0.77), (-1.6, 1.62, 0.83)], 0.005, mat("VgaBlue", "#2A2B36", rough=0.5), c=P)
tube("PCWireMonitorPower", [(-1.6, 1.64, 0.8), (-1.75, 1.75, 0.6), (-1.6, 1.76, 0.02), (-1.5, 1.73, 0.03)], 0.003, matte, c=P)
print("pc ok")
