"""The view out of the window: a low sun setting behind the city, warm gold into pink and violet."""
import math, random, os
from PIL import Image, ImageDraw, ImageFilter, ImageChops
OUT = os.path.join(os.path.dirname(__file__), "..", "textures", "sunset_sky.png")
random.seed(21)
w, h = 1024, 1024
im = Image.new("RGB", (w, h)); d = ImageDraw.Draw(im)
stops = [(0.0, (40, 42, 96)), (0.3, (61, 63, 122)), (0.5, (150, 100, 160)), (0.62, (229, 143, 181)), (0.72, (247, 178, 160)), (0.8, (255, 154, 118)), (1.0, (255, 170, 130))]
for y in range(h):
    t = y / h
    for (a, ca), (b, cb) in zip(stops, stops[1:]):
        if a <= t <= b:
            k = (t - a) / (b - a); d.line([(0, y), (w, y)], fill=tuple(int(ca[i] + (cb[i] - ca[i]) * k) for i in range(3))); break
# the sun: a soft glow and a bright disc sitting low, half behind the skyline
sx, sy = int(w * 0.42), int(h * 0.79)
glow = Image.new("L", (w, h), 0); gd = ImageDraw.Draw(glow)
for r in range(420, 0, -6): gd.ellipse([sx - r, sy - r, sx + r, sy + r], fill=int(255 * (1 - r / 420) ** 2.2))
im = Image.composite(Image.new("RGB", (w, h), (255, 196, 150)), im, glow.point(lambda v: int(v * 0.7)))
d = ImageDraw.Draw(im); d.ellipse([sx - 60, sy - 60, sx + 60, sy + 60], fill=(255, 226, 190))
# thin warm cloud streaks
for _ in range(9):
    y = random.randint(int(h * 0.25), int(h * 0.62)); x = random.randint(-200, w - 200); L = random.randint(220, 520)
    d.rounded_rectangle([x, y, x + L, y + random.randint(5, 12)], 6, fill=(255, 168, 150) if y > h * 0.5 else (170, 110, 170))
im = im.filter(ImageFilter.GaussianBlur(2.2))
d = ImageDraw.Draw(im)
# skyline layers, back to front, with a few early window lights
for layer, (base, col, lit) in enumerate([(0.8, (70, 64, 120), 0.02), (0.86, (44, 42, 92), 0.05), (0.93, (26, 26, 60), 0.1)]):
    x = -20
    while x < w:
        bw = random.randint(30, 90); bh = random.randint(40, 200 - layer * 40); top = int(h * base) - bh
        d.rectangle([x, top, x + bw, h], fill=col)
        if random.random() < 0.15: d.line([(x + bw // 2, top), (x + bw // 2, top - 30)], fill=col, width=3)
        for wy in range(top + 8, h, 14):
            for wx in range(x + 6, x + bw - 6, 11):
                if random.random() < lit: d.rectangle([wx, wy, wx + 4, wy + 6], fill=random.choice([(255, 210, 140), (255, 226, 170)]))
        x += bw + random.randint(-6, 8)
for _ in range(5):  # birds
    bx, by = random.randint(100, 900), random.randint(150, 420)
    d.line([(bx - 8, by - 3), (bx, by), (bx + 8, by - 3)], fill=(90, 50, 90), width=2)
im.filter(ImageFilter.GaussianBlur(0.8)).save(OUT); print("wrote", OUT)
