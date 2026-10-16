"""The old houses' windows across her street, the way they are in Bucharest: a stucco frame standing out of the wall
with the glass set back in it, a double casement under a transom (white or brown), lace curtains, a sill (sometimes
a geranium on it), and slatted shutters folded open. build_city.py builds them through house_window(); run on its
own with REFIT = True, it swaps the old flat windows of House0..3 in the open file for these."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
import random
R2 = random.Random(23)
_trim = mat("StuccoTrim", "#F3E6D6", rough=0.9)
_glass = mat("HouseGlass", "#2E3A4E", rough=0.12)
_lace = [mat(f"Lace{k}", c, rough=1.0) for k, c in enumerate(("#F2ECE0", "#EDE4D3", "#F5F1EA"))]
_shut = [mat(f"Oblon{k}", c, rough=0.85) for k, c in enumerate(("#5E6E4A", "#6E5A3E", "#71858A"))]
_pot, _gera, _leaf = mat("Terracotta", "#B5603E", rough=0.8), mat("Geranium", "#D8343A", rough=0.7), mat("GeraniumLeaf", "#4F6E3A", rough=0.8)
_litm = mat("LitWin", "#FFD49A", emit="#FFD49A", strength=3)

def house_window(name, x, y0, z, w, h, frame, shutters, c="Across"):
    """Facing -y on a wall whose face is at y0, centred at (x, z); the opening is w by h."""
    b = 0.07; ow, oh = w + 0.04, h + 0.04; sw = 0.16                       # casement bar, opening, frame band
    # the stucco frame: four bands standing 14 cm out of the wall, so the glass sits back in it
    for k, (s, l) in enumerate([((ow + 2 * sw, 0.14, sw), (x, y0 - 0.07, z + oh / 2 + sw / 2)),
                                ((ow + 2 * sw, 0.14, sw), (x, y0 - 0.07, z - oh / 2 - sw / 2)),
                                ((sw, 0.14, oh), (x - ow / 2 - sw / 2, y0 - 0.07, z)), ((sw, 0.14, oh), (x + ow / 2 + sw / 2, y0 - 0.07, z))]):
        box(f"{name}Surr{k}", s, l, _trim, bevel=0.02, c=c)
    box(name + "Sill", (ow + 2 * sw + 0.14, 0.26, 0.07), (x, y0 - 0.14, z - oh / 2 - sw - 0.02), _trim, bevel=0.015, c=c)
    box(name + "G", (ow, 0.02, oh), (x, y0 - 0.01, z), _glass, bevel=0, c=c)
    box(name + "L", (w * 0.92, 0.01, h * 0.92), (x, y0 - 0.025, z), _litm, bevel=0, c="LitWindows")   # the site lights it at night
    # lace behind the glass: drawn to the sides, or a café curtain on the lower casements
    lace = R2.choice(_lace); kind = R2.random()
    if kind < 0.45:
        for sx in (-1, 1):
            cw = w * R2.uniform(0.22, 0.34)
            box(f"{name}C{sx}", (cw, 0.01, h * 0.9), (x + sx * (w / 2 - cw / 2), y0 - 0.035, z - h * 0.03), lace, bevel=0, c=c)
    elif kind < 0.8:
        box(name + "C", (w * 0.96, 0.01, h * 0.42), (x, y0 - 0.035, z - h * 0.24), lace, bevel=0, c=c)
    # the casement: frame, transom across the top third, the two leaves below with a glazing bar each
    ty = y0 - 0.06; zt = z + h / 2 - h * 0.3
    for k, (s, l) in enumerate([((w + b, 0.06, b), (x, ty, z + h / 2)), ((w + b, 0.06, b), (x, ty, z - h / 2)),
                                ((b, 0.06, h), (x - w / 2, ty, z)), ((b, 0.06, h), (x + w / 2, ty, z)),
                                ((w, 0.06, b * 0.8), (x, ty, zt)), ((b * 0.9, 0.06, zt - (z - h / 2)), (x, ty, (zt + z - h / 2) / 2)),
                                ((w, 0.05, 0.035), (x, ty + 0.005, (zt + z - h / 2) / 2)), ((0.035, 0.05, h * 0.3), (x, ty + 0.005, (zt + z + h / 2) / 2))]):
        box(f"{name}F{k}", s, l, frame, bevel=0.006, c=c)
    if R2.random() < 0.3:   # a geranium on the sill
        px = x + R2.uniform(-0.25, 0.25) * w; pz = z - oh / 2 - sw + 0.03
        cyl(name + "Pot", 0.09, 0.16, (px, y0 - 0.17, pz + 0.08), _pot, verts=12, r2=0.11, c=c)
        for j in range(5):
            sphere(f"{name}Ger{j}", R2.uniform(0.06, 0.09), (px + R2.uniform(-0.12, 0.12), y0 - 0.17 + R2.uniform(-0.05, 0.05), pz + 0.2 + R2.uniform(0, 0.1)),
                   _gera if j % 2 else _leaf, c=c, seg=8, ring=5)
    if shutters:   # obloane: slatted, folded open flat against the wall either side
        m = R2.choice(_shut); pw = 0.56; ph = oh + 0.06
        for sx in (-1, 1):
            px = x + sx * (ow / 2 + sw + pw / 2 + 0.02)
            box(f"{name}Shut{sx}", (pw, 0.03, ph), (px, y0 - 0.03, z), m, bevel=0.006, c=c)
            for k, (s, l) in enumerate([((pw, 0.05, 0.06), (px, y0 - 0.05, z + ph / 2 - 0.03)), ((pw, 0.05, 0.06), (px, y0 - 0.05, z - ph / 2 + 0.03)),
                                        ((0.06, 0.05, ph), (px - pw / 2 + 0.03, y0 - 0.05, z)), ((0.06, 0.05, ph), (px + pw / 2 - 0.03, y0 - 0.05, z)),
                                        ((pw, 0.05, 0.05), (px, y0 - 0.05, z))]):
                box(f"{name}Shut{sx}F{k}", s, l, m, bevel=0.006, c=c)
            n = 14
            for k in range(n):   # the slats, tilted
                zz = z - ph / 2 + 0.08 + (ph - 0.16) * (k + 0.5) / n
                if abs(zz - z) < 0.04: continue
                box(f"{name}Shut{sx}S{k}", (pw - 0.1, 0.012, 0.075), (px, y0 - 0.045, zz), m, bevel=0, rot=(math.radians(-35), 0, 0), c=c)

if globals().get("REFIT"):
    for hn in ("House0", "House1", "House2", "House3"):
        for s in sorted([o for o in D.objects if o.name.startswith(hn + "Surr")], key=lambda o: o.name):
            tag = s.name[len(hn) + 4:]                                    # "{floor}_{i}"
            x, y0, z = s.location.x, s.location.y + 0.03, s.location.z
            old = D.objects.get(f"{hn}W{tag}F0"); frame = old.data.materials[0] if old else _trim
            shut = D.objects.get(f"{hn}Shut{tag}-1") is not None
            for o in [o for o in D.objects if o.name.startswith((f"{hn}W{tag}", f"{hn}Shut{tag}"))] + [s]:
                D.objects.remove(o, do_unlink=True)
            house_window(f"{hn}W{tag}", x, y0, z, 1.1, 1.7, frame, shut)
    print("house windows refitted")
