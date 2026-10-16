"""Her wall posters from the bands' real album art (Cover Art Archive), laid out as the promo posters record shops
hung in the 90s/00s: the cover full width, a strip under it with the album and "OUT NOW", printed on paper that's
been folded in the mailer and taped up a while. Same file names and sizes as before, so the walls keep their UVs.
  python3 art/scripts/make_real_posters.py <covers dir>   (korn.jpg slipknot.jpg zeppelin.jpg nirvana.jpg ...)"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "textures")
FONT = "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf"
# texture, cover, (w, h) as before, album, year, strip colour, ink
POSTERS = [
    ("poster_korn", "korn", (560, 800), "FOLLOW THE LEADER", 1998, (24, 20, 18), (236, 226, 204)),
    ("poster_slipknot", "slipknot", (520, 760), "IOWA", 2001, (14, 14, 14), (214, 40, 32)),
    ("poster_led_zeppelin", "zeppelin", (560, 780), "LED ZEPPELIN", 1969, (238, 232, 216), (30, 26, 24)),
    ("poster_nirvana", "nirvana", (520, 700), "BLEACH", 1989, (12, 12, 12), (240, 240, 236)),
    ("poster_sonata_arctica", "sonata", (540, 760), "RECKONING NIGHT", 2004, (26, 18, 14), (236, 196, 120)),
    ("poster_ozzy", "ozzy", (500, 720), "BARK AT THE MOON", 1983, (12, 16, 34), (226, 64, 52)),
    ("poster_pink_floyd", "floyd", (600, 600), None, 1975, None, None),
]
rng = np.random.default_rng(7)


def paper(im):
    """Folded in four for the mailer, a touch faded and yellowed, paper grain."""
    a = np.asarray(im, np.float32) / 255
    h, w, _ = a.shape
    a = a * 0.9 + np.array([0.07, 0.06, 0.04])                       # faded, warm
    yy, xx = np.mgrid[0:h, 0:w]
    for d in (np.abs(xx - w / 2), np.abs(yy - h / 2)):                # the folds: a bright ridge and its shadow
        a += (np.exp(-(d / 1.2) ** 2) * 0.10 - np.exp(-((d - 2.5) / 2.0) ** 2) * 0.05)[..., None]
    edge = np.minimum.reduce([xx, yy, w - 1 - xx, h - 1 - yy])
    a -= (np.clip(1 - edge / 10, 0, 1) * 0.08)[..., None]              # handled edges
    a += rng.normal(0, 0.014, (h, w, 1))
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


for tex, cover, (w, h), album, year, strip, ink in POSTERS:
    art = Image.open(os.path.join(SRC, cover + ".jpg")).convert("RGB")
    g = np.asarray(art.convert("L")) < 235                              # some scans come with a white border: trim it
    ys, xs = np.nonzero(g); art = art.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    s = min(art.size); art = art.crop(((art.width - s) // 2, (art.height - s) // 2, (art.width - s) // 2 + s, (art.height - s) // 2 + s))
    if album is None:                                                  # square: the sleeve as a print with a margin
        im = Image.new("RGB", (w, h), (240, 237, 228)); m = round(w * 0.05)
        im.paste(art.resize((w - 2 * m, h - 2 * m), Image.LANCZOS), (m, m))
    else:
        im = Image.new("RGB", (w, h), strip)
        im.paste(art.resize((w, w), Image.LANCZOS), (0, 0))
        d = ImageDraw.Draw(im); left = h - w; cx = w / 2
        def line(text, size, y, fill=ink, track=0):
            f = ImageFont.truetype(FONT, size)
            text = (" " * track).join(text) if track else text
            tw = d.textlength(text, font=f)
            if tw > w * 0.9: f = ImageFont.truetype(FONT, int(size * w * 0.9 / tw)); tw = d.textlength(text, font=f)
            d.text((cx - tw / 2, y), text, font=f, fill=fill)
        u = left / 3
        line("THE NEW ALBUM", int(u * 0.42), w + u * 0.22, track=1)
        line(album, int(u * 1.05), w + u * 0.78)
        line(f"OUT NOW  ·  {year}", int(u * 0.42), w + u * 2.05, track=1)
    paper(im).save(os.path.join(OUT, tex + ".png"), optimize=True)
    print(tex, (w, h))
