"""Band posters in our own lettering (no official logos or artwork) into art/textures/."""
import math, random, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import importlib.util
spec = importlib.util.spec_from_file_location("mt", os.path.join(os.path.dirname(__file__), "make_textures.py"))
OUT = os.path.join(os.path.dirname(__file__), "..", "textures")
SUP = "/System/Library/Fonts/Supplemental/"
F = lambda n, s, i=0: ImageFont.truetype(SUP + n, s, index=i)
random.seed(11)

def paper(img, fade=0.12, yellow=(222, 205, 170)):
    w, h = img.size
    img = ImageChops.blend(img, Image.new("RGB", (w, h), yellow), fade)  # sun-faded
    n = Image.effect_noise((w, h), 24).convert("L").filter(ImageFilter.GaussianBlur(0.6))
    img = ImageChops.multiply(img, Image.merge("RGB", [n.point(lambda v: 205 + v // 5)] * 3))
    v = Image.new("L", (w, h), 0); d = ImageDraw.Draw(v)
    for i in range(30): d.rectangle([i * w // 120, i * h // 120, w - i * w // 120, h - i * h // 120], outline=int(255 * i / 30))
    v = v.filter(ImageFilter.GaussianBlur(w // 25))
    img = Image.composite(img, ImageChops.multiply(img, Image.new("RGB", (w, h), (190, 165, 125))), v)
    d = ImageDraw.Draw(img)
    y = random.randint(h // 3, 2 * h // 3)  # one soft crease from being folded in a magazine
    cr = Image.new("L", (w, h), 0); ImageDraw.Draw(cr).line([(0, y), (w, y + random.randint(-6, 6))], fill=90, width=2)
    img.paste((235, 228, 214), (0, 0), cr.filter(ImageFilter.GaussianBlur(1)))
    for _ in range(4):  # pin holes and scuffs at the corners
        cx, cy = random.choice([(14, 14), (w - 14, 14), (14, h - 14), (w - 14, h - 14)])
        d.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=(60, 50, 40))
    return img

def center(d, y, t, f, fill, w, **kw):
    tw = d.textlength(t, font=f); d.text(((w - tw) / 2, y), t, font=f, fill=fill, **kw)

def korn():
    w, h = 560, 800
    im = Image.new("RGB", (w, h), (16, 15, 14)); d = ImageDraw.Draw(im)
    for _ in range(900):  # grime
        x, y = random.randrange(w), random.randrange(h); r = random.random() * 3
        d.ellipse([x - r, y - r, x + r, y + r], fill=(40 + random.randint(0, 30),) * 3)
    lay = Image.new("L", (w, h), 0); ld = ImageDraw.Draw(lay)
    f = F("Chalkduster.ttf", 190)
    x = 40
    for ch, rot, dy in zip("KORN", (-6, 4, -3, 7), (0, 18, -6, 12)):
        g = Image.new("L", (220, 240), 0); ImageDraw.Draw(g).text((10, 0), ch, font=f, fill=255)
        g = g.rotate(rot, expand=False); lay.paste(g, (x, 150 + dy), g); x += 120
    # crayon: break the fill up with streaks
    st = Image.new("L", (w, h), 0); sd = ImageDraw.Draw(st)
    for _ in range(900):
        x0, y0 = random.randrange(w), random.randrange(h)
        sd.line([(x0, y0), (x0 + random.randint(10, 40), y0 - random.randint(-6, 6))], fill=255, width=2)
    lay = ImageChops.multiply(lay, ImageChops.invert(st).point(lambda v: 60 + v * 0.75))
    im.paste((214, 212, 196), (0, 0), lay)
    for _ in range(40):  # scratches
        x0, y0 = random.randrange(w), random.randrange(h)
        d.line([(x0, y0), (x0 + random.randint(-80, 80), y0 + random.randint(-80, 80))], fill=(70, 68, 62), width=1)
    d.rectangle([60, 520, w - 60, 524], fill=(170, 40, 30))
    center(d, 560, "LIVE  ·  ON TOUR", F("AmericanTypewriter.ttc", 30), (214, 212, 196), w)
    center(d, 610, "no sleep. no sun. no mercy.", F("Bradley Hand Bold.ttf", 30), (170, 40, 30), w)
    return paper(im, 0.06)

def slipknot():
    w, h = 520, 760
    im = Image.new("RGB", (w, h), (78, 78, 80)); d = ImageDraw.Draw(im)
    for i in range(0, h, 4): d.line([(0, i), (w, i)], fill=(70 + (i * 7) % 18,) * 3)
    d.rectangle([0, 0, w, 120], fill=(150, 22, 22))
    # stencil lettering: heavy type cut by stencil bridges
    lay = Image.new("L", (w, h), 0); ld = ImageDraw.Draw(lay)
    f = F("Impact.ttf", 118)
    ld.text(((w - ld.textlength("SLIPKNOT", font=f)) / 2, 170), "SLIPKNOT", font=f, fill=255)
    for x in range(30, w, 52): ld.rectangle([x, 170, x + 5, 330], fill=0)
    ld.rectangle([0, 248, w, 254], fill=0)
    dist = Image.effect_noise((w, h), 90).convert("L").point(lambda v: 0 if v > 200 else 255)
    lay = ImageChops.multiply(lay, dist)
    im.paste((232, 228, 220), (0, 0), lay)
    # barcode strip
    x = 70
    while x < w - 70:
        bw = random.choice([2, 3, 5, 7]); d.rectangle([x, 400, x + bw, 520], fill=(18, 18, 20)); x += bw + random.choice([2, 3, 5])
    center(d, 528, "0 4 2 6 6 9   9 1 2 0 1", F("Courier New Bold.ttf", 22), (18, 18, 20), w)
    center(d, 600, "MASKS ON  ·  ALL AGES  ·  LOUD", F("Courier New Bold.ttf", 20), (232, 228, 220), w)
    center(d, 40, "LIVE  ·  ONE NIGHT", F("Impact.ttf", 46), (240, 230, 220), w)
    for _ in range(25):
        x0, y0 = random.randrange(w), random.randrange(h); d.ellipse([x0, y0, x0 + 8, y0 + 5], fill=(120, 20, 20))
    return paper(im, 0.08)

def floyd():
    w, h = 600, 600
    im = Image.new("RGB", (w, h)); px = im.load()
    import colorsys
    for y in range(h):
        for x in range(w):
            dx, dy = x - w / 2, y - h * 0.42
            r = math.hypot(dx, dy); a = math.atan2(dy, dx)
            t = (r / 230 + 0.18 * math.sin(a * 3 + r / 40)) % 1
            c = colorsys.hsv_to_rgb((0.72 + t * 0.36) % 1, 0.7, 0.95 - 0.3 * min(1, r / 420))
            px[x, y] = tuple(int(v * 255) for v in c)
    im = im.filter(ImageFilter.GaussianBlur(1.2)); d = ImageDraw.Draw(im)
    d.rectangle([0, 440, w, h], fill=(18, 14, 30))
    f = F("Futura.ttc", 84, 4)
    for off, col in [(5, (18, 14, 30)), (0, (255, 244, 220))]:
        center(d, 450 + off, "PINK FLOYD", f, col, w)
    center(d, 548, "an evening of light & sound", F("AmericanTypewriter.ttc", 24), (240, 190, 120), w)
    return paper(im, 0.1)

def zeppelin():
    w, h = 560, 780
    im = Image.new("RGB", (w, h), (238, 226, 196)); d = ImageDraw.Draw(im)
    for r in range(380, 0, -18):  # 70s sun rings
        d.ellipse([w / 2 - r, 330 - r, w / 2 + r, 330 + r], outline=(214, 140, 60) if (r // 18) % 2 else (232, 186, 110), width=9)
    # a generic vintage airship
    ax, ay = w / 2, 330
    d.ellipse([ax - 210, ay - 62, ax + 190, ay + 62], fill=(52, 40, 36))
    d.polygon([(ax + 150, ay - 20), (ax + 235, ay - 85), (ax + 245, ay - 80), (ax + 200, ay)], fill=(52, 40, 36))
    d.polygon([(ax + 150, ay + 20), (ax + 235, ay + 85), (ax + 245, ay + 80), (ax + 200, ay)], fill=(52, 40, 36))
    d.rounded_rectangle([ax - 60, ay + 55, ax + 30, ay + 82], 8, fill=(52, 40, 36))
    for k in range(-160, 170, 40): d.arc([ax - 210, ay - 62, ax + 190, ay + 62], 0, 360, fill=(52, 40, 36))
    for k in range(-150, 160, 45): d.line([(ax + k, ay - 58 + abs(k) / 6), (ax + k, ay + 58 - abs(k) / 6)], fill=(90, 72, 62), width=2)
    center(d, 40, "LED ZEPPELIN", F("Rockwell.ttc", 74, 1), (120, 40, 30), w)
    center(d, 560, "IN CONCERT", F("Copperplate.ttc", 52, 1), (52, 40, 36), w)
    center(d, 630, "ONE NIGHT ONLY  ·  ALL SEATS", F("Copperplate.ttc", 26), (120, 40, 30), w)
    center(d, 680, "doors 7 pm", F("AmericanTypewriter.ttc", 24), (52, 40, 36), w)
    return paper(im, 0.16, (210, 185, 140))

def ozzy():
    w, h = 500, 720
    im = Image.new("RGB", (w, h), (20, 10, 32)); d = ImageDraw.Draw(im)
    for r in range(330, 0, -6):  # purple moon glow
        c = int(40 + 140 * (1 - r / 330)); d.ellipse([w / 2 - r, 300 - r, w / 2 + r, 300 + r], fill=(c // 2 + 20, c // 5, c))
    # bat silhouette
    cx, cy = w / 2, 300
    wing = [(0, -10), (40, -40), (90, -60), (150, -50), (190, -20), (160, -10), (140, 15), (115, 0), (95, 25), (70, 5), (45, 25), (20, 10)]
    d.polygon([(cx + x, cy + y) for x, y in wing], fill=(8, 4, 12))
    d.polygon([(cx - x, cy + y) for x, y in wing], fill=(8, 4, 12))
    d.ellipse([cx - 22, cy - 30, cx + 22, cy + 40], fill=(8, 4, 12))
    d.polygon([(cx - 18, cy - 22), (cx - 14, cy - 48), (cx - 4, cy - 26)], fill=(8, 4, 12))
    d.polygon([(cx + 18, cy - 22), (cx + 14, cy - 48), (cx + 4, cy - 26)], fill=(8, 4, 12))
    center(d, 30, "OZZY", F("Herculanum.ttf", 104), (205, 170, 255), w)
    center(d, 150, "OSBOURNE", F("Herculanum.ttf", 52), (205, 170, 255), w)
    center(d, 560, "LIVE IN CONCERT", F("Trattatello.ttf", 40), (190, 150, 240), w)
    center(d, 620, "live  ·  bring earplugs", F("AmericanTypewriter.ttc", 22), (150, 120, 190), w)
    return paper(im, 0.07)

def nirvana():
    w, h = 520, 700
    im = Image.new("RGB", (w, h), (236, 234, 228)); d = ImageDraw.Draw(im)
    # a xeroxed crowd shot: blobs, then crushed to black and white
    ph = Image.new("L", (w - 60, 330), 0); pd = ImageDraw.Draw(ph)
    for y in range(330): pd.line([(0, y), (w, y)], fill=int(230 - y * 0.45))  # stage light fading down
    pd.ellipse([150, -120, 330, 90], fill=255)
    for row, (yb, sc) in enumerate([(250, 0.8), (290, 1.0), (340, 1.25)]):  # crowd: heads, shoulders, raised arms
        for k in range(9):
            x = k * 56 + random.randint(-12, 12) + row * 18; r = 20 * sc
            pd.ellipse([x - r, yb - r * 3.2, x + r, yb - r * 1.2], fill=25)
            pd.ellipse([x - r * 2.2, yb - r * 1.6, x + r * 2.2, yb + r * 2], fill=25)
            if random.random() < 0.35:
                pd.line([(x + r, yb - r), (x + r * 2.2, yb - r * 6)], fill=25, width=int(9 * sc))
    ph = ph.filter(ImageFilter.GaussianBlur(1.5)).convert("1").convert("L")
    im.paste(Image.merge("RGB", [ph] * 3), (30, 250))
    fonts = [("Impact.ttf", 0), ("Courier New Bold.ttf", 0), ("Rockwell.ttc", 1), ("Futura.ttc", 4), ("AmericanTypewriter.ttc", 0), ("Bodoni 72.ttc", 0), ("Arial Black.ttf", 0)]
    x = 26
    for ch in "NIRVANA":  # ransom-note letters: each its own cut-out scrap
        fn, idx = random.choice(fonts); f = F(fn, random.randint(70, 96), idx)
        inv = random.random() < 0.4
        g = Image.new("RGB", (78, 110), (20, 20, 20) if inv else (250, 250, 246)); gd = ImageDraw.Draw(g)
        gd.text((39 - gd.textlength(ch, font=f) / 2, 4), ch, font=f, fill=(250, 250, 246) if inv else (15, 15, 15))
        g = g.rotate(random.uniform(-9, 9), expand=True, fillcolor=(236, 234, 228))
        im.paste(g, (x, 70 + random.randint(-14, 14))); x += 66
    f = F("Courier New Bold.ttf", 24)
    for k, t in enumerate(["LIVE IN THE BASEMENT", "ALL AGES . $5 AT THE DOOR", "bring a friend. bring earplugs."]):
        center(d, 600 + k * 30, t, f, (15, 15, 15), w)
    n = Image.effect_noise((w, h), 70).convert("L").point(lambda v: 0 if v > 225 else 255)  # toner specks
    im = ImageChops.multiply(im, Image.merge("RGB", [n] * 3))
    return paper(im.convert("L").convert("RGB"), 0.1)

def sonata():
    w, h = 540, 760
    im = Image.new("RGB", (w, h)); d = ImageDraw.Draw(im)
    for y in range(h):  # frosty gradient
        t = y / h; d.line([(0, y), (w, y)], fill=(int(70 + 160 * t), int(120 + 125 * t), int(185 + 70 * t)))
    for _ in range(160):  # snow
        x, y = random.randrange(w), random.randrange(h); r = random.random() * 2.4; d.ellipse([x - r, y - r, x + r, y + r], fill=(245, 250, 255))
    d.polygon([(0, 640), (90, 470), (150, 540), (250, 380), (330, 500), (400, 440), (540, 600), (540, h), (0, h)], fill=(30, 52, 92))
    d.polygon([(220, 430), (250, 380), (282, 428), (262, 420), (250, 400), (238, 424)], fill=(235, 244, 255))
    # a howling wolf on the peak
    wx, wy = 250, 382
    wolf = [(-34, 0), (-30, -22), (-18, -30), (-6, -40), (0, -62), (6, -74), (12, -70), (10, -56), (16, -44), (12, -30), (24, -10), (30, 0)]
    d.polygon([(wx + x, wy + y) for x, y in wolf], fill=(18, 30, 58))
    # sharp lettering: italic-sheared heavy type with a chrome fill and spiked ends
    lay = Image.new("L", (w * 2, 200), 0); ld = ImageDraw.Draw(lay)
    f = F("Futura.ttc", 92, 4); t = "SONATA"
    ld.text((40, 10), t, font=f, fill=255)
    lay = lay.transform(lay.size, Image.AFFINE, (1, 0.35, 0, 0, 1, 0)).crop((0, 0, w, 200))
    chrome = Image.new("RGB", (w, 200)); cd = ImageDraw.Draw(chrome)
    for y in range(200): v = int(255 - abs(y - 70) * 2.2); cd.line([(0, y), (w, y)], fill=(max(80, v), max(110, v), 255))
    edge = lay.filter(ImageFilter.MaxFilter(7))
    im.paste((10, 22, 50), (0, 60), edge); im.paste(chrome, (0, 60), lay)
    d = ImageDraw.Draw(im)
    d.polygon([(30, 175), (110, 168), (20, 205)], fill=(10, 22, 50)); d.polygon([(w - 30, 75), (w - 120, 82), (w - 10, 50)], fill=(10, 22, 50))
    lay2 = Image.new("L", (w * 2, 120), 0); ImageDraw.Draw(lay2).text((60, 0), "ARCTICA", font=F("Futura.ttc", 62, 4), fill=255)
    lay2 = lay2.transform(lay2.size, Image.AFFINE, (1, 0.35, 0, 0, 1, 0)).crop((0, 0, w, 120))
    im.paste((10, 22, 50), (60, 175), lay2.filter(ImageFilter.MaxFilter(5))); im.paste((235, 245, 255), (60, 175), lay2)
    d = ImageDraw.Draw(im)
    center(d, 690, "LIVE  ·  WINTER TOUR", F("Copperplate.ttc", 30, 1), (235, 245, 255), w)
    return paper(im, 0.06)

for n, fn in [("nirvana", nirvana), ("sonata_arctica", sonata), ("korn", korn), ("slipknot", slipknot), ("pink_floyd", floyd), ("led_zeppelin", zeppelin), ("ozzy", ozzy)]:
    fn().save(os.path.join(OUT, f"poster_{n}.png")); print("wrote", n)
