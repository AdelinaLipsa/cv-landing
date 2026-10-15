exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
import random
random.seed(5)
for p in ("Beanbag", "Book", "CD", "GameBox", "PenCup", "Pen", "Notebook", "Sticky", "Socket", "Plug", "Wire", "Beanbag", "Skate", "Backpack",
          "Sticker", "FloorBook", "Remote", "Sock", "Clutter", "Hoodie", "Tissue", "Photo", "Candle", "Boombox"): kill(p)
P = "Props"; DZ = 0.75; S = 1.8
TX = ART + "/textures/"
covers = D.images.load(TX + "covers.png", check_existing=True)

def cover_box(name, size, loc, cell, rot=(0, 0, 0), parent=None, rough=0.25, coat=0.6, back="#E9E6DE"):
    """A box whose +Z face shows one cell of the 4x2 covers sheet; the rest is a plain colour."""
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    uv = bm.loops.layers.uv.new("UVMap")
    u0, v0 = (cell % 4) / 4, 1 - (cell // 4 + 1) / 2
    for f in bm.faces:
        for l in f.loops:
            if f.normal.z > 0.9:
                l[uv].uv = (u0 + (l.vert.co.x / size[0] + 0.5) * 0.25, v0 + (l.vert.co.y / size[1] + 0.5) * 0.5)
            else:
                l[uv].uv = (u0 + 0.02, v0 + 0.02)  # sides take the cover's border colour
    o = mesh_obj(name, bm); o.location = loc; o.rotation_euler = rot
    m = D.materials.get("Covers") or mat("Covers", rough=rough, coat=coat, image=TX + "covers.png")
    return finish(o, m, bevel=0.0015, c=P, parent=parent)

def book(name, w, h, d, loc, rz, col, tilt=0.0, parent=None):
    """A hardback: coloured cover box with a cream page block set into the fore-edge."""
    cm = mat("Book_" + col, col, rough=0.6)
    b = box(name, (d, w, h), loc, cm, bevel=0.003, rot=(tilt, 0, rz), c=P, parent=parent)
    box(name + "Pages", (d * 0.92, w * 0.9, h * 0.94), (0.004, 0, 0), D.materials.get("Pages") or mat("Pages", "#F1E9D6", rough=0.9), bevel=0.001, c=P, parent=b)
    return b

BOOKC = ["#2A2760", "#B5121B", "#3E6B57", "#E1B04A", "#5D3A7A", "#1E1D24", "#C96C3A", "#EE6E9F", "#7A8FA6", "#D9D2C2"]
# the shelves above the bed: rows of books (hardbacks, worn paperbacks, school textbooks), some leaning,
# a flat stack, CDs, and her childhood figures among them
SX0, SX1, YS = -0.45, 1.15, S - 0.1
def row(x, x_end, z, n_max, tall=(0.17, 0.25), lean_last=True, tag="A"):
    made = []
    for k in range(n_max):
        w = random.uniform(0.018, 0.045); h = random.uniform(*tall); d = random.uniform(0.12, 0.18)
        if x + w > x_end: break
        b = book(f"Book{tag}{k}", w, h, d, (0, 0, 0), 0, random.choice(BOOKC))
        b.rotation_euler = (0, 0, math.pi / 2); b.location = (x + w / 2, YS + (0.17 - d) / 2 - 0.01, z + h / 2); x += w + 0.0015
        made.append((b, w, h))
    if lean_last and made:
        b, w, h = made[-1]; b.rotation_euler = (0, -0.3, math.pi / 2); b.location.x += h * 0.14; b.location.z -= h * 0.04
    return x
T = [1.3 + 0.011, 1.6 + 0.011, 1.9 + 0.011]
row(SX0 + 0.02, 0.1, T[0], 20, tag="L")                          # bottom: school textbooks
for k in range(4):                                                # a flat stack of paperbacks
    book(f"BookStack{k}", 0.13 + random.uniform(-0.01, 0.01), 0.025, 0.19, (0.2, YS - 0.01, T[0] + 0.0125 + k * 0.026),
         math.radians(random.uniform(-8, 8)) + math.pi / 2, random.choice(BOOKC))
for k in range(4):
    cover_box(f"CDStack{k}", (0.142, 0.125, 0.0104), (0.4, YS, T[0] + 0.0052 + k * 0.0106), k % 8, rot=(0, 0, math.radians(random.uniform(-8, 8))))
row(0.5, SX1 - 0.03, T[0], 20, tag="L2")
row(SX0 + 0.02, 0.2, T[1], 20, tall=(0.15, 0.22), tag="M")        # middle: worn paperbacks
for k, cell in enumerate((6, 7)):
    cover_box(f"GameBox{k}", (0.135, 0.19, 0.014), (0.42 + k * 0.016, YS + 0.02, T[1] + 0.095), cell, rot=(math.radians(-90 + 5), 0, math.radians(-3 - k * 6)))
row(0.52, SX1 - 0.03, T[1], 20, tall=(0.15, 0.24), tag="M2")
row(-0.12, 0.62, T[2], 20, tall=(0.16, 0.23), tag="T")            # top: books between the figures
row(0.78, SX1 - 0.03, T[2], 12, tall=(0.14, 0.2), tag="T2")
def figure(n, mode, size, loc, rz):
    g = D.objects["Fig_" + n]
    kids = [o for o in g.children_recursive if o.type == "MESH"]
    g.scale = (1, 1, 1); g.location = (0, 0, 0); g.rotation_euler = (0, 0, 0)
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c_) for o in kids for c_ in o.bound_box]
    mn = Vector([min(p[i] for p in pts) for i in range(3)]); mx = Vector([max(p[i] for p in pts) for i in range(3)])
    dim = mx - mn; k = size / (dim.z if mode == "h" else max(dim)); cc = (mn + mx) / 2
    g.scale = (k, k, k); g.rotation_euler = (0, 0, math.radians(rz))
    off = Vector((cc.x * k, cc.y * k, 0)); g.location = Vector(loc) - Vector((0, 0, mn.z * k)) - (Matrix.Rotation(math.radians(rz), 3, "Z") @ off)
figure("megaman", "h", 0.24, (SX0 + 0.09, YS - 0.02, T[2]), 40)
figure("kid-goku", "h", 0.21, (SX0 + 0.21, YS - 0.02, T[2]), 50)
figure("pokeball", "m", 0.075, (0.29, YS - 0.03, T[1]), 30)
figure("digivice", "h", 0.095, (0.4, YS - 0.02, T[0] + 0.0424), 45)
# desk clutter: pen cup with pens and pencils, a spiral notebook, sticky notes, a few CDs
cupm = mat("PenCupMetal", "#A9A6A0", rough=0.35, metal=0.8)
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=24, radius1=0.035, radius2=0.035, depth=0.1)
pc = mesh_obj("PenCup", bm); finish(pc, cupm, c=P); so = pc.modifiers.new("Solid", "SOLIDIFY"); so.thickness = 0.003
cyl("PenCupBottom", 0.035, 0.004, (0, 0, -0.048), cupm, c=P, parent=pc)
pc.location = (-1.71, 1.12, DZ + 0.05)
for k in range(6):
    col = ["#F5B53F", "#2A2760", "#B5121B", "#F5B53F", "#1E1D24", "#3E6B57"][k]
    a = k / 6 * 2 * math.pi
    p = cyl(f"Pen{k}", 0.004, 0.15, (0.014 * math.cos(a), 0.014 * math.sin(a), 0.03), mat("Pen_" + col, col, rough=0.4), c=P, parent=pc, verts=8)
    p.rotation_euler = (0.18 * math.sin(a), -0.18 * math.cos(a), 0)
nb = box("Notebook", (0.15, 0.21, 0.012), (-1.05, 1.6, DZ + 0.006), mat("NotebookCover", "#3E6B57", rough=0.7), bevel=0.002, rot=(0, 0, 0.35), c=P)
box("NotebookPages", (0.146, 0.2, 0.009), (0.004, 0, 0), D.materials["Pages"], bevel=0.001, c=P, parent=nb)
for k in range(12):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.007, minor_radius=0.001, location=(-0.073, -0.09 + k * 0.0165, 0.0), rotation=(0, math.pi / 2, 0))
    t = bpy.context.view_layer.objects.active; t.name = f"NotebookRing{k}"; finish(t, D.materials["Chrome"], c=P, parent=nb)
for k, (col, loc, rz) in enumerate([("#F5D547", (-1.2, 1.02, DZ + 0.0006), 0.2), ("#EE6E9F", (-1.21, 0.97, DZ + 0.0012), -0.15), ("#9FE0B0", (-1.74, -0.25, 1.06), 0)]):
    s = box(f"Sticky{k}", (0.076, 0.076, 0.0012), loc, mat("Sticky_" + col, col, rough=0.8), bevel=0, rot=(0, 0, rz), c=P)
    if k == 2: s.rotation_euler = (0, math.pi / 2, 0.08)  # one stuck on the wall under the cork board
for k in range(3):
    cover_box(f"CDDesk{k}", (0.142, 0.125, 0.0104), (-1.66, 1.0, DZ + 0.0052 + k * 0.0106), (k * 3) % 8, rot=(0, 0, math.radians(20 + k * 9)))
# a wall socket under the desk, with the printer's, the lamp's and the phone's leads dropping to it
sockm = mat("SocketWhite", "#F2EFE8", rough=0.4)
box("Socket", (0.012, 0.16, 0.08), (-S + 0.006, 0.6, 0.3), sockm, bevel=0.004, c=P)
for k in range(3):
    box(f"Plug{k}", (0.03, 0.035, 0.035), (-S + 0.026, 0.55 + k * 0.05, 0.3), mat("PlugBlack", "#1E1D24", rough=0.5), bevel=0.006, c=P)
wirem = mat("WireBlack", "#1E1D24", rough=0.5)
tube("WirePrinter", [(-1.7, 0.42, DZ + 0.04), (-1.79, 0.46, 0.72), (-1.78, 0.52, 0.5), (-1.76, 0.6, 0.3)], 0.003, wirem, c=P)
tube("WireLamp", [(-1.62, 0.76, DZ - 0.01), (-1.78, 0.76, 0.6), (-1.78, 0.66, 0.4), (-1.76, 0.6, 0.3)], 0.003, wirem, c=P)
# floor: her skateboard against the wall, a backpack by the bed, a pile of books
bpm = mat("BackpackFabric", "#B5121B", rough=0.9, sheen=0.5)
bp = box("Backpack", (0.16, 0.3, 0.4), (1.45, 0.64, 0.2), bpm, bevel=0.06, rot=(0.22, 0, math.radians(80)), c=P, segs=4)
box("BackpackPocket", (0.06, 0.24, 0.18), (0.08, 0, -0.08), bpm, bevel=0.03, c=P, parent=bp, segs=3)
tube("BackpackStrap", [(-0.08, -0.08, 0.18), (-0.13, -0.08, 0.0), (-0.08, -0.08, -0.17)], 0.012, D.materials["BlackPlastic"], c=P, parent=bp)
tube("BackpackStrap2", [(-0.08, 0.08, 0.18), (-0.13, 0.08, 0.0), (-0.08, 0.08, -0.17)], 0.012, D.materials["BlackPlastic"], c=P, parent=bp)
skm = mat("SkateDeck", "#2E8B4E", rough=0.5)
grip = mat("GripTape", "#141317", rough=0.95)
sk = D.objects.new("Skateboard", None); bpy.context.scene.collection.objects.link(sk); put(sk, P)
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=24, y_segments=4, size=0.5)
for v in bm.verts:
    x = v.co.x * 0.8; y = v.co.y * 0.2
    w = 1 - max(0, abs(x) - 0.3) ** 2 * 12
    v.co = Vector((x, y * max(0.55, w), max(0, abs(x) - 0.3) ** 2 * 1.6))
deck = mesh_obj("SkateDeck", bm); finish(deck, skm, c=P, parent=sk)
s = deck.modifiers.new("Solid", "SOLIDIFY"); s.thickness = 0.012
deck.data.materials.append(grip)
for p in deck.data.polygons: p.material_index = 1
s.material_offset = -1
s.material_offset_rim = -1
subsurf(deck, 1)
for xx in (-0.27, 0.27):
    box(f"SkateTruck{xx}", (0.03, 0.16, 0.025), (xx, 0, -0.03), D.materials["Chrome"], bevel=0.006, c=P, parent=sk)
    for yy in (-0.085, 0.085):
        cyl(f"SkateWheel{xx}{yy}", 0.026, 0.03, (xx, yy, -0.045), mat("SkateWheel", "#D9CBA6", rough=0.6), rot=(math.pi / 2, 0, 0), c=P, parent=sk, verts=20)
sk.rotation_euler = (0, math.radians(-110), 0); sk.location = (-1.6, -1.6, 0.41)
for k, (col, rz) in enumerate([("#2A2760", 0.1), ("#E1B04A", -0.25), ("#3E6B57", 0.4), ("#B5121B", 0.05)]):
    book(f"FloorBook{k}", 0.17, 0.035, 0.24, (1.15, -1.35, 0.0175 + k * 0.036), rz, col)
# cover_box("CDFloor", (0.142, 0.125, 0.0104), (0.15, 0.25, 0.006), 5, rot=(0, 0, 0.7))
for k, (col, xx, yy, rz) in enumerate([("#F5B53F", -0.2, 0.03, 0.3), ("#EE6E9F", 0.05, -0.04, -0.2), ("#F2EFE8", 0.22, 0.02, 0.6), ("#2A2760", -0.05, 0.05, 1.0)]):
    box(f"SkateSticker{k}", (0.07, 0.05, 0.001), (xx, yy, -0.0125), mat("Sticker_" + col, col, rough=0.35), bevel=0, rot=(0, 0, rz), c=P, parent=sk)
# stickers on the amp and the desk pedestal
for k, (obj, loc, col) in enumerate([("AmpBox", (0.12, -0.112, 0.05), "#F5B53F"), ("AmpBox", (-0.15, -0.112, 0.31), "#EE6E9F")]):
    s = box(f"Sticker{k}", (0.045, 0.002, 0.045), loc, mat("Sticker_" + col, col, rough=0.35), bevel=0.0, rot=(0, 0.3, 0), c=P, parent=D.objects[obj])
# a curled-up sleeping cat goes on the duvet (built in code)
cs2 = empty("CatSpot2", (0.95, 1.12, 0.627), c="Interactive", size=0.12)
cs2.rotation_euler = (0, 0, math.radians(45))
print("clutter ok")
