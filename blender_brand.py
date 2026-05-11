"""
═══════════════════════════════════════════════════════════════════════
 CONEXINFINITY — BRAND 3D · v3 (orientação corrigida, modifiers em vez de bevel_depth)
═══════════════════════════════════════════════════════════════════════

CORREÇÕES v3 (vs v2):
  - Trocou curve.bevel_depth por Solidify + Bevel MODIFIERS (mais robusto)
  - Marca fica EM PÉ (rotacionada 90° X) facing camera
  - Animação: flutuação + wobble sutil (mantém face visível) em vez de
    rotação Z completa (que mostrava a fita de lado metade do tempo)
  - Força splines fechadas explicitamente
  - Câmera reposicionada pra view face-on

Como rodar:
  1. File → New → General (apaga tudo)
  2. Aba Scripting
  3. Text Editor (painel grande do meio): Open → blender_brand.py
  4. Text → Reload se já estava aberto
  5. ▶ Run Script (ou Alt+P)
═══════════════════════════════════════════════════════════════════════
"""

import bpy
import os
from math import pi, radians
from mathutils import Vector

# ─── CONFIGURAÇÃO ───────────────────────────────────────────────────────
SITE_DIR = r"C:\Users\GESTAO VALOR\Desktop\Site"
SVG_PATH = os.path.join(SITE_DIR, "logo", "conexInfinity", "Conex Infinity - Simbolo.svg")
OUTPUT_GLB = os.path.join(SITE_DIR, "brand-3d.glb")

TARGET_WIDTH = 3.5
RIBBON_THICKNESS = 0.16     # Solidify thickness
RIBBON_BEVEL_W = 0.035      # Bevel width (rounded edges)
DOT_RADIUS = 0.20
ANIM_FRAMES = 240
FLOAT_AMP = 0.18            # amplitude vertical
WOBBLE_AMP = radians(8)     # amplitude de wobble (graus)


# ─── HELPERS ────────────────────────────────────────────────────────────
def hex_to_rgb(h, a=1.0):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4))
    def s2l(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (s2l(r), s2l(g), s2l(b), a)


def safe_set(bsdf, names, val):
    for n in names:
        if n in bsdf.inputs:
            bsdf.inputs[n].default_value = val
            return True
    return False


# ─── 1. LIMPEZA ─────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("CONEXINFINITY BRAND 3D — v3")
print("=" * 60)
print("\n[1/9] Limpando cena...")

for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
for coll in list(bpy.data.collections):
    if not coll.objects and not coll.children:
        bpy.data.collections.remove(coll)
for col_type in (bpy.data.meshes, bpy.data.materials, bpy.data.lights,
                 bpy.data.cameras, bpy.data.curves, bpy.data.actions,
                 bpy.data.images, bpy.data.textures, bpy.data.collections):
    for it in list(col_type):
        if it.users == 0:
            try: col_type.remove(it)
            except (ReferenceError, RuntimeError): pass


# ─── 2. IMPORTAR SVG ───────────────────────────────────────────────────
print(f"[2/9] Importando SVG...")
if not os.path.exists(SVG_PATH):
    raise FileNotFoundError(SVG_PATH)

bpy.ops.import_curve.svg(filepath=SVG_PATH)
curves = [o for o in bpy.data.objects if o.type == 'CURVE']
print(f"   → {len(curves)} curve(s) importadas")

# Move pra Master Collection
master = bpy.context.scene.collection
for c in curves:
    for col in list(c.users_collection):
        col.objects.unlink(c)
    master.objects.link(c)
for coll in list(bpy.data.collections):
    if not coll.objects and not coll.children:
        bpy.data.collections.remove(coll)


# ─── 3. ESCALA + CENTRO ─────────────────────────────────────────────────
print("[3/9] Escalando e centralizando...")

def wbbox(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return mn, mx

mn, mx = wbbox(curves)
width = max(mx.x - mn.x, 0.001)
center = (mn + mx) * 0.5
factor = TARGET_WIDTH / width

for c in curves:
    c.location -= center
    c.location *= factor
    c.scale *= factor

bpy.ops.object.select_all(action='DESELECT')
for c in curves:
    c.select_set(True)
bpy.context.view_layer.objects.active = curves[0]
try:
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
except RuntimeError as e:
    print(f"   ⚠ transform_apply: {e}")


# ─── 4. IDENTIFICAR FITA vs PONTO ──────────────────────────────────────
curves.sort(key=lambda o: o.dimensions.x * o.dimensions.y, reverse=True)
ribbon_curve = curves[0]
dot_curve = curves[1] if len(curves) > 1 else None
ribbon_curve.name = "InfinityRibbon"
print(f"[4/9] Fita: {ribbon_curve.dimensions.x:.2f} × {ribbon_curve.dimensions.y:.2f}")


# ─── 5. PREPARAR CURVE PARA EXTRUSÃO LIMPA ─────────────────────────────
print("[5/9] Preparando curve (2D, splines fechadas)...")

# CRÍTICO: 2D + fill BOTH + splines fechadas EXPLICITAMENTE
ribbon_curve.data.dimensions = '2D'
ribbon_curve.data.fill_mode = 'BOTH'
ribbon_curve.data.use_fill_caps = True
ribbon_curve.data.resolution_u = 16

# Força todas as splines como cíclicas (fechadas)
for spline in ribbon_curve.data.splines:
    spline.use_cyclic_u = True

# NÃO usar bevel_depth (causa tubo). NÃO usar extrude aqui.
ribbon_curve.data.extrude = 0
ribbon_curve.data.bevel_depth = 0


# ─── 6. CONVERTER PARA MESH E APLICAR MODIFIERS ────────────────────────
print("[6/9] Convertendo curve → mesh + Solidify + Bevel...")

bpy.ops.object.select_all(action='DESELECT')
ribbon_curve.select_set(True)
bpy.context.view_layer.objects.active = ribbon_curve
bpy.ops.object.convert(target='MESH')
ribbon = bpy.context.view_layer.objects.active
ribbon.name = "InfinityRibbon"

# Solidify: dá espessura uniforme
solid = ribbon.modifiers.new("Solidify", 'SOLIDIFY')
solid.thickness = RIBBON_THICKNESS
solid.offset = 0  # extrude simétrica (frente + trás)

# Bevel: arredonda as bordas
bev = ribbon.modifiers.new("Bevel", 'BEVEL')
bev.width = RIBBON_BEVEL_W
bev.segments = 4
bev.limit_method = 'ANGLE'
bev.angle_limit = radians(35)

# Aplica modifiers (bake into mesh)
bpy.ops.object.modifier_apply(modifier="Solidify")
bpy.ops.object.modifier_apply(modifier="Bevel")

# Smooth shading + edge split pra sombrear bem
for poly in ribbon.data.polygons:
    poly.use_smooth = True
es = ribbon.modifiers.new("EdgeSplit", 'EDGE_SPLIT')
es.split_angle = radians(40)
bpy.ops.object.modifier_apply(modifier="EdgeSplit")


# ─── 7. PONTO AZUL ──────────────────────────────────────────────────────
print("[7/9] Esfera azul...")

if dot_curve:
    dc_pts = [dot_curve.matrix_world @ Vector(c) for c in dot_curve.bound_box]
    dot_center = sum(dc_pts, Vector()) / 8
    bpy.data.objects.remove(dot_curve, do_unlink=True)
else:
    dot_center = Vector((-0.6, 0.55, 0))

# Coloca o ponto à frente da fita (no eixo Z, será à frente após rotação)
dot_center.z = RIBBON_THICKNESS * 0.55

bpy.ops.mesh.primitive_uv_sphere_add(
    radius=DOT_RADIUS, segments=48, ring_count=24, location=dot_center
)
dot = bpy.context.object
dot.name = "BrandDot"
bpy.ops.object.shade_smooth()


# ─── 8. MATERIAIS ──────────────────────────────────────────────────────
print("[8/9] Materiais...")

mat_r = bpy.data.materials.new("RibbonMaterial")
mat_r.use_nodes = True
b = mat_r.node_tree.nodes["Principled BSDF"]
safe_set(b, ["Base Color"], hex_to_rgb("#0A0F1C"))
safe_set(b, ["Metallic"], 0.95)
safe_set(b, ["Roughness"], 0.18)
safe_set(b, ["Coat Weight", "Clearcoat", "Coat"], 0.7)
safe_set(b, ["Coat Roughness", "Clearcoat Roughness"], 0.1)
ribbon.data.materials.clear()
ribbon.data.materials.append(mat_r)

mat_d = bpy.data.materials.new("DotMaterial")
mat_d.use_nodes = True
b2 = mat_d.node_tree.nodes["Principled BSDF"]
safe_set(b2, ["Base Color"], hex_to_rgb("#1520BF"))
safe_set(b2, ["Metallic"], 0.5)
safe_set(b2, ["Roughness"], 0.2)
safe_set(b2, ["Emission Color", "Emission"], hex_to_rgb("#4D5CFF"))
safe_set(b2, ["Emission Strength"], 4.5)
dot.data.materials.clear()
dot.data.materials.append(mat_d)


# ─── 9. PARENT + ROTAÇÃO + ANIMAÇÃO ────────────────────────────────────
print("[9/9] Parent + orientação + animação...")

bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
root = bpy.context.object
root.name = "BrandRoot"

# Parenta ribbon + dot
bpy.ops.object.select_all(action='DESELECT')
ribbon.select_set(True)
dot.select_set(True)
bpy.context.view_layer.objects.active = root
root.select_set(True)
bpy.ops.object.parent_set(type='OBJECT', keep_transform=True)

# ► ROTACIONA A MARCA PRA FICAR EM PÉ (face-on pro espectador)
# Marca estava em XY plane (deitada). Rotacionar 90° X = stand up
root.rotation_euler = (radians(90), 0, 0)

# Frame range
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = ANIM_FRAMES

# Animação: flutuação + wobble sutil (sem rotação completa)
# Mantém a face da marca SEMPRE visível pro espectador

# Posição Y (vai e volta lentamente)
for pct, y in [(0.0, 0), (0.25, FLOAT_AMP), (0.5, 0), (0.75, -FLOAT_AMP), (1.0, 0)]:
    frame = max(1, int(ANIM_FRAMES * pct))
    root.location = (0, y, 0)
    root.keyframe_insert(data_path="location", index=1, frame=frame)

# Wobble: rotação Y leve (gira como um cartão pendurado no vento)
for pct, ry in [(0.0, 0), (0.25, WOBBLE_AMP), (0.5, 0), (0.75, -WOBBLE_AMP), (1.0, 0)]:
    frame = max(1, int(ANIM_FRAMES * pct))
    root.rotation_euler = (radians(90), ry, 0)  # mantém X=90 sempre
    root.keyframe_insert(data_path="rotation_euler", index=1, frame=frame)

# Volta pra frame 1 pro viewport mostrar o resting state
scene.frame_set(1)


# ─── ILUMINAÇÃO ────────────────────────────────────────────────────────
print("Luzes...")

def light(name, loc, rot_deg, hexc, energy, size=2):
    bpy.ops.object.light_add(type='AREA', location=loc,
                              rotation=tuple(radians(a) for a in rot_deg))
    L = bpy.context.object
    L.name = name
    L.data.color = hex_to_rgb(hexc)[:3]
    L.data.energy = energy
    L.data.size = size

light("CyanKey", (3, -3, 4), (60, 0, 45), "#00E5FF", 1100, 3)
light("BlueRim", (-3.5, -1, 3), (75, 0, -120), "#4D5CFF", 700, 3)
light("Fill",    (0, -5, 5), (60, 0, 0),    "#B0C4FF", 350, 6)


# ─── CÂMERA ────────────────────────────────────────────────────────────
print("Câmera...")
bpy.ops.object.camera_add(location=(0, -6.5, 0), rotation=(radians(90), 0, 0))
cam = bpy.context.object
cam.name = "BrandCamera"
cam.data.lens = 50
scene.camera = cam


# ─── RENDER ───────────────────────────────────────────────────────────
scene.render.film_transparent = True
scene.render.fps = 24
scene.render.resolution_x = 1080
scene.render.resolution_y = 1080

engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
scene.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in engines else 'BLENDER_EEVEE'

vs = [v.identifier for v in scene.view_settings.bl_rna.properties['view_transform'].enum_items]
if 'Filmic' in vs:
    scene.view_settings.view_transform = 'Filmic'


# ─── EXPORTAR GLB ──────────────────────────────────────────────────────
print(f"\nExportando: {OUTPUT_GLB}")

bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
ribbon.select_set(True)
dot.select_set(True)

try:
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        export_format='GLB',
        use_selection=True,
        export_animations=True,
        export_apply=True,
        export_yup=True,
    )
    kb = os.path.getsize(OUTPUT_GLB) / 1024
    print(f"\n{'='*60}")
    print(f"✓ EXPORTADO  ·  {kb:.1f} KB")
    print(f"  {OUTPUT_GLB}")
    print(f"{'='*60}\n")
    print("Recarregue http://localhost:8000 (Ctrl+F5)")
except Exception as e:
    print(f"\n✗ Export falhou: {e}")
