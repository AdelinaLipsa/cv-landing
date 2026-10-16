"""The two coats for the Munchkin model, painted over its calico texture (PIL + numpy, run outside Blender):
  python3 art/scripts/munchkin_coats.py <fur.png> <tailfur.png> <pos.npy> <mask.png> <out dir>
All three body inputs are baked in Blender onto the cat's own non-overlapping UVs (UVCat; the model's UVs share
texels across the face): fur.png the calico texture, pos.npy each texel's object-space position (bottom-up rows),
mask.png red = eyes, green = paw pads. Colours come from
where a pixel sits on the cat (points, gloves, stripes); the calico's own fur strands ride on top as high-pass detail.
Writes birman_body.png, birman_tail.png, tabby_body.png, tabby_tail.png."""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import uniform_filter

body_p, tail_p, pos_p, mask_p, out = sys.argv[1:6]
src = np.asarray(Image.open(body_p).convert("RGB"), np.float32) / 255
H, W, _ = src.shape
pos = np.load(pos_p)[::-1, :, :3]                       # Blender rows run bottom-up
x, y, z = np.abs(pos[..., 0]), pos[..., 1], pos[..., 2]   # |x|: the cat is symmetric
inside = (np.abs(pos).sum(-1) > 1e-5) | (src.sum(-1) > 0.08)

L = src @ np.array([0.299, 0.587, 0.114], np.float32)
hp = L - uniform_filter(L, 15)                            # the fur strands, without the calico patches
pink = (src[..., 0] > 0.7) & (src[..., 0] - src[..., 1] > 0.18) & (src[..., 2] > 0.55)
mask = np.asarray(Image.open(mask_p).convert("RGB"), np.float32) / 255
eye, pads = mask[..., 0] > 0.5, mask[..., 1] > 0.5
pink |= pads


def ss(a, b, v):
    t = np.clip((v - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def mix(a, b, t):
    return a + (np.asarray(b, np.float32) - a) * t[..., None]


def rgb(*c):
    return np.asarray(c, np.float32) / 255


def noise(scale, seed):
    r = np.random.default_rng(seed); n = 0
    for _ in range(4):
        k = r.normal(size=3) / scale; n = n + np.sin(x * k[0] + y * k[1] + z * k[2] + r.uniform(0, 6.3))
    return n / 2


head = ss(-0.07, -0.09, y) * ss(0.09, 0.11, z)
# The head is turned a little in the model, so face features hang off the real nose and eyes, not the midline.
P = pos[..., :3]
nose = np.median(P[pink & ~pads & (head > 0.5)], 0)
ex = P[eye]; eL, eR = np.median(ex[ex[:, 0] < np.median(ex[:, 0])], 0), np.median(ex[ex[:, 0] >= np.median(ex[:, 0])], 0)
right = (eR - eL) / np.linalg.norm(eR - eL); mid = (eL + eR) / 2
fx = np.abs((P - mid) @ right)                               # across the face, from its own midline
dn = np.linalg.norm(P - nose, axis=-1); de = np.minimum(np.linalg.norm(P - eL, axis=-1), np.linalg.norm(P - eR, axis=-1))
print("nose", nose.round(3), "eyes", eL.round(3), eR.round(3))
feet_f, feet_h = (y < -0.05) & (z < 0.075), (y > 0.06) & (z < 0.075)


def finish(col, keep_eyes=None):
    col = col * (1 + 1.6 * hp[..., None])
    col = np.where(pink[..., None], src, col)
    if keep_eyes is not None: col = np.where(eye[..., None], keep_eyes, col)
    col = np.where(inside[..., None], col, src)
    return Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8))


# ---- Birman: blue point, a cool white body with a faint grey saddle, charcoal-to-black points, white gloves, blue eyes
c = np.ones((H, W, 3), np.float32) * rgb(236, 235, 232)
c = mix(c, rgb(200, 201, 204), 0.6 * ss(0.11, 0.16, z) * (y > -0.08))                # grey saddle
pt = np.maximum.reduce([
    (1 - ss(0.02, 0.038, np.minimum(dn, de + 0.004))) * head,                        # the mask: muzzle and round the eyes
    ss(mid[2] + 0.012, mid[2] + 0.026, z) * head,                                     # ears
    ss(0.08, 0.045, z) * (feet_f | feet_h),                                           # legs, darkening down
    ss(0.112, 0.14, y),                                                               # tail root
])
c = mix(c, rgb(72, 74, 80), pt)
c = mix(c, rgb(24, 25, 28), pt * ss(0.5, 1.0, pt) * 0.75)
glove = (feet_f & (z < 0.03)) | (feet_h & (z < 0.04))
c = mix(c, rgb(250, 248, 244), ss(0.0, 1.0, glove.astype(np.float32)))
blue = mix(np.ones_like(src) * rgb(18, 40, 96), rgb(118, 180, 240), ss(0.15, 0.75, L))
blue = np.where((L < 0.12)[..., None], src, blue)                                     # the pupil stays
finish(c, blue).save(f"{out}/birman_body.png")

# ---- European grey tabby with black: mackerel stripes, lighter belly and chin, eyes shut (she's asleep)
c = np.ones((H, W, 3), np.float32) * rgb(150, 150, 148)
c = mix(c, rgb(112, 112, 112), 0.5 * ss(-0.3, 0.9, noise(0.006, 7)))                  # agouti mottling
c = mix(c, rgb(200, 200, 196), ss(0.065, 0.035, z) * (np.abs(y) < 0.12) * (z > 0.03))  # belly
c = mix(c, rgb(214, 214, 210), (1 - ss(0.012, 0.03, dn)) * head * (z < nose[2] + 0.004))  # muzzle and chin
w = noise(0.03, 3) + 0.5 * noise(0.012, 5)
body = (y > -0.07) & (y < 0.12)
s_body = np.sin(2 * np.pi * y / 0.034 + 1.4 * w)
s_leg = np.sin(2 * np.pi * z / 0.026 + 0.8 * w)
s_tail = np.sin(2 * np.pi * y / 0.03 + 0.6 * w)
s_brow = np.sin(2 * np.pi * fx / 0.012 + 0.5 * w)
s_cheek = np.sin(2 * np.pi * z / 0.016 + 0.5 * w)
stripe = np.maximum.reduce([
    ss(0.45, 0.85, s_body) * body * ss(0.055, 0.085, z) * ss(-0.6, 0.2, noise(0.02, 9)),  # mackerel rings, broken
    ss(0.012, 0.004, np.abs(x)) * ss(0.13, 0.15, z) * body,                           # the spine line
    ss(0.5, 0.85, s_leg) * (feet_f | feet_h) * ss(0.005, 0.02, z),                    # leg bars
    ss(0.35, 0.8, s_tail) * ss(0.115, 0.13, y),                                       # tail rings
    ss(0.3, 0.8, s_brow) * head * ss(mid[2] + 0.008, mid[2] + 0.02, z) * (fx < 0.03), # the M on her brow
    ss(0.4, 0.85, s_cheek) * head * ss(0.022, 0.03, fx) * (z < mid[2]) * (z > nose[2] - 0.01),  # cheek lines
])
c = mix(c, rgb(16, 16, 18), stripe * 0.95)
zc = np.median(z[eye])                                                                # a dark lash line across each eye
shut = mix(np.ones_like(src) * rgb(120, 120, 118), rgb(28, 28, 32), ss(0.0035, 0.0012, np.abs(z - zc)))
finish(c, shut).save(f"{out}/tabby_body.png")

# ---- tails (the fluffy fur cards): luminance kept, alpha kept
t = Image.open(tail_p).convert("RGBA"); ta = np.asarray(t, np.float32) / 255
TL = ta[..., :3] @ np.array([0.299, 0.587, 0.114], np.float32)
TL = TL / max(1e-3, np.percentile(TL[ta[..., 3] > 0.3], 90))
for name, lo, hi in (("birman", rgb(20, 21, 24), rgb(96, 98, 104)), ("tabby", rgb(16, 16, 18), rgb(150, 150, 148))):
    col = mix(np.ones_like(ta[..., :3]) * lo, hi, np.clip(TL, 0, 1))
    Image.fromarray((np.dstack([np.clip(col, 0, 1), ta[..., 3:]]) * 255).astype(np.uint8)).save(f"{out}/{name}_tail.png")
print("coats written to", out)
