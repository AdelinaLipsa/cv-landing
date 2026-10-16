# The Siamese, sitting up on the desk facing the room (part of build_cats.py; its helpers are in scope).
# Local axes of the Siamese empty: -Y is her front, Z up, the desk at z = 0. Head pivot at (0, 0, 0.126).
HEAD_Z = 0.126

# ---- body: haunches, a narrow chest, a long neck, the left foreleg and the hind feet
body = blob("Siamese_Body", [
    ell((0, 0.028, 0.048), (0.052, 0.056, 0.046)),          # haunches
    ell((0, 0.006, 0.085), (0.038, 0.040, 0.052), (-12, 0, 0)),  # torso, leaning back a touch
    ell((0, -0.016, 0.104), (0.031, 0.030, 0.038)),          # chest
    ell((0, -0.010, 0.135), (0.021, 0.022, 0.030)),          # neck
    ell((-0.043, 0.020, 0.038), (0.018, 0.044, 0.032)), ell((0.043, 0.020, 0.038), (0.018, 0.044, 0.032)),  # thighs
    ell((-0.036, -0.026, 0.007), (0.012, 0.026, 0.0075)), ell((0.036, -0.026, 0.007), (0.012, 0.026, 0.0075)),  # hind feet
    cap((-0.019, -0.026, 0.092), (-0.020, -0.040, 0.012), (0.0115, 0.0085)),  # left foreleg
    ell((-0.020, -0.046, 0.0065), (0.0105, 0.015, 0.0068)),  # its paw
], faces=2400)


def body_col(co, m):
    c = mix(IVORY, FAWN, 0.45 * ss(0.0, 0.08, co.y) * ss(0.03, 0.11, co.z))       # a fawn saddle on the back
    leg = (1 - ss(0.016, 0.075, co.z)) * (co.y < -0.012) * (abs(co.x) < 0.032)    # foreleg stocking
    foot = (co.z < 0.02) * (abs(co.x) > 0.024) * ss(0.0, -0.03, co.y) * 0.8       # hind toes
    neck = 0.35 * ss(0.12, 0.16, co.z)                                              # shading into the mask
    return mix(c, SEAL, max(leg, foot, neck))


paint(body, [FUR], body_col)
swap("Siamese_Body", body)

# ---- the right foreleg (Siamese_Paw: pivot at the shoulder, it lifts to lick)
paw = blob("Siamese_Paw", [
    cap((0.0, 0.004, 0.0), (-0.004, -0.004, -0.078), (0.0115, 0.0085)),
    ell((-0.004, -0.011, -0.0835), (0.0105, 0.015, 0.0068)),
], faces=700)
paint(paw, [FUR], lambda co, m: mix(IVORY, SEAL, 1 - ss(-0.075, -0.015, co.z)))
swap("Siamese_Paw", paw, location=(0.019, -0.042, 0.090))

# ---- tail: wraps round her right side to the front of her feet; pivot at her centre so the flick slides it
# along itself instead of through her
TP = Vector((0.0, 0.0, 0.0))
pts = [(0.0, 0.07, 0.03), (0.045, 0.075, 0.016), (0.074, 0.04, 0.0115), (0.08, -0.01, 0.0105),
       (0.066, -0.052, 0.0105), (0.036, -0.074, 0.0115), (0.008, -0.078, 0.016)]
tl = tail("Siamese_Tail", [tuple(Vector(p) - TP) for p in pts], 0.0125, 0.0075)
paint(tl, [FUR], lambda co, m: mix(FAWN, SEAL, 0.45 + 0.55 * ss(0.075, 0.0, co.y + 0.0 * co.x)))
swap("Siamese_Tail", tl, location=tuple(TP))

# ---- head: wedge-shaped, big ears, slanted blue almond eyes
skin = blob("Siamese_HeadSkin", [
    ell((0, 0.002, 0.046), (0.036, 0.034, 0.032)),          # cranium
    ell((-0.017, -0.019, 0.033), (0.020, 0.020, 0.019)), ell((0.017, -0.019, 0.033), (0.020, 0.020, 0.019)),  # cheeks
    ell((0, -0.031, 0.027), (0.0145, 0.015, 0.0125), (8, 0, 0)),   # muzzle, a short wedge
    ell((0, -0.030, 0.017), (0.0095, 0.011, 0.008)),        # chin
    ell((0, 0.006, 0.012), (0.022, 0.024, 0.022)),          # into the neck
], voxel=0.0016, faces=2600)

bm = bmesh.new()
ear(bm, (-0.021, 0.004, 0.062), (-0.043, 0.012, 0.104), 0.0185, 0.0055, m_out=0, m_in=1)
ear(bm, (0.021, 0.004, 0.062), (0.043, 0.012, 0.104), 0.0185, 0.0055, m_out=0, m_in=1)
EYES = []
for s in (-1, 1):
    c = Vector((0.0170 * s, -0.0318, 0.0455)); rot = Euler((0, math.radians(-15 * s), math.radians(24 * s)))
    EYES.append((c, rot))
    bm_ellipsoid(bm, c, Vector((0.0090, 0.0040, 0.0058)), rot, m=2)
bm_ellipsoid(bm, Vector((0, -0.0455, 0.0325)), Vector((0.0042, 0.0024, 0.0028)), Euler((math.radians(-20), 0, 0)), seg=12, ring=8, m=3)
HM = [FUR, INNER, EYE, NOSE]
parts = to_mesh("Siamese_HeadParts", bm, HM)
head = merge("Siamese_Head", skin, parts, mats=HM); D.meshes.remove(skin); D.meshes.remove(parts)


def head_col(co, m):
    d = Vector(((co.x) / 0.034, (co.y + 0.045) / 0.034, (co.z - 0.032) / 0.030)).length
    mask = 1 - ss(0.55, 1.3, d)
    ears = ss(0.058, 0.074, co.z) * ss(0.012, 0.022, abs(co.x))
    c = mix(IVORY, FAWN, 0.22 * ss(0.03, 0.075, co.z))
    return mix(c, SEAL, max(mask, ears))


paint(head, HM, head_col)
swap("Siamese_Head", head)

# pupils: vertical slits a hair in front of each eye (objects parented to the head: mesh in head space)
for (c, rot), n in zip(EYES, ("Siamese_PupilR", "Siamese_PupilL") if EYES[0][0].x < 0 and False else ("Siamese_PupilL", "Siamese_PupilR")):
    bm = bmesh.new()
    bm_ellipsoid(bm, c + rot.to_matrix() @ Vector((0, -0.0036, 0)), Vector((0.0017, 0.0010, 0.0047)), rot, seg=10, ring=8)
    me = D.meshes.new(n); bm.to_mesh(me); bm.free()
    paint(me, [PUPIL], lambda co, m: (0, 0, 0))
    swap(n, me, location=(0, 0, 0))

# lids: a cap over each eye in the mask colour; the blink scales them up from the head's pivot
bm = bmesh.new()
for c, rot in EYES: bm_ellipsoid(bm, c + rot.to_matrix() @ Vector((0, -0.0006, 0.0006)), Vector((0.0100, 0.0047, 0.0066)), rot, seg=16, ring=10)
LZ = 0.046  # pivot at eye height, so the open (scale ~0) lids flatten inside the eyes, not under the chin
bmesh.ops.translate(bm, vec=(0, 0, -LZ), verts=bm.verts)
lids = D.meshes.new("Siamese_Lids"); bm.to_mesh(lids); bm.free()
paint(lids, [FUR], lambda co, m: mix(FAWN, SEAL, 0.75))
swap("Siamese_Lids", lids, location=(0, 0, LZ))

# tongue: a small pink lick under the muzzle (scales up from its own pivot)
bm = bmesh.new(); bm_ellipsoid(bm, Vector((0, -0.003, -0.001)), Vector((0.0055, 0.0065, 0.0022)), Euler((math.radians(-25), 0, 0)), seg=12, ring=8)
tg = D.meshes.new("Siamese_Tongue"); bm.to_mesh(tg); bm.free()
paint(tg, [PINK], lambda co, m: (1, 1, 1))
swap("Siamese_Tongue", tg, location=(0, -0.05, 0.012))
print("siamese built")
