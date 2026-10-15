"""Step 4: denoise a baked float atlas with OIDN in the compositor and save it with the scene's view
transform (AgX, Medium Low Contrast), so the PNG holds exactly the graded colours the preview shows."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
sc = bpy.context.scene
def denoise_save(img_name, out_path):
    img = D.images[img_name]
    ng = D.node_groups.get("BakeDenoise") or D.node_groups.new("BakeDenoise", "CompositorNodeTree")
    ng.nodes.clear()
    if not ng.interface.items_tree:
        ng.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    i = ng.nodes.new("CompositorNodeImage"); i.image = img
    dn = ng.nodes.new("CompositorNodeDenoise")
    out = ng.nodes.new("NodeGroupOutput")
    ng.links.new(i.outputs["Image"], dn.inputs["Image"]); ng.links.new(dn.outputs["Image"], out.inputs[0])
    old = (sc.compositing_node_group, sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage, sc.render.film_transparent, sc.render.use_compositing)
    sc.compositing_node_group = ng
    sc.render.resolution_x, sc.render.resolution_y = img.size; sc.render.resolution_percentage = 100
    sc.render.film_transparent = False; sc.render.use_compositing = True
    sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGB"; sc.render.image_settings.color_depth = "8"
    bpy.ops.render.render()
    D.images["Render Result"].save_render(out_path, scene=sc)
    (sc.compositing_node_group, sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage, sc.render.film_transparent, sc.render.use_compositing) = old
    print("saved", out_path)
