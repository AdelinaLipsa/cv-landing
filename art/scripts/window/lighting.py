"""Two lightings for the bake: DAY (afternoon sun from behind her bloc, a blue sky) and NIGHT (moonlit blue, orange
street lamps, the NON STOP's shop light, a warm lamp behind her). light_mode("DAY"|"NIGHT") switches.
The site blends the two bakes by Bucharest's clock."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
sc = bpy.context.scene
sc.render.engine = "CYCLES"
try: sc.cycles.device = "GPU"
except Exception: pass
sc.view_settings.view_transform = "AgX"
try: sc.view_settings.look = "AgX - Medium Low Contrast"
except TypeError: pass
for o in list(coll("Lights").objects): D.objects.remove(o, do_unlink=True)
def light(name, kind, loc, energy, color, size=0.1, aim=None, **kw):
    ld = D.lights.new(name, kind); ld.energy = energy; ld.color = hexc(color)[:3]
    if kind == "AREA": ld.shape = "RECTANGLE"; ld.size = size; ld.size_y = kw.get("size_y", size)
    elif kind in ("POINT", "SPOT"): ld.shadow_soft_size = size
    elif kind == "SUN": ld.angle = math.radians(kw.get("angle", 1.5))
    if kind == "SPOT": ld.spot_size = kw.get("spot", math.radians(110)); ld.spot_blend = 0.8
    o = D.objects.new(name, ld); sc.collection.objects.link(o); put(o, "Lights"); o.location = loc
    if aim: o.rotation_euler = (Vector(loc) - Vector(aim)).to_track_quat("Z", "Y").to_euler()
    o["mode"] = kw.get("mode", "BOTH")
    return o
# DAY
sun = light("Sun", "SUN", (0, 0, 30), 4.0, "#FFD6A0", angle=2.5, mode="DAY")
sun.rotation_euler = (Vector((0, 0, 0)) - Vector((-0.78, 0.3, -0.42))).to_track_quat("Z", "Y").to_euler()   # low afternoon sun from up the street: long shadows across the road
light("RoomBounce", "AREA", (0.0, -1.3, 1.6), 5, "#FFE2C8", size=1.6, size_y=1.0, aim=(0, 0, 1.1), mode="DAY")   # inside is dimmer than the street
# NIGHT
moon = light("Moon", "SUN", (0, 0, 30), 0.12, "#9DB0FF", angle=1.0, mode="NIGHT")
moon.rotation_euler = (Vector((0, 0, 0)) - Vector((0.3, -0.5, -0.8))).to_track_quat("Z", "Y").to_euler()
for e in [o for o in D.objects if o.name.startswith("LampBulb")]:
    p = e.matrix_world.translation
    light(e.name + "_L", "SPOT", p - Vector((0, 0, 0.15)), 1400, "#FFB25E", size=0.12, aim=p - Vector((0, 0, 1)), spot=math.radians(120), mode="NIGHT")
light("DeskLamp", "POINT", (-0.75, -0.95, 1.7), 28, "#FFB878", size=0.15, mode="NIGHT")   # behind her, left: warm on her hands and the mug
light("ScreenGlow", "AREA", (0.5, -1.0, 1.2), 4, "#9FB4FF", size=0.4, aim=(0, 0, 1.1), mode="NIGHT")
WORLD = {"DAY": ("#9DB9EA", 0.9), "NIGHT": ("#1A2148", 0.3)}
def light_mode(m):
    for o in coll("Lights").objects:
        o.hide_render = o.get("mode", "BOTH") not in ("BOTH", m)
    w = sc.world or D.worlds.new("World"); sc.world = w; w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs[0].default_value = hexc(WORLD[m][0]); bg.inputs[1].default_value = WORLD[m][1]
    # the shop lights and lit windows: the NON STOP glows at night (it never closes); flats stay live (not baked)
    for o in coll("LitWindows").objects:
        o.hide_render = not (m == "NIGHT" and ("ShopLit" in o.name))
    for n in [n for n in D.materials if n.name.startswith("Sign#")]:
        bsdf_of(n).inputs["Emission Strength"].default_value = 2.0 if m == "NIGHT" else 0.0
    if "LampGlass" in D.materials: bsdf_of(D.materials["LampGlass"]).inputs["Emission Strength"].default_value = 18.0 if m == "NIGHT" else 0.0
    sc.view_settings.exposure = 0.0 if m == "DAY" else -0.2
    print("light mode", m)
light_mode(globals().get("MODE", "DAY"))
