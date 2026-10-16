"""Her point of view: sitting at the window, her hands round the room's navy mug (hot chocolate now), the pigeon on
the outer sill outside the glass. The camera is her eyes; her character (from room.blend) gives the arms."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
P = {"SCALE": 1.15, "MUG": (-0.07, -0.12, 1.168), "GRIP_X": 0.078, "GRIP_Y": -0.018, "GRIP_Z": 0.03, "EYE_LOCAL": 0.80,
     "HAND_RY": 80, "HAND_RZ": 10, "HAND_RX": -20, **globals().get("POV", {})}
EYE = Vector(P.get("EYE", (-0.04, -0.56, 1.36)))
PITCH = P.get("PITCH", -7.0)
HFOV = P.get("HFOV", 80.0)
MUG = Vector(P.get("MUG", (-0.07, -0.13, 1.06)))
cam = D.objects["ViewCam"]
cam.location = EYE; cam.rotation_euler = (math.radians(90 + PITCH), 0, 0)
cam.data.shift_y = 0; cam.data.lens = 18 / math.tan(math.radians(HFOV / 2)); cam.data.clip_start = 0.02
# the mug: hot chocolate, a few mini marshmallows
mug = D.objects["Mug"]; mug.location = MUG; mug.scale = (1.25,) * 3; mug.rotation_euler = (0, 0, math.radians(P.get("MUG_TURN", 115)))
coco = D.objects["MugCoffee"].data.materials[0]
coco.name = "HotChocolate"; b = bsdf_of(coco); b.inputs["Base Color"].default_value = hexc("#5A3322"); b.inputs["Roughness"].default_value = 0.25
kill("Marshmallow")
if "CocoaMug" in D.objects: P["NO_MARSH"] = True   # the hot chocolate brings its own
mm = mat("Marshmallow", "#F6EFE6", rough=0.7, sheen=0.4)
bpy.context.view_layer.update()
top = D.objects["MugCoffee"].matrix_world.translation.copy()
for k, (dx, dy, rz) in enumerate([] if P.get("NO_MARSH") else [(0.012, 0.008, 0.3), (-0.014, 0.004, 1.1), (0.002, -0.015, 0.7), (-0.004, 0.018, 2.0)]):
    box(f"Marshmallow{k}", (0.014, 0.014, 0.011), (top.x + dx, top.y + dy, top.z + 0.003), mm, bevel=0.003, rot=(0.2 * k, 0.1, rz), c="Window", parent=None)
# her: only the arms show; the rest is hidden from the camera
rig = D.objects["Her_Rig"]
S = P.get("SCALE", 1.75)
rig.scale = (S, S, S)
rig.location = (EYE.x, EYE.y - 0.04, EYE.z - P.get("EYE_LOCAL", 0.77) * S)
rig.rotation_euler = (0, 0, math.pi)   # facing the window (Rigify characters face -Y): her left arm is on her left
HIDE = ("Vert.001", "Trousers.001", "Tounge.001", "Teeth upper.001", "Teeth lower.001", "Sphere.001", "Right Shoe.001", "Nose.001",
        "Legs.001", "Hair.001", "Head.001", "Hat 2.001", "Ears.001", "Glasses")
for n in HIDE: D.objects[n].hide_render = True; D.objects[n].hide_set(True)
bpy.context.view_layer.update()
mw = rig.matrix_world
for side, sx in (("L", 1), ("R", -1)):
    rig.pose.bones[f"upper_arm_parent.{side}"]["IK_FK"] = 0.0
    pb = rig.pose.bones[f"hand_ik.{side}"]
    hand = MUG + Vector((sx * P.get("GRIP_X", 0.05), P.get("GRIP_Y", -0.01), P.get("GRIP_Z", -0.005)))
    # fingers point forward and round the mug, palm toward it
    rot = Euler((math.radians(P.get("HAND_RX", 0)), math.radians(sx * P.get("HAND_RY", 70)), math.radians(sx * P.get("HAND_RZ", 20))))
    m = Matrix.Translation(hand) @ rot.to_matrix().to_4x4()
    pb.matrix = mw.inverted() @ m
    pb.scale = (P.get("HAND_S", 0.62),) * 3                # her toy hands, a size smaller round the mug
bpy.context.view_layer.update()
print("cam lens", round(cam.data.lens, 2))
# the pigeon on the tin sill, centre right, turned a little toward her
pr = D.objects.get("PigeonRig")
if pr: pr.location = (0.27, 0.395, 0.917); pr.rotation_euler = (0, 0, math.radians(200)); pr.scale = (1.15,) * 3
