"""Lists pairs of room objects that interpenetrate by more than TOL (contact up to TOL is fine).
Parts of one assembly (same top-level parent, e.g. the chair's parts) are not tested against each other.
Run in room_source.blend:  exec(open(".../check_intersections.py").read()); print(report())"""
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
TOL = 0.002
ROOMC = ("Shell", "Furniture", "Props", "Interactive")
def assembly(o):
    while o.parent: o = o.parent
    return o.name
def world_mesh(o, dg):
    e = o.evaluated_get(dg); me = e.to_mesh()
    vs = [e.matrix_world @ v.co for v in me.vertices]; ps = [tuple(p.vertices) for p in me.polygons]
    e.to_mesh_clear(); return vs, ps
def report(names=None, skip=("Glow_Window", "Sky", "LightShaft", "ShadowFloor", "ShadowBed")):
    dg = bpy.context.evaluated_depsgraph_get()
    objs = [o for o in bpy.data.objects if o.type in ("MESH", "CURVE") and not o.hide_render and o.users_collection
            and o.users_collection[0].name in ROOMC and o.name not in skip]
    data = {}
    for o in objs:
        vs, ps = world_mesh(o, dg)
        if not ps: continue
        mn = Vector([min(v[i] for v in vs) for i in range(3)]); mx = Vector([max(v[i] for v in vs) for i in range(3)])
        data[o.name] = (vs, BVHTree.FromPolygons(vs, ps), mn, mx, assembly(o))
    out = []
    keys = list(data)
    for i, a in enumerate(keys):
        va, ba, mna, mxa, asa = data[a]
        for b in keys[i + 1:]:
            vb, bb, mnb, mxb, asb = data[b]
            if asa == asb: continue
            if names and not (asa in names or asb in names or a in names or b in names): continue
            if any(mxa[k] < mnb[k] - 1e-4 or mxb[k] < mna[k] - 1e-4 for k in range(3)): continue
            if not ba.overlap(bb): continue
            depth = 0.0
            for (vs, other, omn, omx) in ((va, bb, mnb, mxb), (vb, ba, mna, mxa)):
                for v in vs:
                    if all(omn[k] - 0.01 <= v[k] <= omx[k] + 0.01 for k in range(3)):
                        loc, nrm, idx, dist = other.find_nearest(v)
                        if loc is not None and (v - loc).dot(nrm) < 0: depth = max(depth, dist)
            if depth > TOL: out.append((round(depth * 1000, 1), a, b))
    return sorted(out, reverse=True)
