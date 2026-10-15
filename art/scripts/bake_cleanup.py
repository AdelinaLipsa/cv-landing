"""Step 1b: drop helpers and the faces nobody sees (outer wall faces, slab underside) to save atlas space."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
for n in ("HoleCutter", "TexHolder", "Handset"):
    if n in D.objects: D.objects.remove(D.objects[n], do_unlink=True)
o = D.objects["Room_Shell"]; mw = o.matrix_world
bm = bmesh.new(); bm.from_mesh(o.data)
def c(f): return mw @ f.calc_center_median()
dead = [f for f in bm.faces if (f.normal.x < -0.9 and -2.2 < c(f).x < -2.0) or (f.normal.y > 0.9 and 2.0 < c(f).y < 2.2) or (f.normal.z < -0.9 and c(f).z < -0.2)]
bmesh.ops.delete(bm, geom=dead, context="FACES"); bm.to_mesh(o.data); bm.free()
print("removed hidden faces", len(dead))
