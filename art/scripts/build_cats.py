"""The two cats, soft and slim (they were 1.8 cm voxels). Run in room.blend:

  exec(open(ART + "/scripts/build_cats.py").read())

Each part is built from overlapping ellipsoids, voxel-remeshed into one skin, smoothed and decimated; ears are thin
cones, the tails bevelled curves. It only swaps the mesh data of the existing objects (Siamese_Head, _Paw, _Tail,
_Lids, ... Burmese_Body, _Head, _EarR, ...), so their pivots, parents and actions stay as they were. Fur colour is a
vertex colour ("Col") under Cat_Fur, so the Siamese points shade into the cream instead of stepping."""
import bpy, bmesh, math
from mathutils import Vector, Matrix, Euler

D = bpy.data
sc = bpy.context.scene

# ---------- colours (linear)
IVORY, FAWN, SEAL = (0.80, 0.68, 0.52), (0.36, 0.22, 0.13), (0.050, 0.024, 0.014)
SABLE, SABLE_LT, SABLE_DK = (0.072, 0.027, 0.012), (0.15, 0.06, 0.028), (0.028, 0.010, 0.005)


def mat(name, color, rough=0.6, vcol=False, sheen=0.0):
    m = D.materials.get(name) or D.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    if "Sheen Weight" in b.inputs: b.inputs["Sheen Weight"].default_value = sheen
    for n in [n for n in nt.nodes if n.type == "VERTEX_COLOR"]: nt.nodes.remove(n)
    if vcol:
        v = nt.nodes.new("ShaderNodeVertexColor"); v.layer_name = "Col"; v.location = (-300, 200)
        nt.links.new(v.outputs["Color"], b.inputs["Base Color"])
    return m


FUR = mat("Cat_Fur", (1, 1, 1), 0.7, vcol=True)  # no sheen: under the lavender fill it greyed the sable
EYE = mat("Cat_EyeBlue", (0.03, 0.16, 0.62), 0.08)
EYE_GOLD = mat("Cat_EyeGold", (0.75, 0.42, 0.05), 0.12)
PUPIL = mat("Cat_Pupil", (0.002, 0.002, 0.006), 0.15)
INNER = mat("Cat_InnerEar", (0.32, 0.12, 0.12), 0.7)
NOSE = mat("Cat_Nose", (0.038, 0.010, 0.010), 0.5)
PINK = mat("Cat_Pink", (0.70, 0.16, 0.26), 0.4)


# ---------- primitives, all in the target object's local space
def ell(c, r, rot=(0, 0, 0)):
    return ("e", Vector(c), Vector(r), Euler([math.radians(a) for a in rot]))


def cap(a, b, r, n=None):
    """A capsule from a to b, as a run of spheres (radius r, or a pair (r_a, r_b) tapering)."""
    a, b = Vector(a), Vector(b)
    ra, rb = (r, r) if not isinstance(r, tuple) else r
    n = n or max(2, int((b - a).length / (min(ra, rb) * 0.5)) + 1)
    return [ell(a.lerp(b, i / (n - 1)), [ra + (rb - ra) * i / (n - 1)] * 3) for i in range(n)]


def flat(items):
    out = []
    for it in items: out += it if isinstance(it, list) else [it]
    return out


def bm_ellipsoid(bm, c, r, rot, seg=24, ring=14, m=0):
    g = bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=1)
    M = Matrix.Translation(c) @ rot.to_matrix().to_4x4() @ Matrix.Diagonal((*r, 1))
    bmesh.ops.transform(bm, matrix=M, verts=g["verts"])
    for f in {f for v in g["verts"] for f in v.link_faces}: f.material_index = m


def blob(name, prims, voxel=0.0022, smooth=6, faces=2600, cut_z=None, hull=False):
    """Union of ellipsoids -> one remeshed, smoothed, decimated skin (a temp object; returns its mesh).
    hull: wrap them instead (one convex loaf, no waist between the parts)."""
    bm = bmesh.new()
    for _, c, r, rot in flat(prims): bm_ellipsoid(bm, c, r, rot)
    if hull:
        pts = [v.co.copy() for v in bm.verts]; bm.free(); bm = bmesh.new()
        bmesh.ops.convex_hull(bm, input=[bm.verts.new(p) for p in pts])
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    me = D.meshes.new(name + "_tmp"); bm.to_mesh(me); bm.free()
    o = D.objects.new(name + "_tmp", me); sc.collection.objects.link(o)
    rm = o.modifiers.new("r", "REMESH"); rm.mode = "VOXEL"; rm.voxel_size = voxel; rm.adaptivity = 0
    sm = o.modifiers.new("s", "LAPLACIANSMOOTH"); sm.lambda_factor = 0.8; sm.iterations = smooth  # keeps the volume,
    sm.use_volume_preserve = True; sm.use_normalized = True                                       # so joins don't pinch
    dg = bpy.context.evaluated_depsgraph_get()
    out = D.meshes.new_from_object(o.evaluated_get(dg)); D.objects.remove(o); D.meshes.remove(me)
    bm = bmesh.new(); bm.from_mesh(out)
    if cut_z is not None:  # lying on something: drop what's under it
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < cut_z], context="VERTS")
    bm.to_mesh(out); bm.free()
    ratio = min(1.0, faces / max(1, len(out.polygons)))
    if ratio < 1:
        t = D.objects.new("dec_tmp", out); sc.collection.objects.link(t)
        dm = t.modifiers.new("d", "DECIMATE"); dm.ratio = ratio
        dg = bpy.context.evaluated_depsgraph_get()
        dec = D.meshes.new_from_object(t.evaluated_get(dg)); D.objects.remove(t); D.meshes.remove(out); out = dec
    out.name = name
    return out


def ear(bm, base, tip, width, depth, lean=0.0, m_out=0, m_in=None, seg=12, rings=8):
    """A cat ear: a cone of rings (so colour can shade up it), flattened front to back, its front cupped, bent a
    touch outward; an inner-ear lining sits in the cup."""
    base, tip = Vector(base), Vector(tip)
    up = (tip - base).normalized()
    fwd = Vector((0, -1, 0)); fwd = (fwd - up * fwd.dot(up)).normalized()
    side = up.cross(fwd)
    M = Matrix.Translation(base) @ Matrix((side, fwd, up)).transposed().to_4x4()
    h = (tip - base).length

    def shell(sw, sd, off, m, close_front=False):
        rows = []
        for k in range(rings + 1):
            t = k / rings
            w, d = width * sw * (1 - t) ** 0.85, depth * sd * (1 - t) ** 0.7
            row = []
            for i in range(seg):
                a = 2 * math.pi * i / seg
                x, y = math.cos(a) * w, math.sin(a) * d
                y -= depth * 0.9 * (1 - (x / (width * sw + 1e-9)) ** 2) * (1 - t) * (y < 0)   # cup the front face in
                row.append(bm.verts.new(M @ Vector((x, y - off, t * h * (1 - (1 - sw) * 0.35)))))
            rows.append(row)
        fs = []
        for k in range(rings):
            for i in range(seg):
                j = (i + 1) % seg
                fs.append(bm.faces.new((rows[k][i], rows[k][j], rows[k + 1][j], rows[k + 1][i])))
        fs.append(bm.faces.new(rows[0][::-1]))
        for f in fs: f.material_index = m
        bmesh.ops.pointmerge(bm, verts=rows[-1], merge_co=sum((v.co for v in rows[-1]), Vector()) / seg)

    shell(1, 1, 0, m_out)
    if m_in is not None: shell(0.66, 0.3, depth * 0.55, m_in)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)


def tail(name, pts, r0, r1, res=10):
    """A bevelled curve through pts, radius r0 at the root to r1 at the tip, as a mesh."""
    cu = D.curves.new(name + "_c", "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = 1; cu.bevel_resolution = 4
    cu.use_fill_caps = True; cu.resolution_u = res
    sp = cu.splines.new("NURBS"); sp.points.add(len(pts) - 1); sp.use_endpoint_u = True; sp.order_u = 4
    for i, p in enumerate(pts):
        sp.points[i].co = (*p, 1); t = i / (len(pts) - 1)
        sp.points[i].radius = r0 + (r1 - r0) * t ** 1.4
    o = D.objects.new(name + "_t", cu); sc.collection.objects.link(o)
    dg = bpy.context.evaluated_depsgraph_get()
    me = D.meshes.new_from_object(o.evaluated_get(dg)); D.objects.remove(o); D.curves.remove(cu)
    me.name = name
    return me


def to_mesh(name, bm, mats=()):
    """bm -> a new mesh; the slots go on first, or to_mesh clamps every material index to 0."""
    me = D.meshes.new(name)
    for m in mats: me.materials.append(m)
    bm.to_mesh(me); bm.free()
    return me


def merge(name, *meshes, mats=()):
    bm = bmesh.new()
    for me in meshes:
        if me is None: continue
        if isinstance(me, bmesh.types.BMesh):
            tmp = D.meshes.new("m_tmp"); me.to_mesh(tmp); me = tmp
        bm.from_mesh(me)
    return to_mesh(name, bm, mats)


def paint(me, mats, colour_of):
    """Materials by slot, smooth shading, and the "Col" vertex colour from colour_of(co, material_index)."""
    if list(me.materials) != list(mats):
        me.materials.clear()
        for m in mats: me.materials.append(m)
    for p in me.polygons: p.use_smooth = True
    ca = me.color_attributes.get("Col") or me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    vm = [0] * len(me.vertices)
    for p in me.polygons:
        for v in p.vertices: vm[v] = p.material_index
    for v in me.vertices:
        # only the fur reads it; three.js multiplies COLOR_0 into every primitive, so the rest stay white
        c = colour_of(v.co, vm[v.index]) if mats[vm[v.index]] == FUR else (1, 1, 1)
        ca.data[v.index].color = (*c, 1)
    me.color_attributes.active_color = ca
    me.attributes.default_color_name = "Col"


def mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def ss(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def swap(obj_name, me, location=None):
    o = D.objects[obj_name]
    old = o.data
    o.data = me
    if old and old.users == 0: D.meshes.remove(old)
    if location is not None: o.location = location


def tag(me, m):
    for p in me.polygons: p.material_index = m
    return me


exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/build_cats_siamese.py").read())
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/build_cats_burmese.py").read())
