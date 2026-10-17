"""Rig her sitting pigeon (Gascogne Pigeon by Nyilonelycompany, Sketchfab Standard) for the site's loop: look at her,
look out, peck at the crumbs, stare. Bones: Root, Body, Tail, Neck, Head; the site turns Neck/Head live."""
import bpy
from mathutils import Vector
o = bpy.data.objects["PigeonSit"]
old = bpy.data.objects.get("PigeonRig")
if old:  # unparent keeping where it stands (pov.py placed the old rig): else the parent inverse drops it, and the new rig, at the origin
    w = o.matrix_world.copy(); o.parent = None; o.matrix_world = w
    bpy.data.objects.remove(old)
for m in [m for m in o.modifiers if m.type == "ARMATURE"]: o.modifiers.remove(m)
o.vertex_groups.clear()
arm = bpy.data.armatures.new("PigeonRig"); rig = bpy.data.objects.new("PigeonRig", arm)
o.users_collection[0].objects.link(rig)
rig.matrix_world = o.matrix_world.copy()
bpy.context.view_layer.objects.active = rig
for x in bpy.context.selected_objects: x.select_set(False)
rig.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")
B = {}
def bone(name, h, t, parent=None):
    b = arm.edit_bones.new(name); b.head = Vector(h); b.tail = Vector(t)
    if parent: b.parent = B[parent]; b.use_connect = False
    B[name] = b
bone("Root", (-0.005, 0, 0), (-0.005, 0, 0.05))
bone("Body", (-0.09, -0.05, 0.11), (0.03, 0.02, 0.15), "Root")
bone("Tail", (-0.09, -0.05, 0.11), (-0.23, -0.145, 0.10), "Body")
bone("Neck", (0.03, 0.02, 0.15), (0.055, 0.035, 0.225), "Body")
bone("Head", (0.055, 0.035, 0.225), (0.107, 0.064, 0.25), "Neck")
bpy.ops.object.mode_set(mode="OBJECT")
o.parent = rig; o.matrix_parent_inverse = rig.matrix_world.inverted()
for x in bpy.context.selected_objects: x.select_set(False)
o.select_set(True); rig.select_set(True); bpy.context.view_layer.objects.active = rig
bpy.ops.object.parent_set(type="ARMATURE_AUTO")
print({g.name: sum(1 for v in o.data.vertices for e in v.groups if e.group == g.index and e.weight > 0.1) for g in o.vertex_groups})
# legs and feet stay on the sill whatever the body does: everything below the belly belongs to Root
root = o.vertex_groups["Root"]
others = [g for g in o.vertex_groups if g.name != "Root"]
for v in o.data.vertices:
    if v.co.z < 0.075 and abs(v.co.x + 0.005) < 0.06 and abs(v.co.y) < 0.06:
        w = min(1.0, max(0.0, (0.075 - v.co.z) / 0.02))
        root.add([v.index], w, "REPLACE")
        for g in others:
            try:
                cur = g.weight(v.index); g.add([v.index], cur * (1 - w), "REPLACE")
            except RuntimeError: pass
for pb in rig.pose.bones: pb.rotation_mode = "XYZ"; pb.rotation_euler = (0, 0, 0)
