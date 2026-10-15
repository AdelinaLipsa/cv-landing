"""Hard rule for the room: nothing passes through the floor, the rug or the bed by more than 1 mm.
Run in Blender on room_source.blend (or headless: blender -b art/room_source.blend --python art/scripts/check_contacts.py,
which exits 1 if anything is listed). Prints one line per offender: depth in mm, object, surface."""
import bpy, sys
from mathutils import Vector
from mathutils.bvhtree import BVHTree
TOL = 0.001
ROOMC = ("Shell", "Furniture", "Props", "Interactive")
STRUCTURE = ("Floor", "WallLeft", "WallRight", "SkirtLeft", "SkirtRight", "Rug", "Glow_Window", "Sky")
BED = ("BedBase", "BedHead", "BedFoot", "Mattress", "Duvet", "DuvetFold", "Pillow0", "Pillow1", "ThrowFold")
BED_FRAME = ("BedBase", "BedHead", "BedFoot", "Mattress")
WHITELIST = {("BackpackStraps", b) for b in BED}   # the user's exception: the stiff straps tuck into the bed
def objects():
    return [o for o in bpy.data.objects if o.type in ("MESH", "CURVE") and not o.hide_render and o.users_collection
            and o.users_collection[0].name in ROOMC]
def world(o, dg):
    e = o.evaluated_get(dg); me = e.to_mesh()
    vs = [e.matrix_world @ v.co for v in me.vertices]; ps = [tuple(p.vertices) for p in me.polygons]
    e.to_mesh_clear(); return vs, ps
def run():
    dg = bpy.context.evaluated_depsgraph_get()
    rug = bpy.data.objects.get("Rug"); RI = rug.matrix_world.inverted() if rug else None
    rug_top = (rug.matrix_world @ Vector((0, 0, 0.012))).z if rug else None
    bed = {}
    for n in BED:
        o = bpy.data.objects.get(n)
        if o: vs, ps = world(o, dg); bed[n] = (BVHTree.FromPolygons(vs, ps), Vector([min(v[i] for v in vs) for i in range(3)]), Vector([max(v[i] for v in vs) for i in range(3)]))
    out = []
    for o in objects():
        if o.name in STRUCTURE or o.name.startswith("BedLeg"): continue
        vs, ps = world(o, dg)
        if not vs: continue
        inside_room = [v for v in vs if -1.8 <= v.x <= 1.8 and -1.8 <= v.y <= 1.8]
        lo = min((v.z for v in inside_room), default=1.0)
        if lo < -TOL: out.append((round(-lo * 1000, 1), o.name, "floor"))
        if rug and o.name not in BED and not o.name.startswith("BedLeg"):
            d = 0.0
            for v in vs:
                p = RI @ v
                if abs(p.x) <= 1.05 and abs(p.y) <= 0.725 and -0.01 < v.z < rug_top - TOL: d = max(d, rug_top - v.z)
            if d > TOL: out.append((round(d * 1000, 1), o.name, "rug"))
        for n, (bvh, mn, mx) in bed.items():
            if o.name == n or (o.name in BED and n in BED) or (o.name, n) in WHITELIST: continue
            d = 0.0
            for v in vs:
                if all(mn[k] - 0.01 <= v[k] <= mx[k] + 0.01 for k in range(3)):
                    loc, nrm, i, dist = bvh.find_nearest(v)
                    if loc is not None and (v - loc).dot(nrm) < 0: d = max(d, dist)
            if d > TOL: out.append((round(d * 1000, 1), o.name, n))
    # soft bed items must sit on the frame/mattress, not sink into it
    for n in ("Duvet", "DuvetFold", "Pillow0", "Pillow1", "ThrowFold"):
        o = bpy.data.objects.get(n)
        if not o: continue
        vs, ps = world(o, dg)
        for f in BED_FRAME:
            if f not in bed: continue
            bvh, mn, mx = bed[f]; d = 0.0
            for v in vs:
                if all(mn[k] - 0.01 <= v[k] <= mx[k] + 0.01 for k in range(3)):
                    loc, nrm, i, dist = bvh.find_nearest(v)
                    if loc is not None and (v - loc).dot(nrm) < 0: d = max(d, dist)
            if d > TOL: out.append((round(d * 1000, 1), n, f))
    return sorted(out, reverse=True)
offenders = run()
for x in offenders: print("CONTACT", x)
print("check_contacts:", len(offenders), "offender(s)")
if bpy.app.background: sys.exit(1 if offenders else 0)
