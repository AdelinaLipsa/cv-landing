"""The Sidewalk kit's tree (Kadre, CC BY 4.0), by the bench: exported on its own (tree.glb) because its leaves are
alpha cards the bake can't hold. The site draws it live, swaying in Bucharest's wind, coloured by the month.
Imports the kit into a throwaway collection, keeps bark, branches and leaves as two meshes, exports, cleans up."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
before = set(D.objects.keys())
bpy.ops.import_scene.gltf(filepath=ART + "/downloads/sidewalk/sidewalk.glb")
new = [D.objects[n] for n in set(D.objects.keys()) - before]
for o in new:
    mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
def mats(o): return [m.name for m in o.data.materials if m] if o.type == "MESH" else []
leaf = [o for o in new if any(m.startswith("leafs_set") for m in mats(o))]
wood = [o for o in new if o not in leaf and any(m.startswith(("TreeBark", "Branch_")) for m in mats(o))]
def join(objs, name):
    for x in D.objects: x.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join()
    j = bpy.context.view_layer.objects.active; j.name = name; return j
L, W = join(leaf, "TreeLeaves"), join(wood, "TreeWood")
keep = {L.name, W.name}
for n in [n for n in set(D.objects.keys()) - before if n not in keep]: D.objects.remove(D.objects[n])
bpy.context.view_layer.update()
# trunk base to the origin
base = min([W.matrix_world @ Vector(c) for c in W.bound_box], key=lambda v: v.z)
cx = sum((W.matrix_world @ Vector(c)).x for c in W.bound_box) / 8; cy = sum((W.matrix_world @ Vector(c)).y for c in W.bound_box) / 8
for o in (L, W):
    o.data.transform(o.matrix_world); o.matrix_world = Matrix.Identity(4)
    o.data.transform(Matrix.Translation((-cx, -cy, -base.z)))
d = W.modifiers.new("Dec", "DECIMATE"); d.ratio = 0.1   # 169k faces of bark as downloaded
print("tree", [round(v, 2) for v in W.dimensions], [round(v, 2) for v in L.dimensions], len(L.data.polygons), len(W.data.polygons))
for x in D.objects: x.select_set(False)
L.select_set(True); W.select_set(True)
bpy.ops.export_scene.gltf(filepath=ART + "/bake/tree_raw.glb", export_format="GLB", use_selection=True, export_yup=True, export_apply=True,
                          export_animations=False, export_image_format="AUTO")
D.objects.remove(L); D.objects.remove(W)
print("tree exported")
