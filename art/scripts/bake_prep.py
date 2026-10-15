"""Step 1 of the bake: make every visible part a real mesh, then join static parts into bake groups.
Groups -> atlases: Shell, Furniture, Props, Interactive. Named nodes the site uses stay separate."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
sc = bpy.context.scene; vl = bpy.context.view_layer
# lamp wires live in the asset's own collection: fold them into Props
for o in list(D.collections["desk_lamp_arm_01"].objects):
    if o.type == "MESH": put(o, "Props")
GEO = [o for o in D.objects if o.type in ("MESH", "CURVE") and o.users_collection and o.users_collection[0].name in ("Shell", "Furniture", "Props", "Interactive") and not o.hide_render]
# 1. bake every modifier, constraint, armature pose and curve into plain meshes, keeping world transforms
for o in D.objects: o.select_set(False)
for o in GEO:
    if o.data.users > 1: o.data = o.data.copy()
    o.select_set(True)
vl.objects.active = GEO[0]
bpy.ops.object.convert(target="MESH")
GEO = [o for o in D.objects if o.type == "MESH" and o.users_collection and o.users_collection[0].name in ("Shell", "Furniture", "Props", "Interactive")]
for o in GEO:
    mw = o.matrix_world.copy()
    o.constraints.clear()
    o.matrix_world = mw
# drop the rig, its widgets and hooks
for c in ("hooks", "wdg_widgets"):
    for o in list(D.collections[c].objects): D.objects.remove(o, do_unlink=True)
for o in list(D.collections["desk_lamp_arm_01"].objects): D.objects.remove(o, do_unlink=True)
if "rig_lamp" in D.objects:
    for ch in D.objects["rig_lamp"].children:
        mw = ch.matrix_world.copy(); ch.parent = D.objects["DeskLamp"]; ch.matrix_world = mw
    D.objects.remove(D.objects["rig_lamp"], do_unlink=True)
# 2. one UV layer named UVMap at index 0 on every mesh (textures keep sampling it)
for o in GEO:
    uvs = o.data.uv_layers
    while len(uvs) > 1: uvs.remove(uvs[-1])
    if not len(uvs): uvs.new(name="UVMap")
    uvs[0].name = "UVMap"
# 3. join. First free every mesh parented to another mesh (stickers on the amp, the tower's LED...): joining the
# parent away would otherwise drop the child back to its local coordinates.
bpy.context.view_layer.update()
for o in GEO:
    if o.parent and o.parent.type == "MESH" and o.name not in ("TowerLED",):
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
# 3b. join
def join(name, objs, coll_name):
    objs = [o for o in objs if o.type == "MESH"]
    for o in D.objects: o.select_set(False)
    for o in objs:
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw; o.select_set(True)
    vl.objects.active = objs[0]
    bpy.ops.object.join()
    j = vl.objects.active; j.name = name; j.data.name = name; put(j, coll_name)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return j
KEEP = {"FairyBulbs", "PhoneScreen", "Screen", "Sky", "TowerLED"}
def members(coll_name):
    return [o for o in D.collections[coll_name].all_objects if o.type == "MESH" and o.name not in KEEP]
plant_parts = [o for o in D.objects["Plant"].children_recursive if o.type == "MESH"]
phone_parts = [o for o in D.objects["Phone"].children_recursive if o.type == "MESH" and o.name not in KEEP]
printer_parts = [o for o in D.objects["Printer"].children_recursive if o.type == "MESH"]
special = set(plant_parts + phone_parts + printer_parts + [o for o in D.objects["Tower"].children_recursive if o.type == "MESH"])
def attach(child, parent):
    mw = child.matrix_world.copy(); child.parent = parent; child.matrix_world = mw
pb = join("PhoneBody", phone_parts, "Interactive"); attach(pb, D.objects["Phone"])
prb = join("PrinterBody", printer_parts, "Interactive"); attach(prb, D.objects["Printer"])
tower_parts = [o for o in D.objects["Tower"].children_recursive if o.type == "MESH" and o.name not in KEEP]
led = D.objects["TowerLED"]; tower_empty = D.objects["Tower"]
tw = join("TowerCaseTmp", tower_parts, "Interactive")
mw = led.matrix_world.copy(); led.parent = None; led.matrix_world = mw
D.objects.remove(tower_empty, do_unlink=True)
tw.name = "Tower"; tw.data.name = "Tower"; attach(led, tw)
pl_empty = D.objects["Plant"]; pl_loc = pl_empty.matrix_world.translation.copy()
pm = join("PlantMesh", plant_parts, "Props")
D.objects.remove(pl_empty, do_unlink=True); pm.name = "Plant"; pm.data.name = "Plant"
# origin of the plant at the pot's base, so the site can sway it from there
bpy.context.scene.cursor.location = pl_loc
for o in D.objects: o.select_set(False)
pm.select_set(True); vl.objects.active = pm; bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
# the screen hangs off the Monitor empty, which survives
for grp, cname in (("Room_Shell", "Shell"), ("Room_Furniture", "Furniture"), ("Room_Props", "Props")):
    ms = [o for o in members(cname) if o not in special and o.name not in ("Plant", "Tower")]
    join(grp, ms, cname)
# remove the empties left with no children (old part groups), keeping the named nodes
NAMED = {"Phone", "Printer", "PaperSlot", "NoteScreen", "CatSpot", "CatSpot2", "CharacterSpot", "NotePhone", "NotePrinter",
         "SteamSpot", "WindowGlass", "Monitor", "LightShaft"}
for o in list(D.objects):
    if o.type == "EMPTY" and o.name not in NAMED and not o.children:
        D.objects.remove(o, do_unlink=True)
for o in sorted(D.objects, key=lambda o: o.name):
    if o.type in ("MESH", "EMPTY"):
        print(o.name, o.type, o.parent.name if o.parent else "-", len(o.data.polygons) if o.type == "MESH" else "")
