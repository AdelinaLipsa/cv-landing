"""Her hot chocolate ("Hot chocolate" by OlegPopka, Sketchfab, CC BY 4.0): the red mug with marshmallows and a
cinnamon stick replaces the room's navy mug. Joined into CocoaMug, scaled to a real mug, its axis on the mug spot
from pov.py, the handle turned away from her. Also writes PROFILE: the mug's outer radius by height (no handle),
which hands_pose.py uses so fingers stop at its real surface."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
if "CocoaMug" not in D.objects:
    c = D.collections["Cocoa"]
    meshes = [o for o in c.objects if o.type == "MESH"]
    body = D.objects["pCylinder1_phongE3_0"]
    bpy.context.view_layer.update()
    # the mug's axis: the centre of its body's vertices that are not the handle (handle is +x in the download)
    vs = [body.matrix_world @ v.co for v in body.data.vertices]
    xs = sorted(v.x for v in vs); ys = sorted(v.y for v in vs)
    ax = Vector(((xs[0] + min(xs[-1], xs[0] + (ys[-1] - ys[0]))) / 2, (ys[0] + ys[-1]) / 2, min(v.z for v in vs)))
    for o in meshes:
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
    for x in D.objects: x.select_set(False)
    for o in meshes: o.select_set(True)
    bpy.context.view_layer.objects.active = body; bpy.ops.object.join()
    j = bpy.context.view_layer.objects.active; j.name = "CocoaMug"; j.data.name = "CocoaMug"
    j.data.transform(j.matrix_world); j.matrix_world = Matrix.Identity(4)
    j.data.transform(Matrix.Translation(-ax))           # origin: bottom centre of the mug's axis
    for o in list(c.objects):
        if o.name != "CocoaMug": D.objects.remove(o)
    put(j, "Window")
    D.collections.remove(c)
j = D.objects["CocoaMug"]
H0 = 0.206   # the mug body's height as downloaded (its tallest point is the cinnamon stick, not the mug)
S = globals().get("COCOA_HEIGHT", 0.122) / H0   # a big cosy mug: its handle fits two fingers
mug = D.objects["Mug"]; C = mug.matrix_world.translation.copy()
# find the handle from the shape: the points well outside the body's usual radius; it turns to point away from her
rs = sorted(math.hypot(v.co.x, v.co.y) for v in j.data.vertices if v.co.z < H0)
r_body = rs[int(len(rs) * 0.6)]
hv = [v.co for v in j.data.vertices if v.co.z < H0 and math.hypot(v.co.x, v.co.y) > r_body * 1.3]
h_ang = math.atan2(sum(v.y for v in hv), sum(v.x for v in hv))
j.rotation_mode = "XYZ"
j.scale = (S, S, S); j.rotation_euler = (0, 0, -h_ang + math.radians(globals().get("COCOA_TURN", 90)))   # handle straight away from her: both hands cup the body (grip.py), the handle between her fingertips
j.location = (C.x, C.y, C.z - 0.06)
# the old navy mug and its bits stay in the file, out of the render
for o in D.objects:
    if o.name.startswith(("Mug", "Marshmallow")): o.hide_render = True; o.hide_set(True)
bpy.context.view_layer.update()
# outer radius by height, leaving out the handle's wedge and the cinnamon stick above the rim
prof = {}
for v in j.data.vertices:
    ang = math.atan2(v.co.y, v.co.x)
    if abs((ang - h_ang + math.pi) % math.tau - math.pi) < math.radians(28) or v.co.z > H0: continue
    k = int(v.co.z * S / 0.005)
    prof[k] = max(prof.get(k, 0), math.hypot(v.co.x, v.co.y) * S)
PROFILE = [(k * 0.005, prof[k]) for k in sorted(prof)]
print("cocoa", round(S, 3), "height", round(H0 * S, 3), "max r", round(max(r for _, r in PROFILE), 3))
# the handle's upright bar (what her right hand closes round): the handle's outermost points, in world space
mw = j.matrix_world
hw = [mw @ v for v in hv]
far = sorted(hw, key=lambda q: -math.hypot(q.x - C.x, q.y - C.y))[: max(6, len(hw) // 4)]
BAR = Vector((sum(q.x for q in far) / len(far), sum(q.y for q in far) / len(far), 0))
BAR_Z = (min(q.z for q in hw), max(q.z for q in hw))
BAR_R = 0.006
print("handle bar", [round(v, 3) for v in BAR], [round(z, 3) for z in BAR_Z])
# the whole handle as a solid: its surface points in a KD-tree (a finger may touch it, not enter it)
from mathutils import kdtree
HANDLE_KD = kdtree.KDTree(len(hw))
for i, q in enumerate(hw): HANDLE_KD.insert(q, i)
HANDLE_KD.balance()
# the hole: between the mug's body and the handle's bar, at the handle's middle height
hz = (BAR_Z[0] + BAR_Z[1]) / 2
radial = Vector((BAR.x - C.x, BAR.y - C.y, 0)).normalized()
r_body_here = max([r for zz, r in PROFILE if abs(zz - (hz - (C.z - 0.06))) < 0.008] + [0.04])
HOLE = Vector((C.x, C.y, hz)) + radial * ((r_body_here + (BAR - Vector((C.x, C.y, 0))).length - BAR_R) / 2)
HOLE.z = hz
print("hole", [round(v, 3) for v in HOLE], "radial width", round((BAR - Vector((C.x, C.y, 0))).length - BAR_R - r_body_here, 3))
