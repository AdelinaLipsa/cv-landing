"""Generates the room's painted textures (posters, cork board, sky, rug, covers) into art/textures/."""
import math, random, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

OUT = os.path.join(os.path.dirname(__file__), "..", "textures")
SUP = "/System/Library/Fonts/Supplemental/"
F = lambda name, size, idx=0: ImageFont.truetype(SUP + name, size, index=idx)
NAVY, AMBER, PINK = (42, 39, 96), (245, 181, 63), (238, 110, 159)
random.seed(7)

def grain(img, amt=18):
    n = Image.effect_noise(img.size, amt).convert("L")
    n = Image.merge("RGB", (n, n, n))
    return ImageChops.blend(img, ImageChops.multiply(img, n.point(lambda v: 150 + v // 2.6)), 0.45)

def age(img):
    w, h = img.size
    v = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(v)
    for i in range(40):  # vignette of yellowed edges
        d.rectangle([i * w // 160, i * h // 160, w - i * w // 160, h - i * h // 160], outline=int(255 * i / 40))
    v = v.filter(ImageFilter.GaussianBlur(w // 30))
    tint = Image.new("RGB", (w, h), (196, 170, 120))
    img = Image.composite(img, ImageChops.multiply(img, tint), v)
    # a fold line and a crease
    d = ImageDraw.Draw(img)
    d.line([(0, h // 2), (w, h // 2 + 6)], fill=tuple(int(c * 0.9) for c in (230, 220, 200)), width=2)
    return grain(img)

def centered(d, y, text, font, fill, w):
    tw = d.textlength(text, font=font)
    d.text(((w - tw) / 2, y), text, font=font, fill=fill)

def bolt(d, cx, cy, s, fill):
    pts = [(0, -1), (0.45, -1), (0.12, -0.15), (0.5, -0.15), (-0.2, 1), (0.02, 0.1), (-0.4, 0.1)]
    d.polygon([(cx + x * s, cy + y * s) for x, y in pts], fill=fill)

def guitar(d, cx, cy, s, fill):
    d.ellipse([cx - 0.55 * s, cy + 0.05 * s, cx + 0.55 * s, cy + 1.0 * s], fill=fill)
    d.ellipse([cx - 0.42 * s, cy - 0.4 * s, cx + 0.42 * s, cy + 0.35 * s], fill=fill)
    d.rectangle([cx - 0.06 * s, cy - 1.6 * s, cx + 0.06 * s, cy], fill=fill)
    d.rectangle([cx - 0.11 * s, cy - 1.85 * s, cx + 0.11 * s, cy - 1.55 * s], fill=fill)

CITIES = ["BUCURESTI", "CLUJ", "IASI", "TIMISOARA", "BRASOV", "SIBIU", "CONSTANTA"]

def poster_volt():
    w, h = 600, 840
    im = Image.new("RGB", (w, h), (240, 228, 205)); d = ImageDraw.Draw(im)
    for r in range(900, 0, -60):  # sunburst
        d.ellipse([w / 2 - r, 330 - r, w / 2 + r, 330 + r], fill=AMBER if (r // 60) % 2 else (236, 150, 50))
    bolt(d, w / 2, 330, 190, NAVY)
    d.rectangle([0, 560, w, h], fill=NAVY)
    centered(d, 30, "VOLTAGE KIDS", F("Impact.ttf", 96), NAVY, w)
    centered(d, 580, "LIVE  ·  SUMMER TOUR 2004", F("Futura.ttc", 34, 2), AMBER, w)
    y = 640
    for c, dt in zip(CITIES[:5], ["12.07", "14.07", "18.07", "21.07", "25.07"]):
        centered(d, y, f"{dt}   {c}", F("Futura.ttc", 26), (240, 228, 205), w); y += 36
    return age(im)

def poster_hearts():
    w, h = 600, 840
    im = Image.new("RGB", (w, h), (24, 22, 40)); d = ImageDraw.Draw(im)
    for i in range(0, h, 6):  # halftone-ish dots
        for j in range(0, w, 6):
            r = 2.6 * (1 - abs(i - 420) / 420)
            if r > 0.4: d.ellipse([j - r, i - r, j + r, i + r], fill=(70, 40, 90))
    guitar(d, w / 2, 400, 150, PINK)
    for k in range(5):
        d.line([(w / 2 - 6 + 3 * k, 160), (w / 2 - 6 + 3 * k, 520)], fill=(30, 30, 50), width=1)
    centered(d, 40, "THE STATIC", F("Rockwell.ttc", 76, 1), (245, 236, 220), w)
    centered(d, 120, "HEARTS", F("Rockwell.ttc", 92, 1), PINK, w)
    centered(d, 640, "NO SLEEP TILL SUNDAY", F("Futura.ttc", 30, 2), AMBER, w)
    centered(d, 690, "+ special guests  ·  doors 20:00", F("AmericanTypewriter.ttc", 26), (220, 210, 200), w)
    centered(d, 740, "CLUB SUBSOL  ·  SAT 09.10", F("Futura.ttc", 28), (245, 236, 220), w)
    return age(im)

def poster_moth():
    w, h = 600, 840
    im = Image.new("RGB", (w, h), PINK); d = ImageDraw.Draw(im)
    for i in range(14):  # stacked stripes
        d.rectangle([0, 470 + i * 26, w, 470 + i * 26 + 12], fill=(220, 80, 135))
    cx, cy = w / 2, 330  # a moth made of triangles
    d.polygon([(cx, cy), (cx - 230, cy - 150), (cx - 170, cy + 60)], fill=NAVY)
    d.polygon([(cx, cy), (cx + 230, cy - 150), (cx + 170, cy + 60)], fill=NAVY)
    d.polygon([(cx, cy + 10), (cx - 130, cy + 170), (cx - 30, cy + 60)], fill=(30, 28, 70))
    d.polygon([(cx, cy + 10), (cx + 130, cy + 170), (cx + 30, cy + 60)], fill=(30, 28, 70))
    d.ellipse([cx - 120, cy - 70, cx - 60, cy - 10], fill=AMBER); d.ellipse([cx + 60, cy - 70, cx + 120, cy - 10], fill=AMBER)
    d.rectangle([cx - 10, cy - 60, cx + 10, cy + 140], fill=(20, 18, 50))
    centered(d, 40, "NEON MOTH", F("Phosphate.ttc", 98), NAVY, w)
    d.rectangle([60, 640, w - 60, 790], fill=(245, 236, 220))
    centered(d, 655, "ACOUSTIC NIGHT", F("Futura.ttc", 40, 2), NAVY, w)
    centered(d, 715, "FRI 22.10  ·  TICKETS AT THE DOOR", F("Futura.ttc", 24), NAVY, w)
    centered(d, 750, "free entry before 21:00", F("AmericanTypewriter.ttc", 22), (120, 60, 90), w)
    return age(im)

def poster_fuzz():
    w, h = 600, 840
    im = Image.new("RGB", (w, h), (232, 222, 200)); d = ImageDraw.Draw(im)
    d.rectangle([30, 30, w - 30, h - 30], outline=(20, 20, 20), width=8)
    for i in range(9):  # concentric speaker cone
        r = 220 - i * 24
        d.ellipse([w / 2 - r, 360 - r, w / 2 + r, 360 + r], outline=(20, 20, 20), width=6 if i % 2 else 2,
                  fill=(20, 20, 20) if i == 8 else None)
    for a in range(0, 360, 30):
        x, y = w / 2 + 250 * math.cos(math.radians(a)), 360 + 250 * math.sin(math.radians(a))
        bolt(d, x, y, 22, (200, 40, 40))
    centered(d, 50, "FUZZ & THUNDER", F("Impact.ttf", 70), (200, 40, 40), w)
    centered(d, 620, "LOUDER THAN YOUR PARENTS", F("Arial Black.ttf", 28), (20, 20, 20), w)
    y = 670
    for c in CITIES[2:6]:
        centered(d, y, c, F("Futura.ttc", 26), (20, 20, 20), w); y += 34
    return age(im)

def photo(w, h, sky, ground, blob):
    im = Image.new("RGB", (w, h), sky); d = ImageDraw.Draw(im)
    d.rectangle([0, h * 0.6, w, h], fill=ground)
    d.ellipse([w * 0.3, h * 0.25, w * 0.7, h * 0.85], fill=blob)
    d.ellipse([w * 0.4, h * 0.1, w * 0.6, h * 0.35], fill=(230, 190, 160))
    im = im.filter(ImageFilter.GaussianBlur(2))
    framed = Image.new("RGB", (w + 16, h + 40), (245, 242, 236)); framed.paste(im, (8, 8))
    return framed

def cork():
    w, h = 1024, 700
    im = Image.new("RGB", (w, h), (180, 132, 82))
    n = Image.effect_noise((w, h), 60).convert("L").filter(ImageFilter.GaussianBlur(0.8))
    im = ImageChops.multiply(im, Image.merge("RGB", (n, n, n)).point(lambda v: 170 + v // 3))
    d = ImageDraw.Draw(im)
    for _ in range(2500):  # cork speckle
        x, y = random.randrange(w), random.randrange(h)
        c = random.choice([(120, 80, 45), (210, 170, 120)]); d.point((x, y), fill=c)
    items = [photo(170, 130, (120, 170, 220), (90, 140, 80), PINK), photo(150, 190, (250, 190, 120), (60, 60, 80), NAVY),
             photo(180, 130, (40, 40, 80), (20, 20, 30), AMBER), photo(140, 140, (200, 220, 240), (240, 240, 240), (60, 120, 200))]
    spots = [(60, 60, -6), (300, 40, 4), (560, 90, -3), (800, 50, 7)]
    for it, (x, y, a) in zip(items, spots):
        r = it.rotate(a, expand=True, fillcolor=(0, 0, 0)); m = it.convert("L").point(lambda v: 255).rotate(a, expand=True)
        im.paste(r, (x, y), m)
    notes = [("maths test\nthursday!!", AMBER, 120, 380, 5), ("call Ioana\n07xx", PINK, 400, 400, -4),
             ("tickets ✓\nsat 9 oct", (170, 220, 170), 640, 380, 3), ("printer ink\n& cds", (240, 240, 150), 380, 120, 0)]
    for txt, col, x, y, a in notes[:3]:
        n_ = Image.new("RGB", (190, 180), col); nd = ImageDraw.Draw(n_)
        nd.multiline_text((16, 30), txt.replace("✓", "v"), font=F("Bradley Hand Bold.ttf", 34), fill=(40, 40, 70), spacing=10)
        r = n_.rotate(a, expand=True, fillcolor=(0, 0, 0)); m = Image.new("L", n_.size, 255).rotate(a, expand=True)
        im.paste(r, (x, y), m)
    tk = Image.new("RGB", (220, 90), (240, 230, 210)); td = ImageDraw.Draw(tk)  # a ticket stub
    td.rectangle([0, 0, 219, 89], outline=NAVY, width=4); td.text((14, 14), "ADMIT ONE", font=F("Impact.ttf", 30), fill=NAVY)
    td.text((14, 52), "THE STATIC HEARTS", font=F("Futura.ttc", 20), fill=(200, 40, 40))
    r = tk.rotate(-8, expand=True, fillcolor=0); im.paste(r, (790, 420), Image.new("L", tk.size, 255).rotate(-8, expand=True))
    for x, y in [(140, 70), (380, 48), (640, 98), (880, 58), (210, 392), (490, 410), (730, 390), (900, 430)]:  # pins
        d.ellipse([x - 9, y - 9, x + 9, y + 9], fill=random.choice([(220, 40, 60), (40, 90, 200), AMBER]))
        d.ellipse([x - 4, y - 6, x, y - 2], fill=(255, 255, 255))
    d.rectangle([0, 0, w - 1, h - 1], outline=(120, 85, 50), width=26)
    return grain(im, 10)

def sky():
    w, h = 1024, 1024
    im = Image.new("RGB", (w, h)); d = ImageDraw.Draw(im)
    stops = [(0.0, (34, 30, 82)), (0.35, (78, 62, 128)), (0.62, (196, 120, 150)), (0.78, (250, 176, 128)), (1.0, (255, 214, 160))]
    for y in range(h):
        t = y / h
        for (a, ca), (b, cb) in zip(stops, stops[1:]):
            if a <= t <= b:
                k = (t - a) / (b - a); d.line([(0, y), (w, y)], fill=tuple(int(ca[i] + (cb[i] - ca[i]) * k) for i in range(3))); break
    for _ in range(60):  # a few early stars
        x, y = random.randrange(w), random.randrange(int(h * 0.35)); d.point((x, y), fill=(230, 220, 255))
    # distant city: layered building silhouettes with lit windows
    for layer, (base, col, lit) in enumerate([(0.74, (92, 72, 130), 0.05), (0.82, (52, 42, 92), 0.12), (0.9, (30, 26, 62), 0.2)]):
        x = -20
        while x < w:
            bw = random.randint(30, 90); bh = random.randint(40, 220 - layer * 40)
            top = int(h * base) - bh
            d.rectangle([x, top, x + bw, h], fill=col)
            if random.random() < 0.15: d.line([(x + bw // 2, top), (x + bw // 2, top - 30)], fill=col, width=3)
            for wy in range(top + 8, h, 14):
                for wx in range(x + 6, x + bw - 6, 11):
                    if random.random() < lit:
                        d.rectangle([wx, wy, wx + 4, wy + 6], fill=random.choice([(255, 200, 120), (255, 226, 160), (255, 170, 110)]))
            x += bw + random.randint(-6, 8)
    return im.filter(ImageFilter.GaussianBlur(1.4))

def rug():
    w, h = 1024, 700
    im = Image.new("RGB", (w, h), (38, 36, 70)); d = ImageDraw.Draw(im)
    d.rectangle([30, 30, w - 30, h - 30], outline=(176, 92, 110), width=14)
    d.rectangle([60, 60, w - 60, h - 60], outline=(214, 160, 80), width=6)
    for i in range(7):  # diamond lattice
        for j in range(5):
            cx, cy = 150 + i * 120, 140 + j * 105
            d.polygon([(cx, cy - 44), (cx + 50, cy), (cx, cy + 44), (cx - 50, cy)], outline=(120, 104, 150), width=5)
            d.polygon([(cx, cy - 14), (cx + 16, cy), (cx, cy + 14), (cx - 16, cy)], fill=(198, 104, 128) if (i + j) % 2 else (214, 160, 80))
    n = Image.effect_noise((w, h), 50).convert("L")
    im = ImageChops.multiply(im, Image.merge("RGB", (n, n, n)).point(lambda v: 190 + v // 4))
    for y in range(0, h, 3):  # weave rows
        ImageDraw.Draw(im).line([(0, y), (w, y)], fill=None) if False else None
    return im.filter(ImageFilter.GaussianBlur(0.6))

def cover(title, bg, fg, art):
    s = 256
    im = Image.new("RGB", (s, s), bg); d = ImageDraw.Draw(im)
    if art == "circle": d.ellipse([60, 40, 196, 176], fill=fg)
    if art == "bolt": bolt(d, 128, 110, 80, fg)
    if art == "stripes":
        for i in range(6): d.rectangle([0, 40 + i * 24, s, 50 + i * 24], fill=fg)
    if art == "star":
        pts = [(128 + 80 * math.cos(math.radians(-90 + k * 36)) * (1 if k % 2 == 0 else 0.45),
                110 + 80 * math.sin(math.radians(-90 + k * 36)) * (1 if k % 2 == 0 else 0.45)) for k in range(10)]
        d.polygon(pts, fill=fg)
    centered(d, 200, title, F("Futura.ttc", 26, 2), fg if art != "circle" else (245, 236, 220), s)
    return grain(im, 8)

def covers():
    specs = [("VOLTAGE KIDS", NAVY, AMBER, "bolt"), ("NEON MOTH", PINK, NAVY, "circle"), ("STATIC", (25, 25, 30), PINK, "stripes"),
             ("MIXTAPE 03", (240, 230, 210), (200, 40, 40), "star"), ("FUZZ", (200, 40, 40), (240, 230, 210), "circle"),
             ("RAMEN", AMBER, NAVY, "stripes"), ("QUEST IV", (40, 90, 60), AMBER, "star"), ("GALAXY RUN", (20, 20, 60), (120, 200, 255), "bolt")]
    sheet = Image.new("RGB", (1024, 512))
    for k, s in enumerate(specs):
        sheet.paste(cover(*s), ((k % 4) * 256, (k // 4) * 256))
    return sheet

os.makedirs(OUT, exist_ok=True)
for name, fn in [("rug", rug), ("covers", covers)]:  # posters: make_band_posters.py; window view: make_sunset_sky.py
    fn().save(os.path.join(OUT, name + ".png")); print("wrote", name)
