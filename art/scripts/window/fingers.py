"""Fingers round the mug: her character's hands are mittens, so each hand gets four fingers wrapping the mug toward
its far side and a thumb on the near side. Each finger is one watertight mesh (a tube swept along an arc, closed with
a dome at the tip, tapering a little), smooth shaded and subdivided, in her skin material. Run after pov.py."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
kill("Finger"); kill("Thumb")
mug = D.objects["Mug"]
C = mug.matrix_world.translation.copy()
RM = 0.042 * mug.scale.x + 0.011            # finger centre line, just off the mug's wall
skin = D.materials["Skin.001"]
def finger(name, pts, r, seg=10):
    """Sweep a circle of radius r (tapering to 0.85 r) along pts; cap the root flat, the tip with a dome."""
    bm = bmesh.new(); rings = []
    n = len(pts)
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized()
        a = t.cross(Vector((0, 0, 1))); a = a.normalized() if a.length > 1e-4 else Vector((1, 0, 0)); b = t.cross(a).normalized()
        rr = r * (1 - 0.15 * i / (n - 1))
        rings.append([bm.verts.new(p + (a * math.cos(k * math.tau / seg) + b * math.sin(k * math.tau / seg)) * rr) for k in range(seg)])
    for i in range(n - 1):
        for k in range(seg):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % seg], rings[i + 1][(k + 1) % seg], rings[i + 1][k]))
    bm.faces.new(list(reversed(rings[0])))   # root: hidden in the palm
    # tip dome: three shrinking rings and a pole
    t = (pts[-1] - pts[-2]).normalized(); last = rings[-1]; rr = r * 0.85
    a = t.cross(Vector((0, 0, 1))).normalized(); b = t.cross(a).normalized()
    prev = last
    for j, f in enumerate((0.92, 0.7, 0.38)):
        h = math.sqrt(max(0, 1 - f * f)) * rr
        ring = [bm.verts.new(pts[-1] + t * h + (a * math.cos(k * math.tau / seg) + b * math.sin(k * math.tau / seg)) * rr * f) for k in range(seg)]
        for k in range(seg): bm.faces.new((prev[k], prev[(k + 1) % seg], ring[(k + 1) % seg], ring[k]))
        prev = ring
    pole = bm.verts.new(pts[-1] + t * rr)
    for k in range(seg): bm.faces.new((prev[k], prev[(k + 1) % seg], pole))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = mesh_obj(name, bm); finish(o, skin, c="Window"); subsurf(o, 1)
    return o
def arc(sx, th0, th1, dz, rad, n=8):
    return [C + Vector((sx * math.cos(math.radians(t)) * rad, math.sin(math.radians(t)) * rad, dz)) for t in [th0 + (th1 - th0) * i / (n - 1) for i in range(n)]]
for side, sx in (("L", 1), ("R", -1)):
    for k, (dz, reach) in enumerate([(0.026, 62), (0.008, 70), (-0.01, 66), (-0.027, 52)]):
        pts = arc(sx, -14, reach, dz, RM + 0.004 * (k == 1))
        pts[0] = pts[0] + Vector((sx * 0.012, -0.004, 0))          # out of the palm
        finger(f"Finger{side}{k}", pts, 0.0098 if k < 3 else 0.0085)
    t = arc(sx, -8, -52, 0.04, RM - 0.001, n=7)                    # thumb: over the near side, a little higher
    t[0] = t[0] + Vector((sx * 0.016, 0.0, -0.01))
    finger(f"Thumb{side}", t, 0.0108)
print("fingers done")
