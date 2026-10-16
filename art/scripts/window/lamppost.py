"""Her lamppost (Liquell, Sketchfab, CC BY 4.0) as an asset: LampPoleMesh (pole, arm, head) and LampGlassMesh (the
bulb) under an empty in Assets, scaled to a Bucharest 7.5 m concrete post. build_view.py places copies."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
if "Lamppost" not in D.objects:
    parts = [D.objects[n] for n in ("Object_4", "Object_6", "Object_8")]; bulb = D.objects["Object_10"]
    for o in parts + [bulb]:
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
    for n in ("Circle_0", "Circle.001_1", "root", "GLTF_SceneRootNode", "Sphere_3", "Sketchfab_model", "Circle.002_2"):
        if n in D.objects: D.objects.remove(D.objects[n])
    for x in D.objects: x.select_set(False)
    for o in parts: o.select_set(True)
    vl = bpy.context.view_layer; vl.objects.active = parts[0]; bpy.ops.object.join()
    pole = vl.objects.active; pole.name = "LampPoleMesh"; bulb.name = "LampGlassMesh"
    root = D.objects.new("Lamppost", None); bpy.context.scene.collection.objects.link(root)
    for o in (pole, bulb):
        mw = o.matrix_world.copy(); o.parent = root; o.matrix_world = mw; put(o, "Assets")
    put(root, "Assets"); root.scale = (1.5, 1.5, 1.5)
    gm = mat("LampGlass", "#FFF1D6", rough=0.2, emit="#FFC27A", strength=0.0)
    bulb.data.materials.clear(); bulb.data.materials.append(gm)
bpy.context.view_layer.update()
b = D.objects["LampGlassMesh"]
print("bulb local", [round(v, 3) for v in (D.objects["Lamppost"].matrix_world.inverted() @ b.matrix_world @ Vector(b.bound_box[0]).lerp(Vector(b.bound_box[6]), 0.5))])
