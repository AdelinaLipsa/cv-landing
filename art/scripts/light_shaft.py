"""LightShaft: a closed prism from the window glass along the sun to where the light lands. Not baked;
the site draws the shaft and the floating dust in it. UV v = 0 at the window, 1 where it lands."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
kill("LightShaft")
SUN_DIR = Vector((0.95, 0.3, -0.53)).normalized()
g = D.objects["WindowGlass"]   # the glass: a unit cube scaled to the opening inside the frame
corners = [g.matrix_world @ Vector(p) for p in ((-1, 0, -1), (1, 0, -1), (1, 0, 1), (-1, 0, 1))]
ends = [c + SUN_DIR * (c.z / -SUN_DIR.z) for c in corners]  # down to floor level; the bed and rug sit inside it
bm = bmesh.new(); uv = bm.loops.layers.uv.new("UVMap")
vs = [bm.verts.new(p) for p in corners] + [bm.verts.new(p) for p in ends]
faces = [(0, 1, 2, 3), (7, 6, 5, 4)] + [(i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i) for i in range(4)]
for k, f in enumerate(faces):
    face = bm.faces.new([vs[i] for i in f])
    for l in face.loops:
        i = vs.index(l.vert); l[uv].uv = ((i % 4) / 3 if k > 1 else (i % 4 in (1, 2)) * 1.0, 0.0 if i < 4 else 1.0)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
o = mesh_obj("LightShaft", bm); put(o, "Nodes")
m = mat("LightShaftMat", "#FFB070", rough=1.0); o.data.materials.append(m)
o.hide_render = True; o.display_type = "WIRE"
print([tuple(round(v, 2) for v in e) for e in ends])
