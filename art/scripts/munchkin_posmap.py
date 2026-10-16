"""Object-space position per texel of the Munchkin body texture, rasterized from its UV triangles:
  python3 art/scripts/munchkin_posmap.py <tris.npz> <pos.npy>
The UVs overlap (mouth, sockets and outer fur share texels), so a Cycles bake let hidden shells win; here the
outermost surface (farthest from the body's axis) wins each texel. Rows run bottom-up, as Blender bakes them."""
import sys
import numpy as np

d = np.load(sys.argv[1]); UV, P = d["uv"] * 1024, d["p"]
N = 1024
pos = np.zeros((N, N, 4), np.float32); best = np.full((N, N), -1.0, np.float32)
axis = lambda q: np.hypot(q[..., 0], q[..., 2] - 0.1)        # distance from a line along the body
for (a, b, c), pa in zip(UV, P):
    x0, x1 = int(max(0, min(a[0], b[0], c[0]) - 1)), int(min(N - 1, max(a[0], b[0], c[0]) + 1))
    y0, y1 = int(max(0, min(a[1], b[1], c[1]) - 1)), int(min(N - 1, max(a[1], b[1], c[1]) + 1))
    if x1 < x0 or y1 < y0: continue
    gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
    den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
    if abs(den) < 1e-9: continue
    w0 = ((b[1] - c[1]) * (gx - c[0]) + (c[0] - b[0]) * (gy - c[1])) / den
    w1 = ((c[1] - a[1]) * (gx - c[0]) + (a[0] - c[0]) * (gy - c[1])) / den
    w2 = 1 - w0 - w1
    m = (w0 >= -0.02) & (w1 >= -0.02) & (w2 >= -0.02)
    if not m.any(): continue
    q = w0[..., None] * pa[0] + w1[..., None] * pa[1] + w2[..., None] * pa[2]
    r = axis(q)
    ys, xs = np.nonzero(m)
    sub = best[y0 + ys, x0 + xs]; win = r[ys, xs] > sub
    yy, xx = y0 + ys[win], x0 + xs[win]
    best[yy, xx] = r[ys, xs][win]; pos[yy, xx, :3] = q[ys[win], xs[win]]; pos[yy, xx, 3] = 1
# bleed a few texels past the island edges so filtering doesn't pull in the background
from scipy.ndimage import grey_dilation, distance_transform_edt
idx = distance_transform_edt(pos[..., 3] < 0.5, return_distances=False, return_indices=True)
pos = pos[idx[0], idx[1]]
np.save(sys.argv[2], pos)
print("covered", round(float((best >= 0).mean()), 3))
