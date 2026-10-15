exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
for p in ("DeskTop", "DeskPedestal", "DeskDrawer", "DeskKnob", "DeskLeg", "DeskModesty", "DeskWing", "DeskEdge", "DeskPanel", "DeskBack", "DeskTray", "DeskRunner", "DeskSticker", "DeskChip", "Chair", "Bed", "Shelf", "Amp", "Duvet", "Pillow", "Throw", "Mattress"): kill(p)
S = 1.8
birch = woodmat("Birch", "#E3C9A2", "#D3B387", rough=0.5, scale=3, axis="Y")
pine = woodmat("Pine", "#D9B78C", "#C8A274", rough=0.6, scale=3, axis="X")
knobm = mat("Chrome", "#D8D8DC", rough=0.2, metal=1.0)
C = "Furniture"
# --- a plain 2000s flat-pack corner desk: beech-print melamine, dark brown PVC edge banding, panel sides
for p in ("Desk",): kill("DeskWing"); kill("DeskEdge"); kill("DeskPanel"); kill("DeskBack"); kill("DeskTray"); kill("DeskRunner"); kill("DeskSticker"); kill("DeskChip")
beechA = woodmat("BeechMelamineY", "#D2AE7E", "#C8A273", rough=0.42, scale=9, axis="Y")
beechB = woodmat("BeechMelamineX", "#D2AE7E", "#C8A273", rough=0.42, scale=9, axis="X")
edge = mat("EdgeBanding", "#C9A475", rough=0.4)
DZ, TT = 0.75, 0.028
AX0, AX1, AY0 = -S + 0.01, -1.15, 0.0          # wing A along the left wall
BX1, BY0 = -0.55, 1.15                          # wing B along the right wall
box("DeskWingA", (AX1 - AX0, S - 0.01 - AY0, TT), ((AX0 + AX1) / 2, (AY0 + S - 0.01) / 2, DZ - TT / 2), beechA, bevel=0.002, c=C)
box("DeskWingB", (BX1 - AX1, S - 0.01 - BY0, TT), ((AX1 + BX1) / 2, (BY0 + S - 0.01) / 2, DZ - TT / 2), beechB, bevel=0.002, c=C)
E = 0.003
box("DeskEdgeAFront", (E, BY0 - AY0, TT), (AX1 + E / 2, (AY0 + BY0) / 2, DZ - TT / 2), edge, bevel=0.001, c=C)
box("DeskEdgeAEnd", (AX1 - AX0, E, TT), ((AX0 + AX1) / 2, AY0 - E / 2, DZ - TT / 2), edge, bevel=0.001, c=C)
box("DeskEdgeBFront", (BX1 - AX1 + E, E, TT), ((AX1 + BX1) / 2 + E / 2, BY0 - E / 2, DZ - TT / 2), edge, bevel=0.001, c=C)
box("DeskEdgeBEnd", (E, S - 0.01 - BY0, TT), (BX1 + E / 2, (BY0 + S - 0.01) / 2, DZ - TT / 2), edge, bevel=0.001, c=C)
PT, PH = 0.018, DZ - TT
box("DeskPanelA", (AX1 - AX0 - 0.03, PT, PH), ((AX0 + AX1) / 2 - 0.015, AY0 + 0.03, PH / 2), beechA, bevel=0.002, c=C)
box("DeskPanelB", (PT, S - 0.01 - BY0 - 0.03, PH), (BX1 - 0.03, (BY0 + S) / 2 + 0.01, PH / 2), beechB, bevel=0.002, c=C)
box("DeskPanelCorner", (PT, 0.5, PH), (-1.62, S - 0.27, PH / 2), beechA, bevel=0.002, c=C)
for k, (sz, loc) in enumerate([((PT, S - 0.06 - AY0, 0.36), (AX0 + 0.02, (AY0 + S) / 2, DZ - TT - 0.2)), ((-1.62 - BX1 + 0.0, PT, 0.36), ((-1.62 + BX1) / 2, S - 0.02, DZ - TT - 0.2))]):
    box(f"DeskBack{k}", sz, loc, beechA if k == 0 else beechB, bevel=0.002, c=C)
for o, ax in ((D.objects["DeskPanelA"], "y"), (D.objects["DeskPanelB"], "x")):
    pass
# the pull-out keyboard tray under the inner corner, on cheap grey runners, pulled out
tray = box("DeskTray", (0.62, 0.3, 0.016), (0, 0, 0), beechB, bevel=0.002, c=C)
tray.rotation_euler = (0, 0, math.radians(45)); tray.location = (-1.25, 1.25, 0.655)
box("DeskTrayEdge", (0.62, 0.003, 0.016), (0, -0.1515, 0), edge, bevel=0.001, c=C, parent=tray)
for sx in (-1, 1):
    r = box(f"DeskRunner{sx}", (0.02, 0.5, 0.03), (0, 0, 0), mat("RunnerGrey", "#9C9A96", rough=0.4, metal=0.6), bevel=0.002, c=C)
    r.rotation_euler = (0, 0, math.radians(45))
    r.location = Vector((-1.38, 1.38, 0.69)) + Vector((1, 1, 0)).normalized() * sx * 0.28
# worn bits: a chipped corner on wing A's end, and two stickers on its end panel
box("DeskChip", (0.03, 0.02, 0.012), (AX1 + 0.012, AY0 + 0.006, DZ - 0.006), mat("Chipboard", "#B99A6E", rough=0.95), bevel=0.003, c=C)
for k, (col, y, z, rz) in enumerate([("#F5B53F", 0.0, 0.5, 0.2), ("#B5121B", 0.0, 0.35, -0.3)]):
    st = box(f"DeskSticker{k}", (0.06 if k else 0.05, 0.002, 0.05), (-1.35 - k * 0.15, AY0 + 0.019, z), mat("Sticker_" + col, col, rough=0.35), bevel=0.0, rot=(0, rz, 0), c=C)
# --- office chair, built facing +y at the origin, then turned toward the desk
navy = mat("ChairFabric", "#353273", rough=0.9, sheen=0.7)
blackp = mat("BlackPlastic", "#1E1D24", rough=0.45)
ch = D.objects.new("Chair", None); bpy.context.scene.collection.objects.link(ch); put(ch, C)
for i in range(5):
    a = i / 5 * 2 * math.pi + 0.3
    leg = box(f"ChairLeg{i}", (0.29, 0.04, 0.03), (math.cos(a) * 0.145, math.sin(a) * 0.145, 0.075), blackp, bevel=0.01, rot=(0, -0.12, a), c=C, parent=ch)
    sphere(f"ChairCaster{i}", 0.026, (math.cos(a) * 0.29, math.sin(a) * 0.29, 0.03), blackp, c=C, parent=ch)
cyl("ChairHub", 0.045, 0.06, (0, 0, 0.09), blackp, c=C, parent=ch)
cyl("ChairLift", 0.022, 0.3, (0, 0, 0.26), knobm, c=C, parent=ch)
cyl("ChairLiftSleeve", 0.03, 0.14, (0, 0, 0.17), blackp, c=C, parent=ch)
box("ChairPan", (0.36, 0.36, 0.03), (0, 0, 0.415), blackp, bevel=0.01, c=C, parent=ch)
seat = box("ChairSeat", (0.47, 0.46, 0.075), (0, 0.01, 0.465), navy, bevel=0.025, c=C, parent=ch, segs=4)
box("ChairSpine", (0.06, 0.025, 0.36), (0, -0.25, 0.6), blackp, bevel=0.008, rot=(-0.12, 0, 0), c=C, parent=ch)
box("ChairBack", (0.44, 0.07, 0.48), (0, -0.27, 0.86), navy, bevel=0.03, rot=(-0.14, 0, 0), c=C, parent=ch, segs=4)
for sx in (-1, 1):
    box(f"ChairArmPost{sx}", (0.025, 0.04, 0.2), (sx * 0.25, -0.02, 0.55), blackp, bevel=0.008, c=C, parent=ch)
    box(f"ChairArmPad{sx}", (0.06, 0.26, 0.03), (sx * 0.25, 0.0, 0.66), blackp, bevel=0.012, c=C, parent=ch)
ch.location = (-0.82, 0.78, 0); ch.rotation_euler = (0, 0, math.radians(68))
# --- bed in the window corner
bedwood = woodmat("BedWood", "#EFE6D8", "#E3D6C2", rough=0.55, scale=3)
BX0, BX1, BY0, BY1 = -0.25, S - 0.02, 0.83, S - 0.02
bcx, bcy = (BX0 + BX1) / 2, (BY0 + BY1) / 2
box("BedBase", (BX1 - BX0 - 0.06, BY1 - BY0, 0.2), (bcx - 0.03, bcy, 0.25), bedwood, bevel=0.012, c=C)
for x in (BX0 + 0.05, BX1 - 0.1):
    for y in (BY0 + 0.05, BY1 - 0.05):
        box(f"BedLeg{x:.1f}{y:.1f}", (0.06, 0.06, 0.15), (x, y, 0.075), bedwood, bevel=0.008, c=C)
box("BedHead", (0.05, BY1 - BY0 + 0.02, 0.92), (BX0 + 0.025, bcy, 0.46), bedwood, bevel=0.015, c=C)
box("BedFoot", (0.04, BY1 - BY0 + 0.02, 0.5), (BX1 - 0.02, bcy, 0.25), bedwood, bevel=0.012, c=C)
sheet = mat("Sheet", "#F4F1EC", rough=0.9, sheen=0.5)
box("Mattress", (BX1 - BX0 - 0.12, BY1 - BY0 - 0.04, 0.2), (bcx - 0.01, bcy, 0.45), sheet, bevel=0.04, c=C, segs=4)
# duvet: a grid draped over the mattress, hanging down the room side, folded back at the head
duvm = mat("Duvet", "#E7A3B9", rough=0.95, sheen=0.8)
bm = bmesh.new(); nx, ny = 60, 40
x0, x1 = BX0 + 0.5, BX1 - 0.07
y0, y1 = BY0 - 0.14, BY1 - 0.03
grid = []
import random
random.seed(3)
for j in range(ny + 1):
    row = []
    for i in range(nx + 1):
        u, v = i / nx, j / ny
        x = x0 + (x1 - x0) * u; y = y0 + (y1 - y0) * v
        top = 0.575 + 0.012 * math.sin(u * 9 + v * 4) * math.sin(v * 7)
        edge = BY0 + 0.03
        if y < edge:
            k = (edge - y) / (edge - y0)  # hang down the side
            z = top - 0.04 - k * 0.24; y = edge - 0.035 * math.sin(k * math.pi / 2) - 0.01
        else:
            z = top - 0.03 * math.exp(-((x - 0.95) ** 2 + (y - 1.12) ** 2) / 0.16 ** 2)  # where the sleeping cat lies
        row.append(bm.verts.new((x, y, z)))
    grid.append(row)
for j in range(ny):
    for i in range(nx): bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
for f in bm.faces:
    if f.normal.z < -0.5 or (f.normal.y > 0.5): f.normal_flip()
duv = mesh_obj("Duvet", bm); finish(duv, duvm, c=C)
so = duv.modifiers.new("Solid", "SOLIDIFY"); so.thickness = 0.05; so.offset = 1
subsurf(duv, 1)
box("DuvetFold", (0.22, BY1 - BY0 - 0.02, 0.05), (x0 - 0.08, bcy - 0.03, 0.6), duvm, bevel=0.022, c=C, segs=4)
for k, (px, py, col) in enumerate([(BX0 + 0.25, BY1 - 0.27, "#FBF8F2"), (BX0 + 0.3, BY0 + 0.3, "#F5B53F")]):
    pm = mat(f"Pillow{k}", col, rough=0.95, sheen=0.6)
    p = box(f"Pillow{k}", (0.32, 0.42, 0.13), (px, py, 0.62), pm, bevel=0.05, c=C, segs=4)
    p.rotation_euler = (0.06 * (k * 2 - 1), 0.35, 0.1 * (k * 2 - 1))
navyth = mat("Throw", "#2A2760", rough=0.95, sheen=0.7)
box("ThrowFold", (0.42, BY1 - BY0 - 0.1, 0.035), (BX1 - 0.32, bcy, 0.6), navyth, bevel=0.015, c=C, segs=3)
# --- three plain shelves along the wall above the bed, in the desk's light-brown melamine, on dark brackets
SX0, SX1 = -0.45, 1.15
for k, z in enumerate((1.3, 1.6, 1.9)):
    box(f"Shelf{k}", (SX1 - SX0, 0.22, 0.022), ((SX0 + SX1) / 2, S - 0.11, z), beechB, bevel=0.002, c=C)
    box(f"ShelfEdge{k}", (SX1 - SX0, 0.003, 0.022), ((SX0 + SX1) / 2, S - 0.2215, z), D.materials["EdgeBanding"], bevel=0.001, c=C)
    for x in (SX0 + 0.1, (SX0 + SX1) / 2, SX1 - 0.1):
        box(f"ShelfBracket{k}{x:.1f}", (0.02, 0.16, 0.02), (x, S - 0.09, z - 0.021), D.materials["DarkMetal"], bevel=0.003, c=C)
        box(f"ShelfBracketV{k}{x:.1f}", (0.02, 0.02, 0.12), (x, S - 0.012, z - 0.07), D.materials["DarkMetal"], bevel=0.003, c=C)
# --- a small practice amp (the guitars are in build_guitars.py)
tolex = mat("Tolex", "#1C1B20", rough=0.7)
grille = mat("Grille", "#4A4237", rough=1.0, sheen=0.5)
amp = D.objects.new("Amp", None); bpy.context.scene.collection.objects.link(amp); put(amp, C)
box("AmpBox", (0.38, 0.22, 0.34), (0, 0, 0.17), tolex, bevel=0.018, c=C, parent=amp)
box("AmpGrille", (0.33, 0.006, 0.22), (0, -0.111, 0.13), grille, bevel=0.004, c=C, parent=amp)
box("AmpPanel", (0.34, 0.006, 0.06), (0, -0.111, 0.29), mat("AmpPanel", "#C9B98F", rough=0.4, metal=0.6), bevel=0.003, c=C, parent=amp)
for k in range(5):
    cyl(f"AmpKnob{k}", 0.011, 0.02, (-0.12 + k * 0.05, -0.12, 0.29), blackp, rot=(math.pi / 2, 0, 0), c=C, parent=amp, verts=16)
box("AmpLogo", (0.07, 0.004, 0.02), (0.11, -0.116, 0.215), mat("AmberPlate", "#F5B53F", rough=0.3, metal=0.5), bevel=0.002, c=C, parent=amp)
cyl("AmpHandle", 0.012, 0.16, (0, 0, 0.345), blackp, rot=(0, math.pi / 2, 0), c=C, parent=amp)
amp.location = (-1.6, -0.2, 0); amp.rotation_euler = (0, 0, math.radians(75))
print("ok")
