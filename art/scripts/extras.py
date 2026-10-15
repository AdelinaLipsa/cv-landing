"""Live-character support: shadow catchers, path empties. None of it is baked."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
for n in ("ShadowFloor", "ShadowBed", "PathBed", "PathDesk", "ChairAtDesk", "ChairRest"):
    if n in D.objects: D.objects.remove(D.objects[n], do_unlink=True)
catcher = mat("ShadowCatcher", "#FFFFFF", rough=1.0)
# ShadowFloor: covers the floor, just above the rug's top (rug top is z = 0.014)
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1.8)
o = mesh_obj("ShadowFloor", bm); o.location = (0, 0, 0.016); o.data.materials.append(catcher); put(o, "Nodes"); o.hide_render = True
# ShadowBed: the duvet's top surface, 2 mm up
du = D.objects["Duvet"]; dg = bpy.context.evaluated_depsgraph_get(); ev = du.evaluated_get(dg)
me = ev.to_mesh(); bm = bmesh.new(); bm.from_mesh(me); ev.to_mesh_clear()
bm.transform(du.matrix_world)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.normal.z < 0.6 or f.calc_center_median().z < 0.55], context="FACES")
for v in bm.verts: v.co.z += 0.002
o = mesh_obj("ShadowBed", bm); o.data.materials.append(catcher); put(o, "Nodes"); o.hide_render = True
# where she walks and where the chair goes (on the floor; the chair moves along the desk's diagonal)
empty("PathBed", (0.45, 0.45, 0), c="Nodes", size=0.15).rotation_euler = (0, 0, 0)        # beside the bed, facing it (+Y)
empty("PathDesk", (-0.45, 0.4, 0), c="Nodes", size=0.15).rotation_euler = (0, 0, math.radians(45))  # beside the chair, facing the desk corner
empty("ChairAtDesk", (-1.0, 1.0, 0), c="Nodes", size=0.15).rotation_euler = (0, 0, math.radians(45))  # tucked to the keyboard tray
empty("ChairRest", (-0.58, 0.58, 0), c="Nodes", size=0.15).rotation_euler = (0, 0, math.radians(45))  # pushed back ~60 cm after rolling back
print("extras ok", len(D.objects["ShadowBed"].data.polygons))
