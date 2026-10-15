"""Step 3: bake Combined light per group into a float atlas (Cycles), then denoise and save it graded."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
import time
GROUPS = {
    "Shell": (["Room_Shell", "Glow_Bulbs", "Glow_Window"], 2048),
    "Furniture": (["Room_Furniture"], 2048),
    "Props": (["Room_Props", "Plant", "Glow_Lamp"], 2048),
    "Interactive": (["PhoneBody", "PhoneScreen", "PrinterBody", "Screen", "Tower", "TowerLED", "ChairSeat", "ChairBase"], 2048),
}
sc = bpy.context.scene; vl = bpy.context.view_layer
sc.render.engine = "CYCLES"
sc.cycles.samples = BAKE_SAMPLES if "BAKE_SAMPLES" in dir() else 256
sc.cycles.bake_type = "COMBINED"
sc.render.bake.margin = 8; sc.render.bake.margin_type = "EXTEND"; sc.render.bake.use_clear = True
sc.render.bake.target = "IMAGE_TEXTURES"
def bake_group(g):
    names, size = GROUPS[g]
    img = D.images.get("Bake_" + g)
    if img and tuple(img.size) != (size, size): D.images.remove(img); img = None
    img = img or D.images.new("Bake_" + g, size, size, alpha=False, float_buffer=True)
    objs = [D.objects[n] for n in names]
    mats = {s.material for o in objs for s in o.material_slots if s.material}
    for m in mats:
        nt = m.node_tree
        n = nt.nodes.get("BAKE_TARGET") or nt.nodes.new("ShaderNodeTexImage")
        n.name = "BAKE_TARGET"; n.label = "bake target"; n.image = img; n.location = (-900, 600)
        nt.nodes.active = n
    for o in D.objects: o.select_set(False)
    for o in objs:
        o.select_set(True); o.data.uv_layers.active = o.data.uv_layers["Lightmap"]
    vl.objects.active = objs[0]
    # the chair moves on the site: it gets its own bake (with the Interactive group) and stays out of the room's
    chair = [D.objects[n] for n in ("ChairSeat", "ChairBase") if n in D.objects]
    for o in chair: o.hide_render = g != "Interactive"
    preview_only = [D.objects["LightShaft"]] + list(D.collections["Dust"].all_objects if "Dust" in D.collections else [])
    for o in preview_only: o.hide_render = True   # the cone and the dust are drawn live on the site
    t = time.time()
    bpy.ops.object.bake(type="COMBINED")
    for o in chair: o.hide_render = False
    for o in preview_only: o.hide_render = False
    print(g, "baked in", round(time.time() - t, 1), "s")
    return img
for g in (BAKE_ONLY if "BAKE_ONLY" in dir() else GROUPS):
    bake_group(g)
