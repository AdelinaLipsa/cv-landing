# The boot screen's room plate: her desk corner at night, shot from where Boot.tsx's three.js camera stands.
# Run on a COPY of the room (it changes the scene and never saves):
#   cp art/room_source.blend /tmp/boot.blend
#   Blender -b /tmp/boot.blend --python art/scripts/boot_plate.py -- on  /tmp/boot-on.png  [width] [samples]
#   Blender -b /tmp/boot.blend --python art/scripts/boot_plate.py -- off /tmp/boot-off.png [width] [samples]
# "on" has the tube's light on the desk; "off" is the same frame with the tube dark (the site crossfades on switch-off).
# The C64 (art/downloads/props/c64_monitor.glb, the untouched download; the site ships a meshopt copy Blender can't import) stands on the desk but is invisible to the camera: it only
# casts its shadow and blocks light. The live three.js monitor is drawn over the plate.
import bpy, math, sys
from mathutils import Vector

exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
args = sys.argv[sys.argv.index("--") + 1:]
STATE, OUT = args[0], args[1]
WIDTH = int(args[2]) if len(args) > 2 else 2800
SAMPLES = int(args[3]) if len(args) > 3 else 256

# Boot.tsx's camera, in model units (cm): it looks straight at the glass's centre from DIST away. FW is the frame's
# width on the glass plane (F.w in Boot.tsx). The plate spans PLATE (in frame widths, from the glass's centre):
# keep these in step with PLATE in Boot.tsx.
DIST, FW = 160.0, 48.74172
PLATE = dict(x=1.75, top=1.5, bot=1.21)
GLASS_LOCAL = Vector((0, -17.86, 24.5))  # the glass's centre in the imported model (Blender axes, cm)

sc = bpy.context.scene
D = bpy.data

def hide(o):
    for x in [o, *o.children_recursive]: x.hide_render = True

# ---- the shot's set: no LCD (the C64 replaces it), no chair in the way, no preview-only dust or cone
for n in ("Monitor", "Chair", "PCWireVGA", "PCWireMonitorPower", "LightShaft", "DustMotes"):
    if n in D.objects: hide(D.objects[n])
for c in ("Character", "Dust", "Helpers"):
    if c in D.collections: D.collections[c].hide_render = True

# ---- the C64 in the desk's corner, facing the room diagonally, as far back as its body allows
before = set(D.objects)
bpy.ops.import_scene.gltf(filepath="/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/downloads/props/c64_monitor.glb")
parts = [o for o in D.objects if o not in before]
rig = D.objects.new("BootC64", None); sc.collection.objects.link(rig)
for o in parts:
    if o.parent is None: o.parent = rig
rig.scale = (0.01,) * 3
rig.rotation_euler = (0, 0, math.radians(-135))  # its front (+Y) to the room: (0.707, -0.707)
FRONT = Vector((1, -1, 0)).normalized()
CORNER = Vector((-1.79, 1.79, 0))
DESK = 0.75
rig.location = CORNER + FRONT * 0.75 + Vector((0, 0, DESK + 0.0344))
bpy.context.view_layer.update()
mesh = [o for o in parts if o.type == "MESH"]
vs = [o.matrix_world @ v.co for o in mesh for v in o.data.vertices]
need = max(max(-1.775 - v.x for v in vs), max(v.y - 1.775 for v in vs))  # > 0: pokes into a wall; < 0: room to back up
rig.location += FRONT * (need / 0.7071)  # slide along FRONT until the nearest wall is 1.5 cm off
bpy.context.view_layer.update()
for o in mesh:
    o.visible_camera = False  # the live model is drawn over it; here it only shades
    o.visible_glossy = False
G = rig.matrix_world @ GLASS_LOCAL  # the glass's centre, world
print("glass centre", G, "need", need)

# Anything on the desk where the monitor now stands goes.
inv = rig.matrix_world.inverted()
for o in D.objects:
    if o.type != "MESH" or o.hide_render or o in mesh or o.name.startswith(("Desk", "Floor", "Wall", "Poster", "Tape")): continue
    cs = [o.matrix_world @ Vector(c) for c in o.bound_box]
    c = sum(cs, Vector()) / 8
    lc = inv @ c
    if abs(lc.x) < 24 and -68 < lc.y < -10 and -5 < lc.z < 50: hide(o); print("cleared", o.name)

# ---- set dressing for the shot: her posters hang lower here, round the monitor, and a second string of fairy lights
# droops across the corner just above it (the room's own string runs along the ceiling, out of shot on most screens)
def along(a, wall):  # a point a metres from the corner along the left (x) or back (y) wall, 2 cm off it
    return Vector((-1.77, 1.79 - a, 0)) if wall == "L" else Vector((-1.79 + a, 1.77, 0))
for n, z, a, wall in (("PosterNirvana", 1.1, 0.56, "L"), ("PosterSonata", 1.12, 0.52, "B"), ("PosterOzzy", 1.2, 0.95, "B"), ("PosterZeppelin", 1.42, 1.08, "L"), ("PosterSlipknot", 1.66, 0.2, "L")):
    o = D.objects[n]; p = along(a, wall); o.location = (p.x if wall == "B" else o.location.x, p.y if wall == "L" else o.location.y, z)
bulb = D.materials["FairyBulb"]; bsdf_of(bulb).inputs["Emission Strength"].default_value = 45; wire = D.materials["FairyWire"]
pts = []
for wall in ("L", "B"):
    for k in range(40):
        a = 1.25 * k / 39
        sag = 1.3 - 0.17 * math.sin(math.pi * min(a / 0.95, 1.0)) + max(0, a - 0.95) * 0.3  # corner 1.3, dips to 1.13
        p = along(a, wall); p.z = sag
        pts.append((wall, a, p))
for wall in ("L", "B"):
    seq = [p for w, a, p in pts if w == wall]
    tube(f"BootFairyWire{wall}", [tuple(p) for p in seq], 0.0012, wire, c="Shell")
    for i, p in enumerate(seq[::3]):
        sphere(f"BootBulb{wall}{i}", 0.007, tuple(p - Vector((0, 0, 0.012))), bulb, c="Shell", seg=12, ring=6)
for k, (wall, a) in enumerate((("L", 0.45), ("B", 0.45), ("L", 0.95), ("B", 0.95))):
    p = along(a, wall); p.z = 1.15
    ld = D.lights.new(f"BootFairySpill{k}", "POINT"); ld.energy = 1.2; ld.color = hexc("#FFC98A")[:3]; ld.shadow_soft_size = 0.05
    lo = D.objects.new(ld.name, ld); sc.collection.objects.link(lo); lo.location = p + Vector((0.03, -0.03, 0))

# ---- night: the sun is down, the window is moonlight, the lamp is low and warm, and the tube lights the desk
L = D.objects
L["Sun"].data.energy = 0
L["WindowFill"].data.energy = 10; L["WindowFill"].data.color = hexc("#8C9BFF")[:3]
L["LampSpot"].data.energy = 8; L["LampGlow"].data.energy = 0.6
L["SkyFill"].data.energy = 45
bg = next(n for n in sc.world.node_tree.nodes if n.type == "BACKGROUND"); bg.inputs["Strength"].default_value = 0.5
nt = sc.compositing_node_group; gl = next(n for n in nt.nodes if n.type == "GLARE"); print("GLARE", {p.identifier: getattr(gl, p.identifier) for p in gl.bl_rna.properties if not p.is_readonly and p.identifier not in ("name","label","location","width","height","parent","color","select","show_options","show_preview","hide","mute","show_texture","use_custom_color","bl_idname","warning_propagation","location_absolute")}, [(i.name, i.default_value) for i in gl.inputs if hasattr(i, "default_value")])
for o in L:
    if o.name.startswith("FairySpill"): o.data.energy = 1.2
# the bulbs are bokeh, not lamps: the spill lights above say how much they light the walls
for o in D.objects:
    if o.name == "Glow_Bulbs" or o.name.startswith("BootBulb"): o.visible_diffuse = False; o.visible_glossy = False
tube_l = D.lights.new("BootTube", "AREA"); tube_l.shape = "SQUARE"; tube_l.size = 0.26
tube_l.energy = 30.0 if STATE == "on" else 0.0; tube_l.color = hexc("#DCE6FF")[:3]
to = D.objects.new("BootTube", tube_l); sc.collection.objects.link(to)
to.location = G + FRONT * 0.004
to.rotation_euler = (-FRONT).to_track_quat("Z", "Y").to_euler()  # area lights shine down their -Z: along FRONT
to.visible_camera = False

# ---- Boot.tsx's camera: DIST from the glass, straight on, level; wide enough for the whole plate
cam_d = D.cameras.new("BootCam"); cam = D.objects.new("BootCam", cam_d); sc.collection.objects.link(cam)
cam.location = G + FRONT * (DIST / 100)
cam.rotation_euler = (-FRONT).to_track_quat("-Z", "Y").to_euler()
X = PLATE["x"] * FW; TOP = PLATE["top"] * FW; BOT = -PLATE["bot"] * FW
cam_d.sensor_fit = "HORIZONTAL"; cam_d.sensor_width = 36
cam_d.lens = 18 * DIST / X
cam_d.shift_y = ((TOP + BOT) / 2) / (2 * X)
cam_d.clip_start = 0.05
cam_d.dof.use_dof = True; cam_d.dof.focus_distance = DIST / 100; cam_d.dof.aperture_fstop = 0.13; cam_d.dof.aperture_blades = 0
sc.camera = cam
sc.render.resolution_x = WIDTH; sc.render.resolution_y = round(WIDTH * (TOP - BOT) / (2 * X)); sc.render.resolution_percentage = 100
sc.render.film_transparent = False
sc.render.engine = "CYCLES"; sc.cycles.device = "GPU"; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
sc.view_settings.exposure = -1.6
sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGB"
sc.render.filepath = OUT
if not globals().get("NO_RENDER"): bpy.ops.render.render(write_still=True)
print("plate", sc.render.resolution_x, sc.render.resolution_y, "->", OUT)
