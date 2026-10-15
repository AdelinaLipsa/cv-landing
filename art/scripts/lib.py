# Shared helpers for building the room. Run inside Blender: exec(open(LIB).read())
import bpy, bmesh, math, mathutils
from mathutils import Vector, Matrix, Euler
D = bpy.data
ART = "/Users/adelinalipsa/Documents/GitHub/adelina-cv/art"

def hexc(h, a=1.0):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return (*lin, a)

def node(nt, t):
    return nt.nodes.new(t)

def bsdf_of(m):
    return next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")

def mat(name, color=(0.8, 0.8, 0.8, 1), rough=0.6, metal=0.0, emit=None, strength=0.0, coat=0.0, sheen=0.0, image=None, bump=0.0):
    m = D.materials.get(name) or D.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = bsdf_of(m)
    if isinstance(color, str): color = hexc(color)
    b.inputs["Base Color"].default_value = color
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if coat: b.inputs["Coat Weight"].default_value = coat
    if sheen: b.inputs["Sheen Weight"].default_value = sheen
    if emit is not None:
        if isinstance(emit, str): emit = hexc(emit)
        b.inputs["Emission Color"].default_value = emit
        b.inputs["Emission Strength"].default_value = strength
    if image:
        tex = next((n for n in nt.nodes if n.type == "TEX_IMAGE"), None) or node(nt, "ShaderNodeTexImage")
        tex.image = D.images.load(image, check_existing=True)
        nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
        if emit is not None: nt.links.new(tex.outputs["Color"], b.inputs["Emission Color"])
    if bump:
        nz = node(nt, "ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 180
        bp = node(nt, "ShaderNodeBump"); bp.inputs["Strength"].default_value = bump; bp.inputs["Distance"].default_value = 0.002
        nt.links.new(nz.outputs["Fac"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m

def coll(name):
    c = D.collections.get(name)
    if not c:
        c = D.collections.new(name); bpy.context.scene.collection.children.link(c)
    return c

def put(o, c):
    for cc in list(o.users_collection): cc.objects.unlink(o)
    coll(c).objects.link(o)
    return o

def finish(o, m=None, bevel=0.0, segs=3, c="Props", smooth=True, parent=None):
    if m is not None:
        o.data.materials.clear(); o.data.materials.append(m)
    if bevel:
        bv = o.modifiers.new("Bevel", "BEVEL"); bv.width = bevel; bv.segments = segs; bv.limit_method = "ANGLE"
        bv.harden_normals = False
    if smooth:
        for p in o.data.polygons: p.use_smooth = True
        if bevel:
            wn = o.modifiers.new("WN", "WEIGHTED_NORMAL"); wn.keep_sharp = True
    put(o, c)
    if parent: o.parent = parent
    return o

def mesh_obj(name, bm):
    me = D.meshes.new(name); bm.to_mesh(me); bm.free()
    o = D.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    return o

def box(name, size, loc, m=None, bevel=0.008, rot=(0, 0, 0), c="Props", parent=None, segs=3):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    o = mesh_obj(name, bm); o.location = loc; o.rotation_euler = rot
    return finish(o, m, bevel=bevel, c=c, parent=parent, segs=segs)

def cyl(name, r, h, loc, m=None, verts=32, bevel=0.004, rot=(0, 0, 0), c="Props", r2=None, parent=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=h)
    o = mesh_obj(name, bm); o.location = loc; o.rotation_euler = rot
    return finish(o, m, bevel=bevel, c=c, parent=parent)

def sphere(name, r, loc, m=None, c="Props", seg=24, ring=12, scale=(1, 1, 1), parent=None):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=r)
    bmesh.ops.scale(bm, vec=Vector(scale), verts=bm.verts)
    o = mesh_obj(name, bm); o.location = loc
    return finish(o, m, c=c, parent=parent)

def empty(name, loc, parent=None, size=0.05, c="Nodes"):
    o = D.objects.get(name) or D.objects.new(name, None)
    if not o.users_collection: bpy.context.scene.collection.objects.link(o)
    put(o, c); o.empty_display_size = size; o.empty_display_type = "PLAIN_AXES"
    o.parent = parent
    o.location = loc
    return o

def tube(name, pts, r, m=None, c="Props", res=8, parent=None):
    cu = D.curves.new(name, "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = r; cu.bevel_resolution = 3
    sp = cu.splines.new("BEZIER"); sp.bezier_points.add(len(pts) - 1)
    for bp, p in zip(sp.bezier_points, pts):
        bp.co = p; bp.handle_left_type = bp.handle_right_type = "AUTO"
    cu.resolution_u = res
    o = D.objects.new(name, cu); bpy.context.scene.collection.objects.link(o)
    if m: cu.materials.append(m)
    put(o, c)
    if parent: o.parent = parent
    return o

def subsurf(o, lv=2):
    s = o.modifiers.new("Sub", "SUBSURF"); s.levels = lv; s.render_levels = lv
    return o

def kill(prefix):
    for o in list(D.objects):
        if o.name.startswith(prefix): D.objects.remove(o, do_unlink=True)

def woodmat(name, c1, c2, rough=0.55, scale=6.0, axis="X"):
    """Procedural grain: a stretched wave texture blending two tones, in object space."""
    m = mat(name, c1, rough=rough); nt = m.node_tree; b = bsdf_of(m)
    for n in [n for n in nt.nodes if n.type not in ("BSDF_PRINCIPLED", "OUTPUT_MATERIAL")]: nt.nodes.remove(n)
    tc = node(nt, "ShaderNodeTexCoord"); mp = node(nt, "ShaderNodeMapping")
    s = {"X": (0.15, 1, 1), "Y": (1, 0.15, 1), "Z": (1, 1, 0.15)}[axis]
    mp.inputs["Scale"].default_value = s
    nz = node(nt, "ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 3; nz.inputs["Detail"].default_value = 6
    wv = node(nt, "ShaderNodeTexWave"); wv.inputs["Scale"].default_value = scale; wv.inputs["Distortion"].default_value = 6
    wv.inputs["Detail"].default_value = 3
    ramp = node(nt, "ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = hexc(c1) if isinstance(c1, str) else c1
    ramp.color_ramp.elements[1].color = hexc(c2) if isinstance(c2, str) else c2
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"]); nt.links.new(mp.outputs["Vector"], wv.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], nz.inputs["Vector"]); nt.links.new(nz.outputs["Fac"], wv.inputs["Phase Offset"])
    nt.links.new(wv.outputs["Fac"], ramp.inputs["Fac"]); nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    return m

def imgmat(name, path, rough=0.8, emit=0.0):
    m = mat(name, rough=rough, image=path, emit=(1, 1, 1, 1) if emit else None, strength=emit)
    return m

def planeuv(name, w, h, loc, rot, m, c="Props", parent=None, curl=0.0, segs=1):
    """A UV-mapped rectangle (posters, notes). curl > 0 lifts the bottom corners off the wall."""
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=segs, y_segments=segs, size=0.5)
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        for l in f.loops: l[uv].uv = (l.vert.co.x + 0.5, l.vert.co.y + 0.5)
    for v in bm.verts:
        x, y = v.co.x, v.co.y
        v.co = Vector((x * w, y * h, curl * (max(0, -y) ** 2 * 4) * (abs(x) * 2) ** 2 + curl * 0.3 * max(0, y - 0.3)))
    o = mesh_obj(name, bm); o.location = loc; o.rotation_euler = rot
    return finish(o, m, c=c, parent=parent)
