"""Her Dacia 1300 (solid3DDD, Sketchfab, CC BY 4.0) as an asset: one body mesh + four named wheels under an empty,
kept in the Assets collection. Parked copies along the far kerb in classic Dacia colours (a hue shift on its texture);
the site drives one more past (DaciaDrive)."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
if "DaciaBody" not in D.objects:
    body = [D.objects[n] for n in ("Object_10", "Object_11", "Object_8", "Object_6")]
    for o in body + [D.objects[n] for n in ("Object_4", "Object_13", "Object_15", "Object_17")]:
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
    for x in bpy.context.selected_objects: x.select_set(False)
    for o in body: o.select_set(True)
    bpy.context.view_layer.objects.active = body[0]; bpy.ops.object.join()
    D.objects["Object_10"].name = "DaciaBody"
    for old, new in (("Object_4", "DaciaWheelFL"), ("Object_13", "DaciaWheelFR"), ("Object_15", "DaciaWheelRL"), ("Object_17", "DaciaWheelRR")):
        D.objects[old].name = new
    for n in ("wrl_5", "wrr_6", "batranaGlass_2", "wfr_4", "root", "GLTF_SceneRootNode", "batranaBody_3", "batranaInt_1", "Sketchfab_model", "wfl_0"):
        if n in D.objects: D.objects.remove(D.objects[n])
    root = D.objects.new("Dacia", None); bpy.context.scene.collection.objects.link(root)
    for n in ("DaciaBody", "DaciaWheelFL", "DaciaWheelFR", "DaciaWheelRL", "DaciaWheelRR"):
        o = D.objects[n]; mw = o.matrix_world.copy(); o.parent = root; o.matrix_world = mw
    for o in [root] + list(root.children): put(o, "Assets")
    root.location = (0, 0, 0.26)   # its wheels touch z = 0
# colour variants: a hue/value shift on the body texture
def variant(name, hue, sat, val):
    base = next(m for m in D.objects["DaciaBody"].data.materials if m.name.startswith("batranaTexture"))
    m = D.materials.get(name) or base.copy(); m.name = name
    nt = m.node_tree; b = bsdf_of(m)
    tex = next(n for n in nt.nodes if n.type == "TEX_IMAGE" and any(l.to_socket == b.inputs["Base Color"] or l.to_node.type == "HUE_SAT" for l in n.outputs["Color"].links))
    hs = next((n for n in nt.nodes if n.type == "HUE_SAT"), None) or nt.nodes.new("ShaderNodeHueSaturation")
    hs.inputs["Hue"].default_value = hue; hs.inputs["Saturation"].default_value = sat; hs.inputs["Value"].default_value = val
    nt.links.new(tex.outputs["Color"], hs.inputs["Color"]); nt.links.new(hs.outputs["Color"], b.inputs["Base Color"])
    return m
VARIANTS = {"teal": None, "cream": ("DaciaCream", 0.5, 0.15, 1.6), "red": ("DaciaRed", 0.0, 1.2, 0.85), "mustard": ("DaciaMustard", 0.13, 1.1, 1.15)}
kill("Parked")
def parked(name, x, y, rz, colour):
    src = D.objects["Dacia"]
    root = D.objects.new(name, None); bpy.context.scene.collection.objects.link(root); put(root, "Cars")
    root.location = (x, y, -1.3); root.rotation_euler = (0, 0, rz)
    for ch in src.children:
        c = ch.copy(); bpy.context.scene.collection.objects.link(c); put(c, "Cars"); c.parent = root
        c.matrix_parent_inverse = src.matrix_world.inverted() @ Matrix.Translation((0, 0, 0.26))
        c.name = f"{name}_{ch.name[5:]}"
        if ch.name == "DaciaBody" and VARIANTS[colour]:
            c.data = ch.data.copy()
            mi = next(i for i, m in enumerate(c.data.materials) if m.name.startswith("batranaTexture"))
            c.data.materials[mi] = variant(*VARIANTS[colour])
    return root
for o in [o for o in D.objects if o.name.startswith("Car") and o.users_collection and o.users_collection[0].name == "Cars"]:
    D.objects.remove(o)
for k, (x, rz, col) in enumerate([(-24.0, math.pi / 2, "cream"), (-12.5, math.pi / 2, "teal"), (-2.0, math.pi / 2 + 0.03, "red"), (9.5, math.pi / 2, "mustard"), (19.0, math.pi / 2, "cream")]):
    parked(f"Parked{k}", x, 10.15, rz, col)
print("parked", len([o for o in D.objects if o.name.startswith("Parked")]))
