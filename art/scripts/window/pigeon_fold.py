"""The pigeon (Fadly.W, Sketchfab, CC BY 4.0) comes mid-flight, wings up. Make it sit: shape keys on a copy whose
basis is the folded pose. Keys: Up (the original raised wings) and Down (the downstroke), for the flap on take-off."""
import bpy, bmesh
from mathutils import Vector, Matrix
import numpy as np
src = bpy.data.objects["PigeonFly"]
me = src.data
co = np.array([v.co[:] for v in me.vertices])
FOLD = globals().get("FOLD", {})
S = np.array(FOLD.get("S", (0.05, 0.1, 0.47)))            # shoulder (+y side)
WING_Y = FOLD.get("WING_Y", 0.13)                        # beyond this |y| it's all wing
BLEND = FOLD.get("BLEND", 0.05)                          # wing weight ramps over [WING_Y-BLEND, WING_Y]
K = FOLD.get("K", 0.68)                                  # span compression when folded
side = np.sign(co[:, 1]); side[side == 0] = 1
m = co.copy(); m[:, 1] = np.abs(m[:, 1])                 # mirror to +y, solve once
w = np.clip((m[:, 1] - (WING_Y - BLEND)) / BLEND, 0, 1)
w *= np.clip((m[:, 2] - 0.36) / 0.06, 0, 1)              # nothing below the back (legs, belly) moves
w = w * w * (3 - 2 * w)
# The wing's own axes, read off the mesh: span along the leading edge near the root (out and up), chord back
# toward the trailing edge, normal from the two. (SVD mixed span and chord on this swept wing.)
U = np.array(FOLD.get("U", (-0.068, 0.099, 0.091))); U = U / np.linalg.norm(U)
C = np.array((-1.0, 0, 0)); C = C - U * (C @ U); C = C / np.linalg.norm(C)
N = np.cross(U, C)
if N[1] > 0: N = -N                                      # dorsal side: faces the other wing when raised, outward when folded
d = m - S
s, ch, n = d @ U, d @ C, d @ N
U2 = Vector(FOLD.get("U2", (-1, 0.0, -0.10))).normalized()
C2 = Vector(FOLD.get("C2", (-0.25, 0.0, -1))).normalized()
N2 = U2.cross(C2).normalized()
if N2.y < 0: N2 = -N2
S2 = np.array(FOLD.get("S2", (0.07, 0.085, 0.47)))
fold = S2 + np.outer(s * K, U2) + np.outer(ch * FOLD.get("KC", 0.75), C2) + np.outer(n, N2)
# hug the body: the lower the point on the folded wing, the further it tucks in
fold[:, 1] -= FOLD.get("TUCK", 0.5) * np.clip(-(fold[:, 2] - S2[2]), 0, None) ** 2 * 4
fold[:, 1] = np.maximum(fold[:, 1], FOLD.get("MINY", 0.04))
new = m * (1 - w[:, None]) + fold * w[:, None]
# standing, not dangling: shorten the legs toward the belly (the flight pose hangs them long)
LEG = FOLD.get("LEG", (0.24, 0.45))
low = new[:, 2] < LEG[0]; new[low, 2] = LEG[0] - (LEG[0] - new[low, 2]) * LEG[1]
new[:, 1] *= side
# downstroke: the raised wing mirrored about the shoulder's horizontal plane, a little swept forward
down = m.copy(); down[:, 2] = S[2] - (m[:, 2] - S[2]) * 0.8; down[:, 0] += (S[0] - m[:, 0]) * 0.25 * np.clip(m[:, 1] - 0.1, 0, None) / 0.4
down = m * (1 - w[:, None]) + down * w[:, None]; down[:, 1] *= side
o = bpy.data.objects.get("Pigeon")
if o: bpy.data.objects.remove(o)
pm = me.copy(); pm.name = "Pigeon"
o = bpy.data.objects.new("Pigeon", pm); bpy.context.scene.collection.objects.link(o)
o.location = (0, 1.2, 0)
pm.vertices.foreach_set("co", new.ravel())
o.shape_key_add(name="Basis")
up = o.shape_key_add(name="Up"); up.data.foreach_set("co", co.ravel())
dk = o.shape_key_add(name="Down"); dk.data.foreach_set("co", down.ravel())
print("U", U.round(3), "C", C.round(3), "N", N.round(3))
