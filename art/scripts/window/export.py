"""Export the baked view (run on art/window.blend after bake.py): each Bake_ group shows its DAY atlas through its
Lightmap UV; the NIGHT atlases ship beside it as WebP (the site blends them). Far (silhouettes) and LitWindows
(one mesh, the site lights them) go out as plain geometry. Empties mark what the site draws live. Writes
art/bake/window_raw.glb and reverts the file. Then: art/scripts/window/ship.sh."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
OUT = ART + "/bake/window_raw.glb"
assert D.objects["PigeonRig"].matrix_world.translation.length > 0.1, "PigeonRig is at the origin: re-run pov.py (it puts the pigeon on the sill)"
bpy.ops.wm.save_mainfile()
vl = bpy.context.view_layer
export = []
for g in ("Near", "Street", "Across"):   # her hands and the mug ship live (hands.glb, export_actors.py)
    o = D.objects["Bake_" + g]
    m = D.materials.new("Baked_" + g); m.use_nodes = True; nt = m.node_tree; b = bsdf_of(m)
    b.inputs["Roughness"].default_value = 1.0
    tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = D.images.load(ART + f"/bake/window_{g.lower()}_day.png", check_existing=True)
    uvn = nt.nodes.new("ShaderNodeUVMap"); uvn.uv_map = "Lightmap"
    nt.links.new(uvn.outputs["UV"], tex.inputs["Vector"]); nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    o.data.materials.clear(); o.data.materials.append(m)
    if "UVMap" in o.data.uv_layers: o.data.uv_layers.remove(o.data.uv_layers["UVMap"])
    for ca in list(o.data.color_attributes): o.data.color_attributes.remove(ca)
    o.name = g; export.append(o)
# the far city and the lit windows: one plain mesh each
def joined(name, objs):
    dg = bpy.context.evaluated_depsgraph_get(); parts = []
    for o in objs:
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg)); me.transform(o.matrix_world)
        p = D.objects.new("tmp_" + o.name, me); bpy.context.scene.collection.objects.link(p); parts.append(p)
    for x in D.objects: x.select_set(False)
    for p in parts: p.select_set(True)
    vl.objects.active = parts[0]; bpy.ops.object.join()
    j = vl.objects.active; j.name = name
    j.data.materials.clear(); j.data.materials.append(mat(name + "Mat", "#FFFFFF", rough=1.0))
    return j
export.append(joined("Far", [o for o in D.collections["Far"].objects if o.type == "MESH"]))
export.append(joined("LitWindows", [o for o in D.collections["LitWindows"].objects if o.type == "MESH" and "ShopLit" not in o.name]))
# markers for live things
mug = D.objects["Mug"]
marks = [empty("HandsPivot", mug.matrix_world.translation.copy(), c="Window"),
         empty("SteamSpot", mug.matrix_world.translation + Vector((0, 0, 0.065)), c="Window"),
         empty("PigeonSpot", D.objects["PigeonRig"].matrix_world.translation.copy(), c="Window")]
marks[2].rotation_euler = D.objects["PigeonRig"].rotation_euler.copy(); marks[2].scale = D.objects["PigeonRig"].scale.copy()
marks += [o for o in D.objects if o.type == "EMPTY" and o.name.startswith(("LampBulbF", "LampBulbN", "NonStopSign", "WindowGlass"))]
# where the passing car and the walkers go: a lane each way and both pavements (y, z of the ground)
for name, y in (("LaneNear", 5.6), ("LaneFar", 9.3), ("WalkNear", 2.7), ("WalkFar", 12.9)):
    marks.append(empty(name, (0, y, -1.3 + (0.15 if name.startswith("Walk") else 0)), c="Window"))
cam = D.objects["ViewCam"]
for x in D.objects: x.select_set(False)
for o in export + marks + [cam]: o.hide_set(False); o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_yup=True, export_apply=True,
                          export_cameras=True, export_lights=False, export_texcoords=True, export_normals=False,
                          export_animations=False, export_materials="EXPORT", export_image_format="AUTO", export_extras=False)
print("exported", OUT)
bpy.ops.wm.revert_mainfile()
