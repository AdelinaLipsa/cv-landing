# The Burmese, curled up asleep on the bed (part of build_cats.py; its helpers are in scope).
# Local axes of the Burmese empty: -Y toward the room, Z up, the duvet at z = 0. Body pivot at (0.018, 0.018, 0)
# (it breathes by scaling Z), head pivot at (-0.108, -0.072, 0.018) (it bobs), a tail wrapped round to her paws.
BODY = Vector((0.018, 0.018, 0))
HEAD = Vector((-0.108, -0.072, 0.018))


def at(p, o):  # root-space point -> a part's space
    return tuple(Vector(p) - o)


# ---- body: a loaf that curls round toward the head
C, RX, RY = Vector((0.012, 0.008, 0)), 0.088, 0.078  # the curl, nearly round from above
body = blob("Burmese_Body", [
    ell(at((C.x, C.y, 0.032), BODY), (RX, RY, 0.05)),                          # the dome
    ell(at((0.045, 0.04, 0.04), BODY), (0.055, 0.052, 0.045)),                # the hip, a touch higher
    ell(at((-0.058, -0.048, 0.03), BODY), (0.042, 0.042, 0.03), (0, 0, 45)),  # shoulder, under the head
], voxel=0.0024, smooth=24, faces=2600, cut_z=0.0015, hull=True)

def sable(co, root):
    c = mix(SABLE, SABLE_DK, 0.55 * ss(0.035, 0.08, co.z))                               # darker along the spine
    return mix(c, SABLE_LT, 0.45 * ss(-0.04, -0.085, root.y) * (1 - ss(0.01, 0.045, co.z)))  # a warm belly edge


paint(body, [FUR], lambda co, m: sable(co, co + BODY))
swap("Burmese_Body", body)

# ---- head: round, short-nosed, eyes shut in two little arcs
skin = blob("Burmese_HeadSkin", [
    ell((0, 0, 0.040), (0.039, 0.035, 0.032)),
    ell((-0.019, -0.017, 0.027), (0.022, 0.020, 0.019)), ell((0.019, -0.017, 0.027), (0.022, 0.020, 0.019)),
    ell((0, -0.031, 0.022), (0.0135, 0.0115, 0.0105)),
    ell((0, -0.027, 0.012), (0.0095, 0.0095, 0.007)),
    ell((0.022, 0.024, 0.016), (0.026, 0.026, 0.022)),   # into the shoulder
], voxel=0.0016, faces=2400, cut_z=-0.0165)

HM = [FUR, INNER, NOSE]
bm = bmesh.new()
ear(bm, (-0.021, 0.004, 0.058), (-0.039, 0.010, 0.089), 0.0175, 0.0052, m_out=0, m_in=1)
for s in (-1, 1):  # a closed eye: a soft downward arc
    for i in range(7):
        a = math.radians(-60 + 20 * i)
        p = Vector((0.0165 * s + math.sin(a) * 0.0075, -0.0352 - 0.0012 * math.cos(a), 0.037 - math.cos(a) * 0.0032))
        bm_ellipsoid(bm, p, Vector((0.0017, 0.0012, 0.0013)), Euler((0, 0, 0)), seg=8, ring=6, m=2)
bm_ellipsoid(bm, Vector((0, -0.0425, 0.0285)), Vector((0.0040, 0.0022, 0.0026)), Euler((math.radians(-20), 0, 0)), seg=12, ring=8, m=2)
parts = to_mesh("Burmese_HeadParts", bm, HM)
head = merge("Burmese_Head", skin, parts, mats=HM); D.meshes.remove(skin); D.meshes.remove(parts)


def head_col(co, m):
    d = Vector((co.x / 0.03, (co.y + 0.04) / 0.026, (co.z - 0.024) / 0.024)).length
    ears = ss(0.055, 0.07, co.z) * ss(0.01, 0.02, abs(co.x))
    return mix(mix(SABLE, SABLE_LT, 0.25 * (1 - ss(0.012, 0.03, co.z))), SABLE_DK, max(0.6 * (1 - ss(0.5, 1.3, d)), ears * 0.8))


paint(head, HM, head_col)
swap("Burmese_Head", head)
D.objects["Burmese_Head"].scale = (1.15, 1.15, 1.15)  # a rounder head, kitten-ish proportions

# the right ear twitches on its own, from its base
EAR = Vector((0.021, 0.004, 0.058))
bm = bmesh.new()
ear(bm, (0, 0, 0), tuple(Vector((0.039, 0.010, 0.089)) - EAR), 0.0175, 0.0052, m_out=0, m_in=1)
er = to_mesh("Burmese_EarR", bm, [FUR, INNER])
paint(er, [FUR, INNER], lambda co, m: mix(SABLE, SABLE_DK, 0.3 + 0.5 * ss(0.0, 0.02, co.z)))
swap("Burmese_EarR", er, location=tuple(EAR))

# ---- front paws tucked under her chin
PAWS = Vector((-0.1, -0.104, 0))
paws = blob("Burmese_Paws", [ell((-0.016, 0, 0.0085), (0.012, 0.022, 0.0085), (0, 0, 10)),
                             ell((0.016, 0.002, 0.0085), (0.012, 0.022, 0.0085), (0, 0, -6))],
            voxel=0.0015, faces=700, cut_z=0.001)
paint(paws, [FUR], lambda co, m: mix(SABLE, SABLE_LT, 0.3))
swap("Burmese_Paws", paws, location=tuple(PAWS))

# ---- tail: from her hip round the front of her, its tip at her paws
pts = [(C.x + (RX + 0.01) * math.cos(math.radians(a)), C.y + (RY + 0.01) * math.sin(math.radians(a)), z)
       for a, z in ((45, 0.03), (15, 0.018), (-15, 0.012), (-45, 0.0105), (-75, 0.0105), (-105, 0.0105), (-130, 0.012))]
tl = tail("Burmese_Tail", pts, 0.012, 0.0075)
paint(tl, [FUR], lambda co, m: mix(SABLE, SABLE_DK, 0.25 + 0.45 * ss(-0.02, -0.11, co.y)))
swap("Burmese_Tail", tl, location=(0, 0, 0))
print("burmese built")
