"""LightShaft: the sunbeam as a solid-looking cone, from the window glass to where the light lands. Built from the
sun lamp's real position, so its floor end lines up with the baked patch. Smooth (subdivided along and around).
UV: u runs round the perimeter 0..1, v from the window (0) to the floor (1); caps at both ends.
Preview material: additive emission with a falloff to the edges and toward the floor, plus a little haze noise.
Visible to the camera only (no shadows, not in the bake). The site gives it its own shader + dust."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
kill("LightShaft")
bpy.context.view_layer.update()
L = D.objects["Sun"].matrix_world.translation.copy()
g = D.objects["WindowGlass"]
rect = [g.matrix_world @ Vector(p) for p in ((-1, 0, -1), (1, 0, -1), (1, 0, 1), (-1, 0, 1))]
def end_of(c):
    d = (c - L).normalized(); return c + d * (c.z / -d.z)
NS, NA = 6, 28            # around: per side; along: rings
ring0 = []
for i in range(4):
    a, b = rect[i], rect[(i + 1) % 4]
    for k in range(NS): ring0.append(a.lerp(b, k / NS))
bm = bmesh.new(); uv = bm.loops.layers.uv.new("UVMap")
rings = []
for j in range(NA + 1):
    t = j / NA
    rings.append([bm.verts.new(c.lerp(end_of(c), t)) for c in ring0])
n = len(ring0)
for j in range(NA):
    for i in range(n):
        f = bm.faces.new((rings[j][i], rings[j][(i + 1) % n], rings[j + 1][(i + 1) % n], rings[j + 1][i]))
        for l, (uu, vv) in zip(f.loops, ((i / n, j / NA), ((i + 1) / n, j / NA), ((i + 1) / n, (j + 1) / NA), (i / n, (j + 1) / NA))):
            l[uv].uv = (uu, vv)
for j, vv in ((0, 0.0), (NA, 1.0)):
    f = bm.faces.new(rings[j] if j else list(reversed(rings[j])))
    for l in f.loops: l[uv].uv = (0.5, vv)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
o = mesh_obj("LightShaft", bm); put(o, "Nodes")
for p in o.data.polygons: p.use_smooth = True
m = D.materials.get("LightShaftGlow") or D.materials.new("LightShaftGlow"); m.use_nodes = True
nt = m.node_tree; nt.nodes.clear()
out = nt.nodes.new("ShaderNodeOutputMaterial"); add = nt.nodes.new("ShaderNodeAddShader")
em = nt.nodes.new("ShaderNodeEmission"); tr = nt.nodes.new("ShaderNodeBsdfTransparent")
tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ")
ramp = nt.nodes.new("ShaderNodeValToRGB")   # colour along the beam: peach-gold at the window, rosier at the floor
ramp.color_ramp.elements[0].color = hexc("#FFC48A"); ramp.color_ramp.elements[1].color = hexc("#FFB08A")
lw = nt.nodes.new("ShaderNodeLayerWeight"); lw.inputs["Blend"].default_value = 0.35
mathf = lambda op, a=None, b=None: nt.nodes.new("ShaderNodeMath")
inv_v = nt.nodes.new("ShaderNodeMath"); inv_v.operation = "SUBTRACT"; inv_v.inputs[0].default_value = 1.0
pow_v = nt.nodes.new("ShaderNodeMath"); pow_v.operation = "POWER"; pow_v.inputs[1].default_value = 1.0
inv_f = nt.nodes.new("ShaderNodeMath"); inv_f.operation = "SUBTRACT"; inv_f.inputs[0].default_value = 1.0
pow_f = nt.nodes.new("ShaderNodeMath"); pow_f.operation = "POWER"; pow_f.inputs[1].default_value = 3.0
mul1 = nt.nodes.new("ShaderNodeMath"); mul1.operation = "MULTIPLY"
nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 3.0; nz.inputs["Detail"].default_value = 4
nzr = nt.nodes.new("ShaderNodeMapRange"); nzr.inputs["To Min"].default_value = 0.65; nzr.inputs["To Max"].default_value = 1.15
mul2 = nt.nodes.new("ShaderNodeMath"); mul2.operation = "MULTIPLY"
gain = nt.nodes.new("ShaderNodeMath"); gain.operation = "MULTIPLY"; gain.inputs[1].default_value = 0.9
Lk = nt.links.new
Lk(tc.outputs["UV"], sep.inputs[0]); Lk(sep.outputs["Y"], ramp.inputs["Fac"]); Lk(sep.outputs["Y"], inv_v.inputs[1])
Lk(inv_v.outputs[0], pow_v.inputs[0]); Lk(lw.outputs["Facing"], inv_f.inputs[1]); Lk(inv_f.outputs[0], pow_f.inputs[0])
Lk(pow_v.outputs[0], mul1.inputs[0]); Lk(pow_f.outputs[0], mul1.inputs[1])
Lk(tc.outputs["Generated"], nz.inputs["Vector"]); Lk(nz.outputs["Fac"], nzr.inputs["Value"])
Lk(mul1.outputs[0], mul2.inputs[0]); Lk(nzr.outputs["Result"], mul2.inputs[1]); Lk(mul2.outputs[0], gain.inputs[0])
Lk(ramp.outputs["Color"], em.inputs["Color"]); Lk(gain.outputs[0], em.inputs["Strength"])
Lk(em.outputs[0], add.inputs[0]); Lk(tr.outputs[0], add.inputs[1]); Lk(add.outputs[0], out.inputs["Surface"])
o.data.materials.append(m)
for attr in ("visible_shadow", "visible_diffuse", "visible_glossy", "visible_transmission", "visible_volume_scatter"):
    setattr(o, attr, False)
o.hide_render = False
print("shaft ends", [tuple(round(v, 2) for v in end_of(c)) for c in rect])
