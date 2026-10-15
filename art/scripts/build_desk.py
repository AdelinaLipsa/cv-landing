exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
DZ = 0.75
C = "Interactive"
for p in ("Phone", "Printer", "Paper", "Rolodex", "Card", "NotePhone", "NotePrinter", "NoteRolodex", "Mug", "Steam", "MP3", "Earbud", "Coil"): kill(p)
beige = mat("BeigePlastic", "#E6DCC6", rough=0.42)
beige2 = mat("BeigeDark", "#C9BDA3", rough=0.5)
ink = mat("InkPlastic", "#26242E", rough=0.4)
smoke = mat("SmokedLid", "#3A3640", rough=0.15, coat=0.6)
cream = mat("PhoneCream", "#F1E6CF", rough=0.35)
keym = mat("Keys", "#FBF7EE", rough=0.3)
led = mat("LedGreen", "#5BE37D", rough=0.3, emit="#5BE37D", strength=6)
ledr = mat("LedAmber", "#F5B53F", rough=0.3, emit="#F5B53F", strength=4)

def group(name, loc, rz, parent=None):
    g = D.objects.new(name, None); bpy.context.scene.collection.objects.link(g); put(g, C)
    g.location = loc; g.rotation_euler = (0, 0, math.radians(rz)); g.empty_display_size = 0.08
    g.parent = parent
    return g

def wedge(name, w, d, h_front, h_back, m, parent, loc=(0, 0, 0), bevel=0.006):
    """Box whose top slopes from the front (-Y) edge up to the back (+Y) edge."""
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        x, y, z = v.co
        hz = h_front if y < 0 else h_back
        v.co = Vector((x * w, y * d, (z + 0.5) * hz))
    o = mesh_obj(name, bm); o.location = loc
    return finish(o, m, bevel=bevel, c=C, parent=parent)

# ---------- her mobile: a late-2000s QWERTY candybar (E71-style shape, no logo), lying flat, screen up, angled to the camera
ph = group("Phone", (-1.36, 0.22, DZ), 38)
graphite = mat("PhoneGraphite", "#2C2C33", rough=0.35, metal=0.3)
trim = mat("PhoneTrim", "#B9BCC2", rough=0.2, metal=1.0)
keyc = mat("PhoneKeys", "#1A1A1F", rough=0.4)
PW, PL, PT = 0.057, 0.114, 0.01
box("PhoneShell", (PW, PL, PT), (0, 0, PT / 2), graphite, bevel=0.004, c=C, parent=ph)
box("PhoneTrimBand", (PW + 0.0012, PL + 0.0012, 0.004), (0, 0, PT * 0.55), trim, bevel=0.002, c=C, parent=ph)
box("PhoneFace", (PW - 0.004, PL - 0.004, 0.001), (0, 0, PT + 0.0004), mat("PhoneFaceBlack", "#141418", rough=0.15, coat=0.6), bevel=0.0008, c=C, parent=ph)
for k, x in enumerate((-0.019, 0.019)):  # call / end keys and the d-pad between them
    box(f"PhoneSoftKey{k}", (0.012, 0.006, 0.0012), (x, 0.002, PT + 0.001), trim, bevel=0.001, c=C, parent=ph)
cyl("PhoneDpad", 0.0055, 0.0012, (0, 0.002, PT + 0.001), trim, c=C, parent=ph, verts=24)
for r in range(4):  # QWERTY: four rows of ten
    for i in range(10):
        if r == 3 and i in (3, 4, 5, 6):
            if i == 3: box("PhoneSpace", (0.017, 0.0055, 0.0012), (-0.0045 + 0.004, -0.044, PT + 0.001), keyc, bevel=0.0008, c=C, parent=ph)
            continue
        box(f"PhoneKey{r}{i}", (0.0042, 0.0055, 0.0012), (-0.0225 + i * 0.005, -0.012 - r * 0.0105, PT + 0.001), keyc, bevel=0.0008, c=C, parent=ph)
scr = planeuv("PhoneScreen", 0.045, 0.034, (0, 0.03, PT + 0.0011), (0, 0, 0), mat("PhoneScreenOff", "#08090C", rough=0.1), c=C, parent=ph)
empty("NotePhone", (0, 0.03, 0.04), parent=ph, c=C)
# ---------- Printer: a late-2000s consumer inkjet against the wall, front to the room. Paper goes in a tray
# at the back and slides out onto the output tray at the front, where PaperSlot is.
pr = group("Printer", (-1.56, 0.98, DZ), 90)
grey = mat("InkjetGrey", "#B9BBC0", rough=0.4)
dark = mat("InkjetBlack", "#232328", rough=0.3, coat=0.3)
paperm = mat("PaperWhite", "#F4F2EC", rough=0.9)
box("PrinterBody", (0.43, 0.24, 0.12), (0, 0, 0.065), grey, bevel=0.02, c=C, parent=pr)
box("PrinterBase", (0.41, 0.22, 0.012), (0, 0, 0.006), dark, bevel=0.004, c=C, parent=pr)
box("PrinterLid", (0.4, 0.17, 0.012), (0, 0.01, 0.126), dark, bevel=0.006, rot=(0.03, 0, 0), c=C, parent=pr)
box("PrinterFrontBand", (0.36, 0.004, 0.03), (0, -0.121, 0.055), dark, bevel=0.002, c=C, parent=pr)  # the output opening
box("PrinterSlotDark", (0.3, 0.002, 0.006), (0, -0.1235, 0.047), mat("SlotBlack", "#050506", rough=0.8), bevel=0, c=C, parent=pr)
box("PrinterOutTray", (0.3, 0.11, 0.006), (0, -0.17, 0.03), dark, bevel=0.002, rot=(-0.06, 0, 0), c=C, parent=pr)
box("PrinterOutExt", (0.22, 0.06, 0.004), (0, -0.245, 0.024), dark, bevel=0.0015, rot=(-0.06, 0, 0), c=C, parent=pr)
box("PrinterInTray", (0.3, 0.006, 0.17), (0, 0.13, 0.18), dark, bevel=0.003, rot=(-0.38, 0, 0), c=C, parent=pr)
box("PrinterPaperIn", (0.21, 0.003, 0.2), (0, 0.124, 0.19), paperm, bevel=0, rot=(-0.38, 0, 0), c=C, parent=pr)
for k in range(3):
    cyl(f"PrinterBtn{k}", 0.0065, 0.004, (0.155 - k * 0.025, -0.085, 0.127), mat("BtnGrey", "#55535C", rough=0.4), c=C, parent=pr, verts=16)
cyl("PrinterLed", 0.003, 0.002, (0.18, -0.085, 0.128), led, c=C, parent=pr, verts=12)
empty("PaperSlot", (0, -0.124, 0.05), parent=pr, c=C)   # the sheet slides out from here along local -Y (glTF +Z), lying flat
empty("NotePrinter", (0, 0, 0.22), parent=pr, c=C)
# ---------- the Siamese sits on wing A between phone and printer, under the lamp, facing the camera (built in code)
if "CatSpot" in D.objects: D.objects.remove(D.objects["CatSpot"], do_unlink=True)
cat = empty("CatSpot", (-1.29, 0.52, DZ), c=C, size=0.12)
cat.rotation_euler = (0, 0, math.radians(45))
# ---------- mug on wing B
P = "Props"
mugm = mat("MugNavy", "#2E2B6B", rough=0.25, coat=0.4)
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=32, radius1=0.04, radius2=0.042, depth=0.095)
mug = mesh_obj("Mug", bm); finish(mug, mugm, c=P)
so = mug.modifiers.new("Solid", "SOLIDIFY"); so.thickness = 0.005
cyl("MugBottom", 0.04, 0.006, (0, 0, -0.045), mugm, c=P, parent=mug)
cyl("MugCoffee", 0.037, 0.004, (0, 0, 0.03), mat("Coffee", "#2A170E", rough=0.1), c=P, parent=mug)
bpy.ops.mesh.primitive_torus_add(major_radius=0.025, minor_radius=0.0065, location=(0.048, 0, 0), rotation=(math.pi / 2, 0, 0))
h = bpy.context.view_layer.objects.active; h.name = "MugHandle"; finish(h, mugm, c=P, parent=mug); h.scale = (0.8, 1, 1.1)
mug.location = (-0.68, 1.3, DZ + 0.0475); mug.rotation_euler = (0, 0, math.radians(-120))
empty("SteamSpot", (-0.68, 1.3, DZ + 0.1), c=C)
# ---------- a generic late-2000s MP3 player with white earbuds, on wing B (no logos)
mp = D.objects.new("MP3Player", None); bpy.context.scene.collection.objects.link(mp); put(mp, P)
box("MP3Body", (0.045, 0.09, 0.009), (0, 0, 0.0045), mat("MP3Silver", "#B8BCC4", rough=0.25, metal=0.7), bevel=0.004, c=P, parent=mp)
box("MP3Screen", (0.036, 0.03, 0.001), (0, 0.022, 0.0092), mat("MP3Lcd", "#1C2A3A", rough=0.1, emit="#6FA8D8", strength=0.6), bevel=0, c=P, parent=mp)
cyl("MP3Wheel", 0.013, 0.001, (0, -0.017, 0.0092), mat("MP3Wheel", "#F2F1EE", rough=0.4), c=P, parent=mp, verts=32)
cyl("MP3Centre", 0.0045, 0.0012, (0, -0.017, 0.0095), mat("MP3Silver", "#B8BCC4", rough=0.25, metal=0.7), c=P, parent=mp, verts=20)
white = mat("EarbudWhite", "#F4F3EF", rough=0.35)
tube("EarbudCable", [(0, 0.045, 0.004), (0.02, 0.08, 0.003), (0.06, 0.07, 0.003), (0.07, 0.03, 0.003), (0.04, 0.0, 0.003), (0.075, -0.03, 0.003),
                     (0.1, 0.0, 0.003), (0.085, 0.05, 0.003), (0.11, 0.07, 0.006)], 0.0012, white, c=P, parent=mp)
tube("EarbudCable2", [(0.085, 0.05, 0.003), (0.06, 0.1, 0.003), (0.05, 0.12, 0.006)], 0.0012, white, c=P, parent=mp)
sphere("EarbudL", 0.008, (0.112, 0.074, 0.008), white, c=P, seg=16, ring=8, parent=mp)
sphere("EarbudR", 0.008, (0.048, 0.126, 0.008), white, c=P, seg=16, ring=8, parent=mp)
mp.location = (-1.02, 1.27, DZ); mp.rotation_euler = (0, 0, math.radians(20))
print("desk ok")
