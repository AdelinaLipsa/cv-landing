"""From the Sidewalk kit (Kadre, Sketchfab, CC BY 4.0): a bench, a bin and a postbox for the far pavement. The rest
of the kit (its ground atlases don't tile; its trees are another style) is dropped."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
kit = D.collections.get("Kit")
if kit:
    keep = {"Bench": None, "TrashBin": "Bin.003", "PostBox": None, "Pavement": None, "Pavement_border": None}
    keep = {k: v for k, v in keep.items() if "Kit" + k.split("_")[0] not in D.objects}   # already taken on an earlier run
    picked = {}
    for o in list(kit.all_objects):
        mats = [m.name for m in getattr(o.data, "materials", []) if m] if o.type == "MESH" else []
        hit = next((k for k in keep if k in mats and (keep[k] is None or o.name.startswith(keep[k]))), None)
        if hit:
            mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
            picked.setdefault(hit.split("_")[0], []).append(o)   # the pavers and their kerb stay one piece
    for o in list(kit.all_objects):
        if not any(o in v for v in picked.values()): D.objects.remove(o, do_unlink=True)
    for k, objs in picked.items():
        for x in D.objects: x.select_set(False)
        for o in objs: o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        if len(objs) > 1: bpy.ops.object.join()
        o = bpy.context.view_layer.objects.active; o.name = "Kit" + k
        bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
        # stand it on its base, at the origin, then park it in Assets
        bpy.context.view_layer.update()
        zmin = min((o.matrix_world @ Vector(c)).z for c in o.bound_box); o.location.z -= zmin; o.location.x = o.location.y = 0
        put(o, "Assets")
    D.collections.remove(kit)
# place copies on the far pavement (y 11.4..14.4), facing the street (-y)
kill("Prop")
def place(src, name, x, y, rz):
    c = D.objects[src].copy(); bpy.context.scene.collection.objects.link(c); put(c, "Street"); c.name = name
    c.location = (x, y, -1.3 + 0.15); c.rotation_euler = (0, 0, rz)
for src, name, x, y, rz in [("KitBench", "PropBench", 3.9, 13.7, 0.0), ("KitTrashBin", "PropBin", 2.3, 12.1, 0.4), ("KitPostBox", "PropPost", 8.6, 12.4, 0.0)]:   # in her view: the bench by the kit's tree (tree.py, live)
    if src in D.objects: place(src, name, x, y, rz)
print({o.name: [round(v, 2) for v in o.dimensions] for o in D.objects if o.name.startswith(("Kit", "Prop"))})

# her pavement: the kit's 3.2 x 6 m sidewalk piece (pavers and its kerb), laid end to end along the far pavement
kill("Pave")
if "KitPavement" in D.objects:
    src = [D.objects["KitPavement"]]
    piece = 6.0
    for k in range(-2, 3):   # only what her window shows (each piece is heavy)
        for o in src:
            c = o.copy(); bpy.context.scene.collection.objects.link(c); put(c, "Street"); c.name = f"Pave{o.name[3:]}{k}"
            c.location = (k * piece + 3.0, 12.8, -1.205)   # its pavers flush with the far pavement
            d = c.modifiers.new("Dec", "DECIMATE"); d.decimate_type = "DISSOLVE"; d.angle_limit = math.radians(2)
            c.rotation_euler = (o.rotation_euler.x, o.rotation_euler.y, o.rotation_euler.z + math.pi / 2)
