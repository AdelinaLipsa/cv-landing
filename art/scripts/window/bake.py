"""Bake the window view. Run on window_source.blend; it saves the result as art/window.blend and never touches the
source. Each group becomes one mesh (modifiers, curves and poses applied) with a Lightmap UV; DAY and NIGHT are
baked (Cycles, Combined) into one atlas per group, denoised and saved graded to art/bake/window_<group>_<mode>.png.
STEP = "prep" | "bake" (BAKE_ONLY, MODES, SAMPLES optional)."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
import time, os
sc = bpy.context.scene; vl = bpy.context.view_layer
GROUPS = {   # group: (collections, extra object-name prefixes, atlas size)
    "Near": (("Interior", "Window"), (), 2048),
    "Street": (("Street", "Wires", "Cars", "Lamps"), (), 2048),
    "Across": (("Across", "Trees"), (), 2048),
}
EYE = D.objects["ViewCam"].location.copy()
HANDS = ("Mug", "Marshmallow", "Finger", "Thumb", "Body.001", "Jumper", "CocoaMug", "Sleeve", "Cuff", "Chest", "HandL", "HandR")   # live on the site, never baked (they still shade the bake)
def members(g):
    cols, prefixes, _ = GROUPS[g]
    out = []
    for o in D.objects:
        if o.type not in ("MESH", "CURVE") or o.hide_render: continue
        cn = o.users_collection[0].name if o.users_collection else ""
        if cn in ("Assets", "LitWindows", "Far", "Lights", "Helpers"): continue
        if o.name.startswith(("Pigeon", "WGT")): continue
        if (cols and cn in cols and not o.name.startswith(HANDS)) or (prefixes and o.name.startswith(prefixes)):
            out.append(o)
    return out
def prep():
    dg = bpy.context.evaluated_depsgraph_get()
    made = {}
    for g in GROUPS:
        objs = members(g)
        parts = []
        for o in objs:
            me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
            me.transform(o.matrix_world)
            while len(me.uv_layers) > 1: me.uv_layers.remove(me.uv_layers[-1])
            if not len(me.uv_layers): me.uv_layers.new(name="UVMap")
            me.uv_layers[0].name = "UVMap"
            p = D.objects.new("tmp_" + o.name, me); sc.collection.objects.link(p); parts.append(p)
        for x in D.objects: x.select_set(False)
        for p in parts: p.select_set(True)
        vl.objects.active = parts[0]
        bpy.ops.object.join()
        j = vl.objects.active; j.name = "Bake_" + g; j.data.name = "Bake_" + g; put(j, "Baked")
        for o in objs: o.hide_render = True; o.hide_set(True)
        made[g] = j
        print(g, len(objs), "objects ->", len(j.data.polygons), "faces")
    # Lightmap UVs
    for g, j in made.items():
        lm = j.data.uv_layers.new(name="Lightmap"); j.data.uv_layers.active = lm
        for l in j.data.uv_layers: l.active_render = (l.name == "UVMap")
        for x in D.objects: x.select_set(False)
        j.select_set(True); vl.objects.active = j
        bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.002, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
        bpy.ops.uv.select_all(action="SELECT"); bpy.ops.uv.pack_islands(rotate=True, margin=0.002, margin_method="FRACTION")
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.wm.save_as_mainfile(filepath=ART + "/window.blend")
    print("prepped, saved window.blend")
def bake(modes=("DAY", "NIGHT"), only=None, samples=128):
    exec(open(ART + "/scripts/denoise_save.py").read(), globals())
    sc.render.engine = "CYCLES"; sc.cycles.samples = samples; sc.cycles.bake_type = "COMBINED"
    sc.render.bake.margin = 6; sc.render.bake.margin_type = "EXTEND"; sc.render.bake.use_clear = True; sc.render.bake.target = "IMAGE_TEXTURES"
    os.makedirs(ART + "/bake", exist_ok=True)
    for m in modes:
        globals()["MODE"] = m
        exec(open(ART + "/scripts/window/lighting.py").read(), globals())
        for g in (only or GROUPS):
            j = D.objects["Bake_" + g]; size = GROUPS[g][2]
            img = D.images.get(f"W_{g}_{m}") or D.images.new(f"W_{g}_{m}", size, size, alpha=False, float_buffer=True)
            for s in j.material_slots:
                nt = s.material.node_tree
                n = nt.nodes.get("BAKE_TARGET") or nt.nodes.new("ShaderNodeTexImage")
                n.name = "BAKE_TARGET"; n.image = img; nt.nodes.active = n
            for x in D.objects: x.select_set(False)
            j.select_set(True); vl.objects.active = j; j.data.uv_layers.active = j.data.uv_layers["Lightmap"]
            t = time.time(); bpy.ops.object.bake(type="COMBINED")
            denoise_save(img.name, ART + f"/bake/window_{g.lower()}_{m.lower()}.png")
            print(g, m, "baked in", round(time.time() - t, 1), "s")
STEP = globals().get("STEP", "prep")
if STEP == "prep": prep()
elif STEP == "bake": bake(globals().get("MODES", ("DAY", "NIGHT")), globals().get("BAKE_ONLY"), globals().get("SAMPLES", 128))
