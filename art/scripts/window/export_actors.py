"""Export the live actors from window_source.blend: the rigged pigeon (at the origin; the site puts it on PigeonSpot)
and one Dacia (body + four wheels) for the car that drives past. Writes art/bake/pigeon_raw.glb, dacia_raw.glb."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
def export(path, objs, **kw):  # noqa: kw passes extra glTF options
    for x in D.objects: x.select_set(False)
    for o in objs: o.hide_set(False); o.hide_viewport = False; o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_yup=True, export_apply=False,
                              export_lights=False, export_cameras=False, export_animations=False, export_image_format="AUTO", **kw)
rig = D.objects["PigeonRig"]; keep = (rig.location.copy(), rig.rotation_euler.copy(), rig.scale.copy())
rig.location = (0, 0, 0); rig.rotation_euler = (0, 0, 0); rig.scale = (1, 1, 1)
for pb in rig.pose.bones: pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)
export(ART + "/bake/pigeon_raw.glb", [rig, D.objects["PigeonSit"]], export_skins=True)
rig.location, rig.rotation_euler, rig.scale = keep
D.collections["Assets"].hide_viewport = False
car = D.objects["Dacia"]; kl = car.location.copy(); car.location = (0, 0, 0.26)
export(ART + "/bake/dacia_raw.glb", [car] + list(car.children))
car.location = kl
# her hands round the mug, as plain meshes in the pose (only what she can see of her arms), live-lit on the site
dg = bpy.context.evaluated_depsgraph_get(); eye = D.objects["ViewCam"].location.copy(); parts = []
for o in [o for o in D.objects if o.type in ("MESH", "CURVE") and o.name.startswith(("CocoaMug", "HandLMesh", "HandRMesh", "Sleeve", "Cuff", "Chest")) and not o.hide_render]:
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg); me.transform(o.matrix_world)
    if o.name == "Jumper":
        bm = bmesh.new(); bm.from_mesh(me)
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.calc_center_median().y < eye.y + 0.03 or f.calc_center_median().z < 0.8], context="FACES")
        bm.to_mesh(me); bm.free()
    p = D.objects.new("H_" + o.name, me); bpy.context.scene.collection.objects.link(p); parts.append(p)
    if o.name.startswith(("HandLMesh", "HandRMesh")):
        # the mirrored hand carries mirrored custom normals: drop them, point every face outward, shade smooth
        bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
        with bpy.context.temp_override(object=p, active_object=p, selected_objects=[p]):
            try: bpy.ops.mesh.customdata_custom_splitnormals_clear()
            except Exception as e: print("custom normals:", e)
        for poly in me.polygons: poly.use_smooth = True
export(ART + "/bake/hands_raw.glb", parts, export_normals=True)
for p in parts: D.objects.remove(p)
print("actors exported")
