"""Across her street: old houses (one with the NON STOP), a 1970s bloc (P+8) with its balconies, autumn plane trees,
parked cars, a kiosk. Her street from the parter: old houses behind fences across the road, a bloc up the street.
Night-lit windows go in LitWindows (live on the site, not baked)."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
import random
R = random.Random(11)
STREET = -1.3
for c in ("Across", "Trees", "LitWindows", "Cars", "Far"):
    for o in list(coll(c).objects): D.objects.remove(o, do_unlink=True)
def jitter(hexs, amt=0.05):
    c = hexc(hexs); return tuple(max(0, min(1, v * (1 + R.uniform(-amt, amt)))) for v in c[:3]) + (1,)

# ---------- shared materials ----------
glassW = mat("WinGlass", "#3A4458", rough=0.2)
frames = [mat("FrameWhite", "#EDEBE6", rough=0.4), mat("FrameBrown", "#5A4032", rough=0.5), mat("FrameWood", "#8A6A4A", rough=0.6)]
curtains = [mat(f"Curtain{k}", c, rough=0.9) for k, c in enumerate(("#E8DCC8", "#D9C7B8", "#C9B6A0", "#E6E0D6", "#BFA79A", "#D8CDBE"))]
panel = mat("Panel", "#CDC4B4", rough=0.95, bump=0.25)
panel2 = mat("Panel2", "#BDB4A4", rough=0.95, bump=0.25)
joint = mat("Joint", "#8C8578", rough=1.0)
balc_cols = [mat(f"BalcPaint{k}", c, rough=0.9, bump=0.2) for k, c in enumerate(("#D7A47E", "#9FB59A", "#C9C2B2", "#A9B9C9", "#D9C27A", "#C99A8E"))]
rail = mat("RailIron", "#2E3033", rough=0.5, metal=0.7)
acm = mat("ACUnit", "#E4E2DC", rough=0.5)
dish = mat("Dish", "#C8CACC", rough=0.4, metal=0.3)
laundry = [mat(f"Laundry{k}", c, rough=1.0) for k, c in enumerate(("#E25D5D", "#F2F0EA", "#5D7FE2", "#F2C14E", "#9A6FD1"))]
pot = mat("Terracotta", "#B5603E", rough=0.8)
greens = [mat(f"BalcPlant{k}", c, rough=0.8) for k, c in enumerate(("#4F6E3A", "#6C8A44", "#3F5A35"))]

def lit_window(name, size, loc):
    """A plane just inside the glass that the site switches on at night (emissive, warm, random)."""
    o = box(name, (size[0] * 0.92, 0.01, size[1] * 0.92), loc, mat("LitWin", "#FFD49A", emit="#FFD49A", strength=3), bevel=0, c="LitWindows")
    return o

def window(name, x, y, z, w, h, frame, c="Across", sash=True, curtain=True, lit=True, depth=0.18):
    """A punched window facing -y: dark glass set back, frame, a mullion, a curtain behind."""
    box(name + "G", (w, 0.02, h), (x, y + depth, z), glassW, bevel=0, c=c)
    t = 0.07
    for k, (s, l) in enumerate([((w + t, 0.06, t), (x, y + depth - 0.03, z + h / 2)), ((w + t, 0.06, t), (x, y + depth - 0.03, z - h / 2)),
                                ((t, 0.06, h), (x - w / 2, y + depth - 0.03, z)), ((t, 0.06, h), (x + w / 2, y + depth - 0.03, z))]):
        box(f"{name}F{k}", s, l, frame, bevel=0.008, c=c)
    if sash: box(name + "M", (0.06, 0.05, h), (x + R.choice((-0.15, 0, 0.15)) * w, y + depth - 0.03, z), frame, bevel=0.006, c=c)
    if curtain and R.random() < 0.8:
        cw = w * R.uniform(0.35, 1.0)
        box(name + "C", (cw, 0.01, h * 0.95), (x + R.uniform(-1, 1) * (w - cw) / 2, y + depth + 0.06, z), R.choice(curtains), bevel=0, c=c)
    if lit: lit_window(name + "L", (w, h), (x, y + depth + 0.04, z))

# ---------- Bloc A: P+10, prefab panels, balconies every other bay ----------
def bloc(x0, x1, y0, floors=10, fh=2.75, ground=4.2, bay=3.6):
    depth = 12.0
    H = ground + floors * fh
    box("BlocA_Body", (x1 - x0, depth, H), ((x0 + x1) / 2, y0 + depth / 2, STREET + H / 2), panel, bevel=0, c="Across")
    box("BlocA_Roof", (x1 - x0 + 0.3, depth + 0.3, 0.35), ((x0 + x1) / 2, y0 + depth / 2, STREET + H + 0.17), panel2, bevel=0.02, c="Across")
    # parapet + roof clutter: water tanks, antennas, the lift housing
    box("BlocA_Lift", (3.4, 3.0, 2.6), (x0 + 12.0, y0 + 5, STREET + H + 1.3), panel2, bevel=0.05, c="Across")
    for k in range(5):
        xa = x0 + 3 + k * 7.5 + R.uniform(-1, 1)
        cyl(f"BlocA_Ant{k}", 0.025, R.uniform(1.5, 3.2), (xa, y0 + R.uniform(1, 4), STREET + H + 1.2), rail, verts=6, bevel=0, c="Across")
        box(f"BlocA_AntX{k}", (1.0, 0.03, 0.03), (xa, y0 + 2, STREET + H + 2.2), rail, bevel=0, c="Across")
    # ground floor: shop fronts with signs and a canopy
    nb = int((x1 - x0) // bay)
    bw = (x1 - x0) / nb
    box("BlocA_Canopy", (x1 - x0, 1.6, 0.18), ((x0 + x1) / 2, y0 - 0.8, STREET + ground - 0.4), panel2, bevel=0.02, c="Across")
    signs = [("#2E7D4F", "FARMACIE"), ("#C8463B", "PÂINE"), ("#2F5DA8", "PAPETĂRIE"), ("#7A4CA0", "FLORI"), ("#D98B2B", "CAFEA")]
    for i in range(nb):
        xc = x0 + (i + 0.5) * bw
        box(f"BlocA_Shop{i}", (bw - 0.4, 0.05, 2.6), (xc, y0 - 0.02, STREET + 1.5), glassW, bevel=0, c="Across")
        if i % 2 == 0:
            col, _ = signs[(i // 2) % len(signs)]
            box(f"BlocA_Sign{i}", (bw * 0.7, 0.12, 0.55), (xc, y0 - 1.62, STREET + ground - 0.4), mat(f"Sign{col}", col, rough=0.5, emit=col, strength=0.0), bevel=0.02, c="Across")
    # floors
    for f in range(floors):
        z0 = STREET + ground + f * fh
        box(f"BlocA_J{f}", (x1 - x0 + 0.02, 0.04, 0.05), ((x0 + x1) / 2, y0 - 0.02, z0), joint, bevel=0, c="Across")  # panel joint
        for i in range(nb):
            xc = x0 + (i + 0.5) * bw
            name = f"BlocA_{f}_{i}"
            if i % 2 == 1:   # a balcony bay
                closed = R.random() < 0.55
                paint = R.choice(balc_cols)
                box(name + "Slab", (bw - 0.3, 1.25, 0.16), (xc, y0 - 0.62, z0 + 0.08), panel2, bevel=0.015, c="Across")
                box(name + "Para", (bw - 0.3, 0.1, 1.0), (xc, y0 - 1.2, z0 + 0.66), paint, bevel=0.015, c="Across")
                for sx in (-1, 1):
                    box(f"{name}Side{sx}", (0.1, 1.2, 1.0), (xc + sx * (bw - 0.4) / 2, y0 - 0.62, z0 + 0.66), paint, bevel=0.01, c="Across")
                window(name + "Door", xc, y0, z0 + 1.35, 1.9, 2.1, R.choice(frames[:2]), depth=0.05)
                if closed:   # closed in by the owner: a row of mismatched frames on the parapet
                    fr = R.choice(frames)
                    n = R.choice((3, 4))
                    for j in range(n):
                        wx = xc - (bw - 0.4) / 2 + (j + 0.5) * (bw - 0.4) / n
                        window(f"{name}Enc{j}", wx, y0 - 1.25, z0 + 1.75, (bw - 0.4) / n - 0.06, 1.25, fr, sash=False, curtain=R.random() < 0.5, lit=False, depth=0.0)
                    box(name + "EncTop", (bw - 0.3, 1.25, 0.08), (xc, y0 - 0.62, z0 + 2.44), fr, bevel=0.01, c="Across")
                else:
                    r = R.random()
                    if r < 0.35:   # laundry on a line
                        for j in range(R.randint(2, 4)):
                            box(f"{name}Wash{j}", (R.uniform(0.3, 0.6), 0.02, R.uniform(0.4, 0.7)), (xc - 0.9 + j * 0.6, y0 - 0.9, z0 + 1.65), R.choice(laundry), bevel=0, c="Across")
                    elif r < 0.7:  # pots
                        for j in range(R.randint(2, 4)):
                            px = xc - 1 + j * 0.55
                            cyl(f"{name}Pot{j}", 0.13, 0.22, (px, y0 - 1.15, z0 + 1.27), pot, verts=12, bevel=0.01, c="Across", r2=0.1)
                            sphere(f"{name}Leaf{j}", 0.24, (px, y0 - 1.15, z0 + 1.55), R.choice(greens), c="Across", seg=10, ring=6, scale=(1, 1, 0.8))
            else:            # a window bay, sometimes with an AC unit and a dish
                window(name, xc, y0, z0 + 1.45, 1.5, 1.45, R.choice(frames))
                if R.random() < 0.4:
                    box(name + "AC", (0.8, 0.3, 0.55), (xc + R.uniform(-0.4, 0.4), y0 - 0.2, z0 + 0.45), acm, bevel=0.03, c="Across")
                if R.random() < 0.18:
                    d = cyl(name + "Dish", 0.4, 0.06, (xc + 1.0, y0 - 0.5, z0 + 1.9), dish, verts=20, bevel=0.01, rot=(math.radians(70), 0, math.radians(R.uniform(-30, 30))), c="Across", r2=0.3)
# ---------- across the street: old houses behind fences (case vechi), one with the NON STOP ----------
roof_tiles = [mat(f"Tiles{k}", c, rough=0.8, bump=0.35) for k, c in enumerate(("#9C4A33", "#874232", "#A85A3C"))]
stuccos = ["#E8B79A", "#E9D8A6", "#C9D3C0", "#E6C7C9", "#D9CDBE"]
trim = mat("StuccoTrim", "#F3E6D6", rough=0.9)
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/window/house_window.py").read())   # house_window()
fence_cols = [mat(f"Fence{k}", c, rough=0.6, metal=0.3) for k, c in enumerate(("#2F5E4A", "#33465E", "#5E3A2F", "#3A3A3A"))]
def gable_roof(name, x0, x1, y0, y1, z, rise, m):
    bm = bmesh.new()
    ym = (y0 + y1) / 2
    v = [bm.verts.new(p) for p in [(x0 - 0.4, y0 - 0.5, z), (x1 + 0.4, y0 - 0.5, z), (x1 + 0.4, ym, z + rise), (x0 - 0.4, ym, z + rise),
                                    (x0 - 0.4, y1 + 0.5, z), (x1 + 0.4, y1 + 0.5, z)]]
    bm.faces.new([v[0], v[1], v[2], v[3]]); bm.faces.new([v[3], v[2], v[5], v[4]])
    o = mesh_obj(name, bm); finish(o, m, c="Across", smooth=False)
    s = o.modifiers.new("Solid", "SOLIDIFY"); s.thickness = 0.12
    # gable ends
    for k, x in enumerate((x0, x1)):
        bm = bmesh.new(); g = [bm.verts.new(p) for p in [(x, y0, z), (x, y1, z), (x, ym, z + rise)]]; bm.faces.new(g)
        finish(mesh_obj(f"{name}Gable{k}", bm), mat(f"{name}GableM", "#D9C7B0", rough=0.95), c="Across", smooth=False)
    return o
def house(name, x0, x1, y0, depth=10.0, floors=1, col="#E8B79A", shop=False):
    st = mat(f"Stucco{col}", col, rough=0.95, bump=0.15)
    fh, base = 3.4, 0.6
    H = base + floors * fh
    box(name + "Body", (x1 - x0, depth, H), ((x0 + x1) / 2, y0 + depth / 2, STREET + H / 2), st, bevel=0, c="Across")
    box(name + "Plinth", (x1 - x0 + 0.06, 0.08, base + 0.2), ((x0 + x1) / 2, y0 - 0.03, STREET + (base + 0.2) / 2), mat("Plinth", "#8E8578", rough=1.0, bump=0.4), bevel=0.01, c="Across")
    box(name + "Cornice", (x1 - x0 + 0.3, 0.45, 0.3), ((x0 + x1) / 2, y0 - 0.1, STREET + H - 0.1), trim, bevel=0.04, c="Across")
    gable_roof(name + "Roof", x0, x1, y0, y0 + depth, STREET + H, 3.0 if floors == 1 else 3.6, R.choice(roof_tiles))
    n = max(2, int((x1 - x0) // 2.6))
    for f in range(floors):
        for i in range(n):
            xc = x0 + (i + 0.5) * (x1 - x0) / n
            z = STREET + base + f * fh + 1.85
            if shop and f == 0 and i < 2:
                continue
            fr = R.choice(frames[1:]) if R.random() < 0.7 else frames[0]
            R.choice((-0.15, 0, 0.15)); R.random() < 0.8 and (R.uniform(0, 1), R.uniform(0, 1))   # the old window's draws: the rest of the street stays put
            box(f"{name}Head{f}_{i}", (1.7, 0.2, 0.25), (xc, y0 - 0.1, z + 1.1), trim, bevel=0.03, c="Across")
            house_window(f"{name}W{f}_{i}", xc, y0, z, 1.1, 1.7, fr, R.random() < 0.5)
    if shop:   # the NON STOP: the front two bays opened into a shop window, a sign box and a striped awning
        sx0 = x0 + 0.3; sw = 2 * (x1 - x0) / n - 0.6
        box(name + "ShopGlass", (sw, 0.05, 2.4), (sx0 + sw / 2, y0 - 0.02, STREET + base + 1.3), glassW, bevel=0, c="Across")
        box(name + "ShopLit", (sw - 0.1, 0.05, 2.3), (sx0 + sw / 2, y0 + 0.08, STREET + base + 1.3), mat("ShopLit", "#FFE7B8", emit="#FFE7B8", strength=1.5), bevel=0, c="LitWindows")
        box(name + "SignBox", (sw, 0.18, 0.6), (sx0 + sw / 2, y0 - 0.12, STREET + base + 2.95), mat("SignDark", "#1E2226", rough=0.5), bevel=0.03, c="Across")
        empty("NonStopSign", (sx0 + sw / 2, y0 - 0.23, STREET + base + 2.95), c="Across", size=0.5)
        box(name + "Awning", (sw + 0.4, 1.2, 0.08), (sx0 + sw / 2, y0 - 0.6, STREET + base + 2.5), mat("Awning", "#2F6E4E", rough=0.8), bevel=0.02, rot=(math.radians(-14), 0, 0), c="Across")
def fence(name, x0, x1, y, gate_at=None):
    m = R.choice(fence_cols)
    box(name + "Wall", (x1 - x0, 0.25, 0.6), ((x0 + x1) / 2, y, STREET + 0.47), mat("FenceBase", "#B8AFA2", rough=1.0, bump=0.3), bevel=0.02, c="Across")
    box(name + "Rail", (x1 - x0, 0.05, 0.05), ((x0 + x1) / 2, y, STREET + 1.85), m, bevel=0, c="Across")
    box(name + "Rail2", (x1 - x0, 0.05, 0.05), ((x0 + x1) / 2, y, STREET + 1.0), m, bevel=0, c="Across")
    x = x0
    while x < x1:
        box(f"{name}Bar{int(x * 10)}", (0.035, 0.035, 1.25), (x, y, STREET + 1.35), m, bevel=0, c="Across")
        x += 0.16
    for k, xp in enumerate((x0, x1)):
        box(f"{name}Post{k}", (0.35, 0.35, 2.1), (xp, y, STREET + 1.05), mat("FenceBase", "#B8AFA2"), bevel=0.02, c="Across")
HOUSES = [(-44.0, -32.0, 1, "#E9D8A6"), (-29.0, -19.0, 2, "#C9D3C0"), (-15.5, -4.0, 1, "#E8B79A"), (-1.0, 9.0, 1, "#E6C7C9")]
for k, (a, b, fl, col) in enumerate(HOUSES):
    house(f"House{k}", a, b, 20.0 + R.uniform(-0.5, 1.5), floors=fl, col=col, shop=(k == 2))
for k, (a, b) in enumerate([(-46.0, -30.0), (-30.0, -17.0), (-17.0, -2.0), (-2.0, 11.0)]):
    fence(f"Fence{k}", a, b, 16.2)

# ---------- a bloc up the street on the right, P+8, end-on with its balconies to the street ----------
bloc(16.0, 54.0, 24.0, floors=8)

# ---------- trees: plane trees in October, half turned ----------
bark = mat("PlaneBark", "#8C8474", rough=0.9, bump=0.3)
leafs = [mat(f"PlaneLeaf{k}", c, rough=0.85, bump=0.4) for k, c in enumerate(("#C98A2E", "#D9A441", "#9A8A3A", "#6E7A3A", "#B5652A", "#E0B45A"))]
def tree(name, x, y, h, r=2.6):
    base = Vector((x, y, STREET))
    tube(name + "Trunk", [base, base + Vector((0.2, 0.1, h * 0.35)), base + Vector((-0.1, 0.0, h * 0.55))], 0.24, bark, c="Trees")
    for j in range(4):   # main limbs
        a = j * math.pi / 2 + R.uniform(-0.4, 0.4)
        tube(f"{name}Limb{j}", [base + Vector((-0.1, 0, h * 0.5)), base + Vector((math.cos(a) * 1.0, math.sin(a) * 1.0, h * 0.68)), base + Vector((math.cos(a) * 1.8, math.sin(a) * 1.8, h * 0.82))], 0.09, bark, c="Trees")
    for j in range(14):
        a = R.uniform(0, math.tau); d = R.uniform(0.3, r * 0.75)
        s = R.uniform(1.0, 1.7)
        o = sphere(f"{name}Leaf{j}", s, (x + math.cos(a) * d, y + math.sin(a) * d * 0.8, STREET + h * R.uniform(0.66, 0.95)), R.choice(leafs), c="Trees", seg=14, ring=8, scale=(1, 1, 0.8))
        dm = o.modifiers.new("Lumps", "DISPLACE")
        tx = D.textures.get("LeafLumps") or D.textures.new("LeafLumps", "CLOUDS"); tx.noise_scale = 0.45
        dm.texture = tx; dm.strength = 0.55; dm.mid_level = 0.5
for k, x in enumerate((-14.0, 11.0)): tree(f"TreeN{k}", x, 2.7, 9.5 + R.uniform(-0.4, 0.6), 3.0)   # in her pavement: big trunks at the edges of the view
for k, x in enumerate((-31.0, -17.5, -2.5, 12.5)): tree(f"TreeF{k}", x, 18.2, 8.5 + R.uniform(-0.6, 0.8))   # in the yards behind the fences

# ---------- parked cars along the far kerb, a kiosk, a bus shelter ----------
carcols = ["#E9E4D8", "#B23A32", "#2E4E7A", "#5A6B4E", "#D9B45A", "#8A8E93"]
def car(name, x, y, col):
    body = mat(f"CarPaint{col}", col, rough=0.3, coat=0.8)
    box(name + "Body", (4.1, 1.65, 0.7), (x, y, STREET + 0.62), body, bevel=0.12, c="Cars")
    box(name + "Cab", (2.2, 1.5, 0.6), (x - 0.15, y, STREET + 1.2), body, bevel=0.1, c="Cars")
    box(name + "Glass", (2.15, 1.52, 0.42), (x - 0.15, y, STREET + 1.22), glassW, bevel=0.08, c="Cars")
    for sx in (-1.35, 1.35):
        for sy in (-0.78, 0.78):
            cyl(f"{name}Wh{sx}{sy}", 0.3, 0.2, (x + sx, y + sy, STREET + 0.3), mat("Tyre", "#1C1C1E", rough=0.8), verts=16, bevel=0.03, rot=(math.pi / 2, 0, 0), c="Cars")
for k, x in enumerate((-26.0, -19.5, -9.0, 4.5, 11.0, 20.0)):
    car(f"Car{k}", x, 10.2, carcols[k % len(carcols)])   # parked along the far kerb
kiosk = mat("Kiosk", "#3C6E8F", rough=0.6)
box("Kiosk", (2.6, 2.0, 2.5), (-34.0, 13.2, STREET + 1.25), kiosk, bevel=0.06, c="Across")
box("KioskRoof", (3.0, 2.4, 0.2), (-34.0, 13.2, STREET + 2.6), mat("KioskRoof", "#E8E1D2", rough=0.6), bevel=0.04, c="Across")
box("KioskWin", (2.2, 0.05, 1.0), (-34.0, 12.18, STREET + 1.6), mat("KioskLit", "#FFE2A6", emit="#FFE2A6", strength=0.0), bevel=0, c="Across")
# ---------- the far city: silhouettes the site fogs into the sky (geometry only) ----------
far = mat("Far", "#9AA0B5", rough=1.0)
for k in range(34):   # blocs further off, over the roofs
    x = -220 + k * 13 + R.uniform(-5, 5); y = R.uniform(90, 220); h = R.uniform(18, 45); w = R.uniform(10, 28)
    box(f"Far{k}", (w, 10, h), (x, y, STREET + h / 2), far, bevel=0, c="Far")
print("city", len(D.objects))
