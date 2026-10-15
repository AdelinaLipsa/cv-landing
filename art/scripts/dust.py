"""Dust motes for the Blender previews only (collection Dust: not baked, not exported; the site animates its own).
Tiny warm emissive specks scattered inside the LightShaft, denser in the core, glowing less toward its edges."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
import random
random.seed(42)
kill("DustMotes")
bpy.context.view_layer.update()
L = D.objects["Sun"].matrix_world.translation.copy()
g = D.objects["WindowGlass"]
def at(a, b):   # a, b in [-1, 1] across the glass
    return g.matrix_world @ Vector((a, 0, b))
def end_of(c):
    d = (c - L).normalized(); return c + d * (c.z / -d.z)
bm = bmesh.new(); glow = []
for k in range(440):
    a = max(-0.98, min(0.98, random.gauss(0, 0.45))); b = max(-0.98, min(0.98, random.gauss(0, 0.45)))
    c = at(a, b); t = 0.04 + 0.9 * random.random() ** 1.25
    p = c.lerp(end_of(c), t)
    if p.z < 0.03: continue
    r = random.choice([0.001, 0.0012, 0.0015, 0.002, 0.0025, 0.003]) * (2.0 if random.random() < 0.04 else 1.0)
    res = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=r)
    bmesh.ops.translate(bm, vec=p, verts=res["verts"])
    gl = math.exp(-(a * a + b * b) / 0.45) * (1.0 - 0.45 * t)
    glow += [gl] * len(res["verts"])
o = mesh_obj("DustMotes", bm); put(o, "Dust")
at_ = o.data.attributes.new("glow", "FLOAT", "POINT")
for i, v in enumerate(glow): at_.data[i].value = v
m = D.materials.get("DustGlow") or D.materials.new("DustGlow"); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
out = nt.nodes.new("ShaderNodeOutputMaterial"); em = nt.nodes.new("ShaderNodeEmission"); attn = nt.nodes.new("ShaderNodeAttribute")
attn.attribute_name = "glow"; mul = nt.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; mul.inputs[1].default_value = 30.0
em.inputs["Color"].default_value = hexc("#FFE2B8")
nt.links.new(attn.outputs["Fac"], mul.inputs[0]); nt.links.new(mul.outputs[0], em.inputs["Strength"]); nt.links.new(em.outputs[0], out.inputs["Surface"])
o.data.materials.append(m)
for attr in ("visible_shadow", "visible_diffuse", "visible_glossy", "visible_transmission"):
    setattr(o, attr, False)
print("dust motes", len(o.data.polygons) // 20)
