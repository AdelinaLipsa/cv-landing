"""Fit the two rigged hands (hands.py) round the mug: each palm against the mug's side, fingers forward and curled
round toward the far side, index on top, the wrist where her jumper's sleeve ends. Then the export takes these
meshes in this pose (export_actors.py), with her sleeves, and leaves her character's mitten hands out."""
exec(open("/Users/adelinalipsa/Documents/GitHub/adelina-cv/art/scripts/lib.py").read())
from mathutils import Quaternion
P = {"BACK": 0.05, "OUT": 0.088, "DOWN": 0.008, "SCALE": 0.135, "CURL": (40, 48, 32), "THUMB": (6, 10, 8), "TILT": 12, **globals().get("HP", {})}
# start from a fresh import every run (the fit multiplies onto the hands' transforms)
if "Hands" in D.collections:
    for o in list(D.collections["Hands"].objects): D.objects.remove(o)
exec(open(ART + "/scripts/window/hands.py").read())
H = D.collections["Hands"]
# the download's own fist (its animation closes both hands by frame ~135): each finger joint's pose there is
# where that joint goes when the hand closes; a grip is that motion part of the way, finger by finger
bpy.context.scene.frame_set(P.get("FIST_FRAME", 135)); bpy.context.view_layer.update()
FIST = {a.name: {pb.name: pb.matrix_basis.copy() for pb in a.pose.bones} for a in H.objects if a.type == "ARMATURE"}
FIST_OF = {a.as_pointer(): FIST[a.name] for a in H.objects if a.type == "ARMATURE"}
bpy.context.scene.frame_set(1)
for o in H.objects:
    if o.animation_data: o.animation_data_clear()
for n in ("Icosphere", "Icosphere.001"):
    if n in D.objects: D.objects.remove(D.objects[n])
arms = [D.objects["Object_7"], D.objects["Object_60"]]
for a in arms:   # free the rigs from the control rig's empties
    mw = a.matrix_world.copy(); a.parent = None; a.matrix_world = mw
for o in list(H.objects):
    if o.type == "EMPTY": D.objects.remove(o)
# the mug: the hot chocolate if it's in (cocoa.py), else the room's navy one. Its outer radius by height is what
# fingers and palms may not cross.
if "CocoaMug" in D.objects or "Cocoa" in D.collections:
    exec(open(ART + "/scripts/window/cocoa.py").read())
    cm = D.objects["CocoaMug"]; BASE_Z = cm.location.z; HM = max(z for z, _ in PROFILE) + 0.005
    C = Vector((cm.location.x, cm.location.y, BASE_Z + HM / 2))
    def r_at(z):
        z -= BASE_Z
        if z < 0 or z > HM: return None
        return max([r for zz, r in PROFILE if abs(zz - z) <= 0.0075] + [0])
    HAS_BAR = True
else:
    mug = D.objects["Mug"]; C = mug.matrix_world.translation.copy()
    def r_at(z): return 0.042 * mug.scale.x if abs(z - C.z) < 0.0475 * mug.scale.z else None
    HAS_BAR = False
def gap(q, rf):
    """Clearance of a point (with a finger's radius rf) from the solid mug: its body, and its handle's bar."""
    g = 1.0; r = r_at(q.z)
    if r is not None: g = math.hypot(q.x - C.x, q.y - C.y) - (r + rf)
    if HAS_BAR:
        _, _, d = HANDLE_KD.find(q); g = min(g, d - rf)   # its surface points: a finger may come up to them
        top = BASE_Z + HM
        if top - 0.02 < q.z < top + 0.012 and math.hypot(q.x - C.x, q.y - C.y) < (r_at(top - 0.006) or 0.04) - 0.002:
            g = min(g, -(top + 0.012 - q.z))                         # no dipping into the hot chocolate
    return g
def wpos(a, b): return a.matrix_world @ a.pose.bones[b].head
def bn(a, key): return next(b.name for b in a.data.bones if b.name.startswith(key))
def frame(a):
    W = wpos(a, bn(a, "HANDPALM")); M = wpos(a, bn(a, "MIDDLE_F_BASE")); I = wpos(a, bn(a, "INDEX_BASE")); K = wpos(a, bn(a, "PINK_BASE"))
    F = (M - W).normalized(); A = (I - K); A = (A - F * A.dot(F)).normalized(); N = F.cross(A)
    tip = wpos(a, bn(a, "MIDDLE_F_UP_TOP"))
    if (tip - M).dot(N) < 0: N = -N
    return W, F, A, N, (M - W).length
for a in arms:
    for pb in a.pose.bones: pb.matrix_basis = Matrix.Identity(4)
bpy.context.view_layer.update()
fr = {a.name: frame(a) for a in arms}
# which model hand is her left: mapping (F, A, N) to (forward, up, +x palm) must keep handedness
def target(side):
    F1 = Vector((0.18 * side, 1.0, 0.12)).normalized()                 # fingers forward, a little in and up
    N1 = Vector((side, 0, 0)); N1 = (N1 - F1 * N1.dot(F1)).normalized()  # palm toward the mug
    A1 = N1.cross(F1).normalized()
    if A1.z < 0: A1 = -A1
    return F1, A1, N1
def det3(a, b, c): return a.dot(b.cross(c))
left = next(a for a in arms if (det3(*fr[a.name][1:4]) > 0) == (det3(*target(1)) > 0))
right = next(a for a in arms if a is not left)
for a_ in arms:
    W_, F_, A_, N_, L_ = fr[a_.name]
    print(a_.name, "det", round(det3(F_, A_, N_), 2), "F", [round(v, 2) for v in F_], "A", [round(v, 2) for v in A_], "N", [round(v, 2) for v in N_], "-> left" if a_ is left else "-> right")
print("target dets", round(det3(*target(1)), 2), round(det3(*target(-1)), 2))
ORIG = {left.name: left.name, right.name: right.name}
for a, side in ((left, 1), (right, -1)):
    fist = FIST[a.name]
    W0, F0, A0, N0, L0 = fr[a.name]
    F1, A1, N1 = target(side)
    R0 = Matrix((F0, A0, N0)).transposed(); R1 = Matrix((F1, A1, N1)).transposed()
    R = (R1 @ R0.inverted()).to_4x4() @ Matrix.Rotation(math.radians(P["TILT"] * side), 4, F0)
    s = P["SCALE"] * 0.6 / L0
    W1 = C + Vector((-side * P["OUT"], -P["BACK"], -P["DOWN"]))
    grip_bar = side == -1 and HAS_BAR
    if grip_bar:   # her right hand: fingers straight ahead, knuckles just right of the handle's bar
        F1 = Vector((-0.12, 1, -0.06)).normalized(); N1 = Vector((-1, 0, 0)); N1 = (N1 - F1 * N1.dot(F1)).normalized(); A1 = N1.cross(F1).normalized()
        if A1.z < 0: A1 = -A1
        R1 = Matrix((F1, A1, N1)).transposed()
        R = (R1 @ R0.inverted()).to_4x4() @ Matrix.Rotation(math.radians(P["TILT"] * side), 4, F0)
        knuck = Vector((BAR.x + BAR_R + P.get("RF", 0.0078) + 0.006, BAR.y - 0.004, (BAR_Z[0] + BAR_Z[1]) / 2 + 0.004))
        W1 = knuck - F1 * (P["SCALE"] * 0.6)
    a.matrix_world = Matrix.Translation(W1) @ R @ Matrix.Scale(s, 4) @ Matrix.Translation(-W0) @ a.matrix_world
    a.name = "HandL" if side == 1 else "HandR"
    bpy.context.view_layer.update()
    # palm to the mug: slide the hand (fingers still straight) out from the mug's axis until no point of it is inside
    def deepest(obj):
        dg = bpy.context.evaluated_depsgraph_get(); hm = obj.children[0].evaluated_get(dg); mw = hm.matrix_world; worst = -1.0
        for v in hm.data.vertices:
            worst = max(worst, -gap(mw @ v.co, 0.0015))
        return worst
    out = Vector((-side, 0, 0))
    for _ in range(0 if grip_bar else 12):   # in to touch, or out of it: the palm rests on the mug
        pen = deepest(a)
        if -0.002 < pen <= 0: break
        a.matrix_world = Matrix.Translation(out * (pen + 0.001)) @ a.matrix_world; bpy.context.view_layer.update()
    def clearance(q, rf): return gap(q, rf)
    def chain_of(key): return [a.pose.bones[bn(a, f"{key}_{seg}")] for seg in ("BASE", "MID", "TOP")]
    CUR = {}
    def close(bones, k):
        if bones: CUR[next(f for f in ("INDEX", "MIDDLE_F", "RING", "PINK", "THUMB") if bones[0].name.startswith(f))] = k
        for pb in bones:   # k < 0: past open, away from the palm (a thumb can swing out)
            q = fist[pb.name].to_quaternion()
            pb.matrix_basis = (Quaternion().slerp(q, k) if k >= 0 else Quaternion().slerp(q.inverted(), min(1.0, -k))).to_matrix().to_4x4()
        bpy.context.view_layer.update()
    def pts_of(key):
        chain = chain_of(key) + [a.pose.bones[bn(a, f"{key}_UP_TOP")]]; pts = []
        for b1, b2 in zip(chain, chain[1:]):
            h1, h2 = a.matrix_world @ b1.head, a.matrix_world @ b2.head
            pts += [h1.lerp(h2, t) for t in (0.25, 0.5, 0.75, 1.0)]
        return pts
    def touching(key, rf): return any(clearance(q, rf) < 0 for q in pts_of(key))
    FINGERS = ("INDEX", "MIDDLE_F", "RING", "PINK", "THUMB")
    if grip_bar:
        # her right hand by the handle, as it's held: palm toward the mug, index on top, index and middle straight
        # through the handle's hole (toward the far side), curled only until they touch; ring and pinky tucked
        # under the handle; the thumb on top of it
        for key in FINGERS: close(chain_of(key), 0.08)
        wpb = lambda n: a.matrix_world @ a.pose.bones[bn(a, n)].head
        def put(dv): a.matrix_world = Matrix.Translation(dv) @ a.matrix_world; bpy.context.view_layer.update()
        # aim by the fingers themselves: the middle finger points straight through the hole (toward the far side),
        # then roll about that line so the index sits right above the middle finger
        # straight through the hole, along its axis (the handle is turned a little away from her, so the fingers
        # angle in and her forearm comes back toward her right shoulder)
        want_d = Vector(P["RIGHT_AIM"]).normalized() if "RIGHT_AIM" in P else Vector((-radial.y, radial.x, 0)).normalized()
        pv = wpb("MIDDLE_F_BASE"); fd = (wpb("MIDDLE_F_UP_TOP") - pv).normalized()
        q = fd.rotation_difference(want_d)
        a.matrix_world = Matrix.Translation(pv) @ q.to_matrix().to_4x4() @ Matrix.Translation(-pv) @ a.matrix_world; bpy.context.view_layer.update()
        up_v = wpb("INDEX_BASE") - wpb("MIDDLE_F_BASE"); up_v = (up_v - want_d * up_v.dot(want_d)).normalized()
        z_v = Vector((0, 0, 1)); z_v = (z_v - want_d * z_v.dot(want_d)).normalized()
        roll = math.atan2(up_v.cross(z_v).dot(want_d), up_v.dot(z_v))
        pv = wpb("MIDDLE_F_BASE")
        a.matrix_world = Matrix.Translation(pv) @ Matrix.Rotation(roll, 4, want_d) @ Matrix.Translation(-pv) @ a.matrix_world; bpy.context.view_layer.update()
        # index and middle knuckles: just in front of the hole, at its height, the pair centred on it
        pair = (wpb("INDEX_BASE") + wpb("MIDDLE_F_BASE")) / 2
        put(HOLE - want_d * 0.085 + Vector((0, 0, 0.002)) - pair)   # well in front: the slide threads it
        def explain(tag):
            for k_ in ("INDEX", "MIDDLE_F"):
                pts = pts_of(k_)
                hb = min(HANDLE_KD.find(q_)[2] - 0.0072 for q_ in pts)
                bd = min([math.hypot(q_.x - C.x, q_.y - C.y) - ((r_at(q_.z) or 0) + 0.0072) for q_ in pts if r_at(q_.z)] + [1])
                print(tag, k_, "handle clearance %.1f mm, body clearance %.1f mm" % (hb * 1000, bd * 1000),
                      "base", [round(v, 3) for v in pts[0]], "tip", [round(v, 3) for v in pts[-1]])
        explain("start")
        # slide forward until the two fingers' middle joints are through the hole, as long as nothing enters the mug
        clear = lambda keys: all(gap(q_, 0.0072) >= 0 for k_ in keys for q_ in pts_of(k_))
        for _ in range(60):
            if (wpb("MIDDLE_F_MID") - HOLE).dot(want_d) > 0.012: break
            put(want_d * 0.002)
            if not clear(("INDEX", "MIDDLE_F")):
                put(want_d * -0.002)
                # nudge sideways/up-down to thread the hole, best clearance wins
                best_ = None
                for dx in (-0.008, -0.006, -0.004, -0.002, 0, 0.002, 0.004, 0.006, 0.008):
                    for dz in (-0.008, -0.006, -0.004, -0.002, 0, 0.002, 0.004, 0.006, 0.008):
                        put(Vector((dx, 0, dz)) + want_d * 0.002)
                        if clear(("INDEX", "MIDDLE_F")):
                            mg = min(gap(q_, 0.0072) for k_ in ("INDEX", "MIDDLE_F") for q_ in pts_of(k_))
                            if best_ is None or mg > best_[0]: best_ = (mg, dx, dz)
                        put(-Vector((dx, 0, dz)) - want_d * 0.002)
                if not best_: break
                put(Vector((best_[1], 0, best_[2])) + want_d * 0.002)
        print("right hand: middle finger's mid joint %.1f mm past the hole" % ((wpb("MIDDLE_F_MID") - HOLE).dot(want_d) * 1000))
        # index and middle curl until they touch (the mug's body or the handle); ring and pinky tuck under it
        for key in FINGERS:
            if key == "THUMB": continue
            rf = 0.0072; bones = chain_of(key); lo, hi = CUR.get(key, 0.08), (0.75 if key in ("INDEX", "MIDDLE_F") else 1.0)
            close(bones, hi)
            if any(gap(q_, rf) < 0 for q_ in pts_of(key)):
                for _ in range(10):
                    m = (lo + hi) / 2; close(bones, m)
                    if any(gap(q_, rf) < 0 for q_ in pts_of(key)): hi = m
                    else: lo = m
                close(bones, lo)
        print("right hand curls", {k: round(v, 2) for k, v in CUR.items()})
    else:
        # her left hand round the mug's body: its fingers close until the curve through palm, knuckle and fingertip
        # is the mug's size, then that curve is centred on the mug's axis (palm on the mug's left), so palm and
        # fingers lie round the mug together
        def circumcentre(p1, p2, p3):
            u, v = p2 - p1, p3 - p1; w = u.cross(v)
            return p1 + (w.cross(u) * v.length_squared + v.cross(w) * u.length_squared) / (2 * w.length_squared)
        wp_ = lambda n: a.matrix_world @ a.pose.bones[bn(a, n)].head
        def curve():
            pm = wp_("HANDPALM").lerp(wp_("MIDDLE_F_BASE"), 0.55)
            c = circumcentre(pm, wp_("MIDDLE_F_BASE"), wp_("MIDDLE_F_UP_TOP"))
            return c, (pm - c).length, pm
        zc = C.z
        want = (r_at(zc) or 0.04) + P.get("PALM_OFF", 0.024)   # the palm is thicker than a finger
        best = None
        for i in range(5, 96, 3):
            k = i / 100
            for key in FINGERS: close(chain_of(key), k if key != "THUMB" else min(k, 0.35))
            c, r, pm = curve()
            if best is None or abs(r - want) < best[0]: best = (abs(r - want), k)
        k = best[1]
        for key in FINGERS: close(chain_of(key), k if key != "THUMB" else min(k, 0.35))
        c, r, pm = curve()
        # stand the curve upright: its plane horizontal (the fingers wrap round the mug, not over it), index on top
        n = (wp_("MIDDLE_F_BASE") - pm).cross(wp_("MIDDLE_F_UP_TOP") - pm).normalized()
        a.matrix_world = Matrix.Translation(c) @ n.rotation_difference(Vector((0, 0, 1))).to_matrix().to_4x4() @ Matrix.Translation(-c) @ a.matrix_world
        bpy.context.view_layer.update()
        if wp_("INDEX_BASE").z < wp_("PINK_BASE").z:
            c, r, pm = curve()
            a.matrix_world = Matrix.Translation(c) @ Matrix.Rotation(math.pi, 4, (pm - c).normalized()) @ Matrix.Translation(-c) @ a.matrix_world
            bpy.context.view_layer.update()
        c, r, pm = curve()
        # turn the hand about the vertical through the mug's axis to where its forearm points back at her left
        # shoulder (her arm comes up from below her view, not in from the side); the palm stays on the mug
        a.matrix_world = Matrix.Translation(Vector((C.x - c.x, C.y - c.y, zc - c.z))) @ a.matrix_world; bpy.context.view_layer.update()
        SHOULDER = Vector(P.get("SHOULDER_L", (-0.24, -0.66, 1.12)))
        axis_p = Vector((C.x, C.y, zc)); base_mw = a.matrix_world.copy(); best = None
        for deg in range(0, 360, 4):
            a.matrix_world = Matrix.Translation(axis_p) @ Matrix.Rotation(math.radians(deg), 4, "Z") @ Matrix.Translation(-axis_p) @ base_mw
            bpy.context.view_layer.update()
            w_ = wp_("HANDPALM"); r_ = wp_("Root_joint")
            fore = (r_ - w_).normalized(); to_sh = (SHOULDER - w_).normalized()
            score = fore.dot(to_sh)
            if best is None or score > best[0]: best = (score, deg)
        a.matrix_world = Matrix.Translation(axis_p) @ Matrix.Rotation(math.radians(best[1]), 4, "Z") @ Matrix.Translation(-axis_p) @ base_mw
        bpy.context.view_layer.update()
        print("left hand turned round the mug %d deg: forearm toward her shoulder (%.2f)" % (best[1], best[0]))
        print("left hand: closed to %.2f, curve radius %.1f mm for a %.1f mm mug" % (k, r * 1000, (r_at(zc) or 0.04) * 1000))
    # the thumb rests where a thumb would: right one along the top of the handle, pointing at the mug; left one on
    # the near side of the mug. Its base turns to aim the thumb there; it stops short of touching.
    tb = a.pose.bones[bn(a, "THUMB_BASE")]; tt = a.pose.bones[bn(a, "THUMB_UP_TOP")]
    if grip_bar: close([a.pose.bones[bn(a, "THUMB_MID")], a.pose.bones[bn(a, "THUMB_TOP")]], 0.15)
    if grip_bar:
        goal = Vector((C.x + (BAR.x - C.x) * 0.6, C.y + (BAR.y - C.y) * 0.6, BAR_Z[1] + 0.006))     # on the handle's top
    if False:
        ang = math.radians(P.get("LTHUMB_AT", 250)); rr = (r_at(C.z + 0.02) or 0.04) + 0.016
        goal = Vector((C.x + math.cos(ang) * rr, C.y + math.sin(ang) * rr, C.z + 0.02))                  # mug's near side
    for _ in range(3 if grip_bar else 0):
        h = a.matrix_world @ tb.head; tip = a.matrix_world @ tt.head
        q = (tip - h).normalized().rotation_difference((goal - h).normalized())
        M = a.matrix_world @ tb.matrix
        tb.matrix = a.matrix_world.inverted() @ (Matrix.Translation(h) @ q.to_matrix().to_4x4() @ Matrix.Translation(-h) @ M)
        bpy.context.view_layer.update()
    steps = 0
    while grip_bar and any(gap(q_, 0.0088) < 0 for q_ in pts_of("THUMB")) and steps < 30:   # back off, away from the mug
        h = a.matrix_world @ tb.head; away = Vector((h.x - C.x, h.y - C.y, 0)).normalized()
        goal = goal + away * 0.002; steps += 1   # outward only: a thumb that rises reads as a thumbs-up
        tip = a.matrix_world @ tt.head
        q = (tip - h).normalized().rotation_difference((goal - h).normalized())
        M = a.matrix_world @ tb.matrix
        tb.matrix = a.matrix_world.inverted() @ (Matrix.Translation(h) @ q.to_matrix().to_4x4() @ Matrix.Translation(-h) @ M)
        bpy.context.view_layer.update()
    if grip_bar: CUR["THUMB"] = 0.15
    if not grip_bar:
        # left thumb out of the mug: try directions for its base (about the vertical and about a level axis) against
        # its actual skin, keep the one with no point inside, closest to where it rests now
        mesh_ = a.children[0]; gidx = {g.index: g.name for g in mesh_.vertex_groups}
        tv = [v.index for v in mesh_.data.vertices if v.groups and gidx[max(v.groups, key=lambda e: e.weight).group].startswith("THUMB")]
        tb_ = a.pose.bones[bn(a, "THUMB_BASE")]; M0 = a.matrix_world @ tb_.matrix; h0 = M0.translation.copy()
        lvl = Vector((h0.x - C.x, h0.y - C.y, 0)).normalized().cross(Vector((0, 0, 1)))
        def inside_count():
            dg = bpy.context.evaluated_depsgraph_get(); hm_ = mesh_.evaluated_get(dg); mw_ = hm_.matrix_world
            return sum(1 for i in tv if gap(mw_ @ hm_.data.vertices[i].co, 0.0008) < 0)
        best = None
        for yaw in range(0, 181, 10):
            for sy in ((1, -1) if yaw else (1,)):
                for pitch in range(0, 121, 10):
                    for sp in ((1, -1) if pitch else (1,)):
                        R_ = Matrix.Rotation(math.radians(yaw * sy), 4, "Z") @ Matrix.Rotation(math.radians(pitch * sp), 4, lvl)
                        tb_.matrix = a.matrix_world.inverted() @ (Matrix.Translation(h0) @ R_ @ Matrix.Translation(-h0) @ M0)
                        bpy.context.view_layer.update()
                        n_in = inside_count()
                        tipz = (a.matrix_world @ a.pose.bones[bn(a, "THUMB_UP_TOP")].head).z
                        key_ = (n_in, round(tipz, 3), yaw + pitch)   # clear of the mug first, then lying as low as it can
                        if best is None or key_ < best[0]: best = (key_, yaw * sy, pitch * sp)
                        if n_in == 0 and yaw + pitch <= (best[0][1] if best else 999): pass
        R_ = Matrix.Rotation(math.radians(best[1]), 4, "Z") @ Matrix.Rotation(math.radians(best[2]), 4, lvl)
        tb_.matrix = a.matrix_world.inverted() @ (Matrix.Translation(h0) @ R_ @ Matrix.Translation(-h0) @ M0)
        bpy.context.view_layer.update()
        print("left thumb turned", best[1], best[2], "points inside:", best[0][0])
    # last pass, point by point: any point of the hand inside the mug opens the finger it belongs to a little
    # (or, for the palm, moves the hand out a millimetre), until none is inside
    mesh = a.children[0]; groups = {g.index: g.name for g in mesh.vertex_groups}
    def finger_of(bone):
        return next((f for f in ("INDEX", "MIDDLE_F", "RING", "PINK", "THUMB") if bone.startswith(f)), None)
    for _ in range(70):
        dg = bpy.context.evaluated_depsgraph_get(); hm = mesh.evaluated_get(dg); mw = hm.matrix_world
        bad = {}
        for v, vv in zip(hm.data.vertices, mesh.data.vertices):
            if gap(mw @ v.co, 0.0005) < 0 and vv.groups:
                g = max(vv.groups, key=lambda e: e.weight); f = finger_of(groups.get(g.group, "")) or "PALM"
                bad[f] = bad.get(f, 0) + 1
        if not bad: break
        for f in bad:
            if False:
                away = (a.matrix_world @ a.pose.bones[bn(a, "HANDPALM")].head) - Vector((C.x, C.y, 0)); away.z = 0
                a.matrix_world = Matrix.Translation(away.normalized() * 0.0015) @ a.matrix_world
                continue
            if f == "THUMB" and not grip_bar:   # keep the thumb's direction: turn its base a little away from the mug
                tb_ = a.pose.bones[bn(a, "THUMB_BASE")]; Mt = a.matrix_world @ tb_.matrix; ht = Mt.translation.copy()
                tip_ = a.matrix_world @ a.pose.bones[bn(a, "THUMB_UP_TOP")].head
                out_ = Vector((tip_.x - C.x, tip_.y - C.y, 0)).normalized()
                ax_ = (tip_ - ht).normalized().cross(out_).normalized()
                tb_.matrix = a.matrix_world.inverted() @ (Matrix.Translation(ht) @ Matrix.Rotation(math.radians(-3), 4, ax_) @ Matrix.Translation(-ht) @ Mt)
                continue
            floor = -0.8 if f == "THUMB" else 0.0
            if f == "PALM" or CUR.get(f, 0) <= floor:
                away = (a.matrix_world @ a.pose.bones[bn(a, "HANDPALM")].head) - Vector((C.x, C.y, 0)); away.z = 0
                a.matrix_world = Matrix.Translation(away.normalized() * 0.001) @ a.matrix_world
            else:
                close(chain_of(f), max(floor, CUR[f] - 0.04))
        bpy.context.view_layer.update()
    if bad: print(a.name, "still inside after the pass:", bad, "CUR", {k: round(v, 2) for k, v in CUR.items()})
    print(a.name, "after curl, deepest point inside the mug:", round(max(0, deepest(a)) * 1000, 1), "mm")
for a in arms:
    for ch in a.children: ch.name = a.name + "Mesh"
print("hands posed", left.name, right.name)
# one skin for both (the download's two hands differ)
skin = D.objects["HandRMesh"].data.materials[0] if D.objects["HandRMesh"].data.materials else None
lm = D.objects["HandLMesh"].data
if skin: lm.materials.clear(); lm.materials.append(skin)
for m in {s_.material for h in ("HandLMesh", "HandRMesh") for s_ in D.objects[h].material_slots if s_.material}:
    m.blend_method = "OPAQUE" if hasattr(m, "blend_method") else None   # the download's skin carries an alpha: hands are solid
    try: m.surface_render_method = "DITHERED"
    except Exception: pass
    b = bsdf_of(m); b.inputs["Alpha"].default_value = 1.0
    for l in list(m.node_tree.links):
        if l.to_socket == b.inputs["Normal"]: m.node_tree.links.remove(l)
    for l in list(m.node_tree.links):
        if l.to_socket == b.inputs["Alpha"]: m.node_tree.links.remove(l)
# her jumper's sleeves end where these forearms start: her character's IK hands go to each forearm's root,
# so the cut end of the download's forearm sits inside the cuff (her mitten hands are hidden, not exported)
rig = D.objects["Her_Rig"]
# her toy arms are short: bring her body in under the mug until her shoulders are a forearm and a bit behind the
# wrists, then let the IK stretch the last bit so each cuff closes round its wrist (her head is never drawn)
wr = [D.objects[h].matrix_world @ D.objects[h].pose.bones[bn(D.objects[h], "Root_joint")].head for h in ("HandL", "HandR")]
mid = (wr[0] + wr[1]) / 2
sh = [rig.matrix_world @ rig.pose.bones[f"upper_arm_parent.{x}"].head for x in ("L", "R")]
reach = sum((rig.matrix_world.to_3x3() @ (b.tail - b.head)).length for b in (rig.pose.bones["upper_arm_fk.L"], rig.pose.bones["forearm_fk.L"]))
want = mid + Vector((0, -P.get("BODY_BACK", 0.62) * reach, -P.get("BODY_DOWN", 0.2)))
rig.location += want - (sh[0] + sh[1]) / 2
bpy.context.view_layer.update()
for x in ("L", "R"): rig.pose.bones[f"upper_arm_parent.{x}"]["IK_Stretch"] = 1.0
for side, hand in (("L", D.objects["HandL"]), ("R", D.objects["HandR"])):
    root = hand.matrix_world @ hand.pose.bones[bn(hand, "Root_joint")].head
    wrist = hand.matrix_world @ hand.pose.bones[bn(hand, "HANDPALM")].head
    ik = rig.pose.bones[f"hand_ik.{side}"]
    m = rig.matrix_world.inverted() @ Matrix.Translation(root.lerp(wrist, P.get("CUFF", 1.0)))   # her wrist on the hand's: the sleeve swallows the download's forearm
    ik.matrix = m @ ik.matrix.to_quaternion().to_matrix().to_4x4()
    bpy.context.view_layer.update()
for n in ("Body.001",):
    D.objects[n].hide_render = True; D.objects[n].hide_set(True)
for o in D.objects:
    if o.name.startswith(("Finger", "Thumb")): D.objects.remove(o)
