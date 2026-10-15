exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
sc = bpy.context.scene
for o in list(coll("Lights").objects):
    if o.name not in ("FanGlow", "MonitorGlow"): D.objects.remove(o, do_unlink=True)
LAMP = hexc("#FFC27A")[:3]
def light(name, kind, loc, energy, color, size=0.1, aim=None, **kw):
    ld = D.lights.new(name, kind); ld.energy = energy; ld.color = color
    if kind == "AREA": ld.shape = kw.get("shape", "RECTANGLE"); ld.size = size; ld.size_y = kw.get("size_y", size)
    elif kind in ("POINT", "SPOT"): ld.shadow_soft_size = size
    if kind == "SPOT": ld.spot_size = kw.get("spot", math.radians(100)); ld.spot_blend = 0.9
    o = D.objects.new(name, ld); sc.collection.objects.link(o); put(o, "Lights"); o.location = loc
    if aim: o.rotation_euler = (Vector(loc) - Vector(aim)).to_track_quat("Z", "Y").to_euler()
    return o
W = sc.world; bg = next(n for n in W.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs["Color"].default_value = hexc("#2A3478"); bg.inputs["Strength"].default_value = 0.22
# the desk lamp: a warm spot down onto the desk, and a soft glow round the shade (the monitor's glow is in build_pc.py)
light("LampSpot", "SPOT", (-1.42, 0.6, 1.33), 110, LAMP, size=0.04, aim=(-1.33, 0.75, 0.75), spot=math.radians(115))
light("LampGlow", "POINT", (-1.43, 0.63, 1.43), 6, LAMP, size=0.06)
if "desk_lamp_arm_01_light" in D.materials:
    m = D.materials["desk_lamp_arm_01_light"]; b = bsdf_of(m)
    b.inputs["Emission Color"].default_value = hexc("#FFD6A0"); b.inputs["Emission Strength"].default_value = 25
# fairy lights: the bulbs glow (emissive) and a few soft points along the string spill warm light on the walls
fb = D.objects["Glow_Bulbs"]
vs = [fb.matrix_world @ v.co for v in fb.data.vertices]
for k in range(10):
    p = vs[int(k / 10 * len(vs)) + 20]
    light(f"FairySpill{k}", "POINT", p + Vector((0.08 if p.x < -1.7 else 0, -0.08 if p.y > 1.7 else 0, -0.04)), 9.0, hexc("#FFC98A")[:3], size=0.05)
# cool dusk through the window, plus a soft violet sky fill from above the open sides
light("WindowFill", "AREA", (-2.3, -0.45, 1.7), 35, hexc("#F7B2A0")[:3], size=1.0, size_y=1.2, aim=(-0.6, -0.2, 0.4))
# the low sunset sun: a far, narrow spot through the window, so only the window lets it in and the frame's
# shadow lands as a warm patch across the bed, the floor and the rug
SUN_DIR = Vector((0.95, 0.3, -0.68)).normalized()
WIN_C = Vector((-1.925, -0.45, 1.55))
sun = light("Sun", "SPOT", WIN_C - SUN_DIR * 10, 55000, hexc("#FFA868")[:3], size=0.08, spot=math.radians(12))
sun.data.spot_blend = 0.15
sun.rotation_euler = SUN_DIR.to_track_quat("-Z", "Y").to_euler()
sf = light("SkyFill", "AREA", (2.5, -2.5, 4.0), 70, hexc("#5A66C8")[:3], size=4.0, aim=(-0.4, 0.4, 0.5))
sf.visible_glossy = False  # no big highlight from behind the camera on the screen and the gloss
light("WarmBounce", "AREA", (-0.6, 0.2, 2.55), 0.0, hexc("#FFB88A")[:3], size=1.5, aim=(-0.5, -0.4, 0))
for n in ("FairyBulb",):
    bsdf_of(D.materials[n]).inputs["Emission Strength"].default_value = 30
    bsdf_of(D.materials[n]).inputs["Emission Color"].default_value = hexc("#FFD9A0")
D.objects["MonitorGlow"].data.energy = 12 if "MonitorGlow" in D.objects else 0
bsdf_of(D.materials["Plaster"]).inputs["Base Color"].default_value = hexc("#ECE6F2")  # a touch of lavender
print("lights", len(coll("Lights").objects))

sc.view_settings.exposure = -0.55  # late sunset, almost dark: the warm lights and the beam carry the frame
