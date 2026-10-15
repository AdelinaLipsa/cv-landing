exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
TX = ART + "/textures/"
for p in ("WindowRig", "Skirt", "WinFrame", "WinMullion", "WinTransom", "HoleCutter", "WindowGlass", "Sill", "Sky", "Curtain", "Rod", "Rug", "Poster", "Tape", "Cork", "Fairy", "Glow_Bulbs", "Glow_Window"): kill(p)
S, T, H = 1.8, 0.25, 2.6
# The window is in the LEFT wall, where the sunset comes in. Its parts are built as if on the right wall
# (y = S, across x) and the whole set is then turned 90 degrees about Z, which maps x -> y and y = S -> x = -S.
WX, WW, WZ0, WZ1 = -0.45, 1.0, 0.98, 2.12   # WX = the window centre's y on the left wall
hole = box("HoleCutter", (WW, 1.0, WZ1 - WZ0), (WX, S + T / 2, (WZ0 + WZ1) / 2), None, bevel=0, c="Helpers")
hole.display_type = "WIRE"; hole.hide_render = True
for wn in ("WallRight", "WallLeft"):
    md = D.objects[wn].modifiers.get("Window")
    if md: D.objects[wn].modifiers.remove(md)
bo = D.objects["WallLeft"].modifiers.new("Window", "BOOLEAN"); bo.object = hole; bo.operation = "DIFFERENCE"; bo.solver = "EXACT"
D.objects["WallLeft"].modifiers.move(len(D.objects["WallLeft"].modifiers) - 1, 0)
we = empty("WindowGlass", (WX, S + 0.1, (WZ0 + WZ1) / 2), c="Interactive", size=0.5); we.empty_display_type = "CUBE"
we.scale = (0.5 * (WW - 0.11), 0.01, 0.5 * (WZ1 - WZ0 - 0.11))  # the glass inside the frame; code adds the rain here
white = mat("PaintWhite", "#F3F0EA", rough=0.45)
box("SkirtLeft", (0.018, 2 * S, 0.09), (-S + 0.009, 0, 0.045), white, bevel=0.004, c="Shell")
box("SkirtRight", (2 * S, 0.018, 0.09), (0, S - 0.009, 0.045), white, bevel=0.004, c="Shell")
# window: reveal lining, frame, mullions, sill
fw = 0.055
box("WinFrameTop", (WW, 0.08, fw), (WX, S + 0.1, WZ1 - fw / 2), white, c="Shell")
box("WinFrameBot", (WW, 0.08, fw), (WX, S + 0.1, WZ0 + fw / 2), white, c="Shell")
box("WinFrameL", (fw, 0.08, WZ1 - WZ0), (WX - WW / 2 + fw / 2, S + 0.1, (WZ0 + WZ1) / 2), white, c="Shell")
box("WinFrameR", (fw, 0.08, WZ1 - WZ0), (WX + WW / 2 - fw / 2, S + 0.1, (WZ0 + WZ1) / 2), white, c="Shell")
box("WinMullion", (0.035, 0.05, WZ1 - WZ0), (WX, S + 0.1, (WZ0 + WZ1) / 2), white, c="Shell")
box("WinTransom", (WW, 0.05, 0.035), (WX, S + 0.1, WZ0 + (WZ1 - WZ0) * 0.68), white, c="Shell")
box("Sill", (WW + 0.16, 0.2, 0.035), (WX, S - 0.02, WZ0 - 0.0175 + 0.002), white, bevel=0.008, c="Shell")
sky = imgmat("SunsetSky", TX + "sunset_sky.png", emit=1.4)
skyo = planeuv("Glow_Window", 1.9, 1.75, (WX + 0.2, S + T + 0.3, 1.4), (math.pi / 2, 0, 0), sky, c="Shell")
skyo.visible_shadow = False  # the sun and the window glow shine through it
# curtain rod and two curtains with soft folds
metal = mat("DarkMetal", "#2B2A30", rough=0.35, metal=0.9)
cyl("CurtainRod", 0.012, WW + 0.5, (WX, S - 0.08, WZ1 + 0.14), metal, rot=(0, math.pi / 2, 0), c="Shell")
cloth = mat("CurtainCloth", "#D9A35A", rough=0.85, sheen=0.6)
def curtain(name, x0, x1, gather):
    bm = bmesh.new(); nx, nz = 48, 24
    vs = [[bm.verts.new((0, 0, 0)) for i in range(nx + 1)] for j in range(nz + 1)]
    for j in range(nz + 1):
        for i in range(nx + 1):
            u, v = i / nx, j / nz  # v=0 top
            g = gather * v * v
            x = x0 + (x1 - x0) * u * (1 - g) + (x1 if gather > 0 and x1 < x0 else x0) * 0
            amp = 0.022 + 0.01 * v
            y = S - 0.08 - math.sin(u * math.pi * 7) * amp
            vs[j][i].co = (x, y, WZ1 + 0.12 - v * (WZ1 + 0.12 - (WZ0 - 0.12)))
    for j in range(nz):
        for i in range(nx): bm.faces.new((vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = mesh_obj(name, bm); finish(o, cloth, c="Shell")
    so = o.modifiers.new("Solid", "SOLIDIFY"); so.thickness = 0.008
    return o
curtain("CurtainL", WX - WW / 2 - 0.22, WX - WW / 2 + 0.05, 0.2)
curtain("CurtainR", WX + WW / 2 + 0.22, WX + WW / 2 - 0.05, 0.2)
# turn the window set onto the left wall
rig = D.objects.new("WindowRig", None); bpy.context.scene.collection.objects.link(rig)
parts = [D.objects[n] for n in ("HoleCutter", "WindowGlass", "WinFrameTop", "WinFrameBot", "WinFrameL", "WinFrameR", "WinMullion",
                               "WinTransom", "Sill", "Glow_Window", "CurtainRod", "CurtainL", "CurtainR")]
for o in parts: o.parent = rig
rig.rotation_euler = (0, 0, math.pi / 2)
bpy.context.view_layer.update()
for o in parts:
    mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
D.objects.remove(rig, do_unlink=True)
# rug
rugm = imgmat("Rug", TX + "rug.png", rough=1.0); bsdf_of(rugm).inputs["Sheen Weight"].default_value = 0.8
r = planeuv("Rug", 2.1, 1.45, (-0.1, -0.2, 0.002), (0, 0, math.pi / 2), rugm, c="Shell", segs=8)
so = r.modifiers.new("Solid", "SOLIDIFY"); so.thickness = 0.012; so.offset = 1
bv = r.modifiers.new("Bevel", "BEVEL"); bv.width = 0.005; bv.segments = 2
# posters on the left wall (normal +x) and one on the right wall (normal -y)
L = (math.pi / 2, 0, math.pi / 2); R = (math.pi / 2, 0, 0)
tape = mat("Tape", (0.93, 0.9, 0.78, 1), rough=0.4)
def poster(name, img, w, loc, rot, tilt):
    ar = D.images.load(TX + img + ".png", check_existing=True).size; ar = ar[1] / ar[0]
    m = imgmat("Poster_" + name, TX + img + ".png", rough=0.75)
    e = Euler(rot); e.rotate_axis("Z", 0)
    p = planeuv("Poster" + name, w, w * ar, loc, rot, m, c="Shell", curl=0.012, segs=10)
    p.rotation_euler = (Euler(rot).to_matrix() @ Matrix.Rotation(tilt, 3, "Z")).to_euler()
    for k, (tx, ty) in enumerate([(-0.5, 0.5), (0.5, 0.5)]):
        t = box(f"Tape{name}{k}", (0.07, 0.025, 0.0015), (0, 0, 0), tape, bevel=0, c="Shell")
        t.parent = p; t.location = (tx * w * 0.9, ty * w * ar - 0.005, 0.002); t.rotation_euler = (0, 0, 0.6 if tx < 0 else -0.6)
    return p
# seven band posters as a teen-wall collage: overlapping, taped, in two clusters on the left wall, one over the shelves
X = -S + 0.004
poster("Korn", "poster_korn", 0.42, (X, -1.5, 1.52), L, 0.035)
poster("Slipknot", "poster_slipknot", 0.34, (X + 0.003, -1.42, 2.0), L, -0.05)
poster("Zeppelin", "poster_led_zeppelin", 0.4, (X, 0.62, 1.82), L, -0.03)
poster("Nirvana", "poster_nirvana", 0.34, (X + 0.003, 1.2, 1.66), L, 0.05)
poster("Sonata", "poster_sonata_arctica", 0.3, (-1.42, S - 0.004, 1.74), R, -0.05)
poster("Ozzy", "poster_ozzy", 0.3, (-0.98, S - 0.007, 1.62), R, 0.06)
poster("Floyd", "poster_pink_floyd", 0.4, (1.45, S - 0.004, 1.62), R, 0.02)
# fairy lights: a sagging wire along the top of both walls with bulbs hanging off it
def sag(a, b, n, drop, droops):
    pts = []
    for i in range(n + 1):
        u = i / n; p = a.lerp(b, u)
        p.z -= drop * abs(math.sin(u * math.pi * droops))
        pts.append(p)
    return pts
A = sag(Vector((-S + 0.03, -1.7, 2.3)), Vector((-S + 0.03, S - 0.03, 2.32)), 120, 0.16, 4)
B = sag(Vector((-S + 0.03, S - 0.03, 2.32)), Vector((-0.05, S - 0.03, 2.36)), 60, 0.12, 2)
wire = A + B[1:]
wm = mat("FairyWire", "#3B5B3A", rough=0.5)
cu = D.curves.new("FairyWire", "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = 0.0025; cu.bevel_resolution = 2
sp = cu.splines.new("POLY"); sp.points.add(len(wire) - 1)
for pt, p in zip(sp.points, wire): pt.co = (*p, 1)
wo = D.objects.new("FairyWire", cu); bpy.context.scene.collection.objects.link(wo); cu.materials.append(wm); put(wo, "Shell")
bulbm = mat("FairyBulb", "#FFD9A0", rough=0.3, emit="#FFB860", strength=28)
bm = bmesh.new()
for k in range(0, len(wire), 5):
    p = wire[k]
    r = bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=0.014)
    bmesh.ops.scale(bm, vec=Vector((1, 1, 1.35)), verts=r["verts"])
    bmesh.ops.translate(bm, vec=p + Vector((0.01 if p.x < -S + 0.1 else 0, -0.01 if p.y > S - 0.1 else 0, -0.022)), verts=r["verts"])
fb = mesh_obj("Glow_Bulbs", bm); finish(fb, bulbm, c="Shell")
print("bulbs", len(fb.data.polygons) // 60)
