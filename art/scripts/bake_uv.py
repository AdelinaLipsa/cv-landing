"""Step 2: a second UV ('Lightmap') per bake group, smart-projected and packed into one atlas each."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
GROUPS = {
    "Shell": ["Room_Shell", "Glow_Bulbs", "Glow_Window"],
    "Furniture": ["Room_Furniture"],
    "Props": ["Room_Props", "Plant", "Glow_Lamp"],
    "Interactive": ["PhoneBody", "PhoneScreen", "PrinterBody", "Screen", "Tower", "TowerLED", "ChairSeat", "ChairBase"],
}
vl = bpy.context.view_layer
def unwrap(names, margin=0.0015, angle=66):
    objs = [D.objects[n] for n in names]
    for o in D.objects: o.select_set(False)
    for o in objs:
        uvs = o.data.uv_layers
        lm = uvs.get("Lightmap") or uvs.new(name="Lightmap")
        uvs.active = lm
        for i, l in enumerate(uvs): l.active_render = (l.name == "UVMap")
        o.select_set(True)
    vl.objects.active = objs[0]
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(angle), island_margin=margin, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.uv.select_all(action="SELECT")
    bpy.ops.uv.pack_islands(rotate=True, margin=margin, margin_method="FRACTION")
    bpy.ops.object.mode_set(mode="OBJECT")
    # report how much of the square the islands fill
    import bmesh as _b
    area = 0.0
    for o in objs:
        uv = o.data.uv_layers["Lightmap"].data
        for p in o.data.polygons:
            pts = [uv[i].uv for i in p.loop_indices]
            a = 0.0
            for k in range(len(pts)):
                x1, y1 = pts[k]; x2, y2 = pts[(k + 1) % len(pts)]; a += x1 * y2 - x2 * y1
            area += abs(a) / 2
    return area
for g, names in GROUPS.items():
    print(g, "uv fill", round(unwrap(names, 0.003 if g == "Interactive" else 0.0015, 75 if g == "Props" else 66), 3))
