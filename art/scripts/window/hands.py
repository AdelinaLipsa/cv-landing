"""Her hands round the mug, from "hands animation" (hugo colauto, Sketchfab Standard): two rigged hands, 23 joints
each. Imported once into Assets-free collection "Hands"; this places each hand on the mug and curls its fingers.
Her jumper's sleeves (her character) stay as the forearms; her character's mitten hands are left out of the export."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
SRC = ART + "/downloads/hands/hands_animation.glb"
if "Hands" not in D.collections or not D.collections["Hands"].objects:
    before = set(D.objects.keys())
    bpy.ops.import_scene.gltf(filepath=SRC)
    for o in [D.objects[n] for n in set(D.objects.keys()) - before]:
        for c in list(o.users_collection): c.objects.unlink(o)
        coll("Hands").objects.link(o)

