"""Step 5: swap every baked mesh to a plain base-colour material showing its atlas, export the GLB, then
revert the .blend (the swap is export-only). Run from the baked room.blend."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
OUT = "/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/bake/room_raw.glb"
GROUPS = {
    "Shell": ["Room_Shell", "Glow_Bulbs", "Glow_Window"],
    "Furniture": ["Room_Furniture"],
    "Props": ["Room_Props", "Plant", "Glow_Lamp"],
    "Gloves": ["Gloves"],
    "Interactive": ["PhoneBody", "PhoneScreen", "PrinterBody", "Screen", "Tower", "TowerLED", "ChairSeat", "ChairBase", "ChairWheel0", "ChairWheel1", "ChairWheel2", "ChairWheel3", "ChairWheel4"],
}
FLAT_UV = {"Screen", "PhoneScreen"}   # keep their 0-1 UVs as TEXCOORD_0 for the live pictures; the bake is TEXCOORD_1
NODES = ["Phone", "Printer", "PaperSlot", "NoteScreen", "CatSpot", "CatSpot2", "CharacterSpot", "NotePhone", "NotePrinter",
         "SteamSpot", "WindowGlass", "Monitor", "View", "LightShaft", "Chair", "ShadowFloor", "ShadowBed", "PathBed", "PathDesk", "ChairAtDesk", "ChairRest", "GlovesShadow"]
bpy.ops.wm.save_mainfile()
blend = D.filepath
export = []
for g, names in GROUPS.items():
    m = D.materials.new("Baked_" + g); m.use_nodes = True; nt = m.node_tree; b = bsdf_of(m)
    b.inputs["Roughness"].default_value = 1.0; b.inputs["Metallic"].default_value = 0.0
    tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = D.images.load(ART + f"/bake/bake_{g.lower()}.png", check_existing=True)
    uvn = nt.nodes.new("ShaderNodeUVMap"); uvn.uv_map = "Lightmap"
    nt.links.new(uvn.outputs["UV"], tex.inputs["Vector"]); nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    for n in names:
        o = D.objects[n]
        o.data.materials.clear(); o.data.materials.append(m)
        uvs = o.data.uv_layers
        if n not in FLAT_UV and "UVMap" in uvs: uvs.remove(uvs["UVMap"])
        for ca in list(o.data.color_attributes): o.data.color_attributes.remove(ca)
        m.use_backface_culling = True
        export.append(o)
for n in ("ShadowFloor", "ShadowBed"): D.objects[n].hide_render = False
ls = D.objects["LightShaft"]
ls.data.materials.clear(); ls.data.materials.append(mat("LightShaft", "#FFB070", rough=1.0))
for o in D.objects: o.select_set(False)
for o in export + [D.objects[n] for n in NODES]: o.hide_set(False)
for o in export + [D.objects[n] for n in NODES]: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_yup=True, export_apply=True,
                          export_cameras=True, export_lights=False, export_texcoords=True, export_normals=False,
                          export_tangents=False, export_animations=False, export_materials="EXPORT", export_image_format="AUTO", export_extras=False)
print("exported", OUT)
bpy.ops.wm.open_mainfile(filepath=blend)
