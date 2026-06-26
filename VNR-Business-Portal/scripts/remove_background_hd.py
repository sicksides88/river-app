#!/usr/bin/env python3
"""
Script mejorado para remover fondo de logos con limpieza profunda.
"""

import sys
import os

# Instalar dependencias si es necesario
try:
    from rembg import remove
    from PIL import Image, ImageFilter, ImageEnhance
    import numpy as np
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'rembg', 'Pillow', 'numpy', 'onnxruntime'])
    from rembg import remove
    from PIL import Image, ImageFilter, ImageEnhance
    import numpy as np


def remove_color_range(img, target_colors, tolerance=40):
    """
    Remueve un rango de colores específicos haciéndolos transparentes.
    """
    img_array = np.array(img)

    # Crear máscara de transparencia
    alpha = img_array[:, :, 3].copy()

    for target_color in target_colors:
        r_target, g_target, b_target = target_color

        # Calcular distancia al color objetivo
        r_diff = np.abs(img_array[:, :, 0].astype(int) - r_target)
        g_diff = np.abs(img_array[:, :, 1].astype(int) - g_target)
        b_diff = np.abs(img_array[:, :, 2].astype(int) - b_target)

        # Máscara donde el color está dentro de la tolerancia
        mask = (r_diff < tolerance) & (g_diff < tolerance) & (b_diff < tolerance)

        # Hacer transparente
        alpha[mask] = 0

    img_array[:, :, 3] = alpha
    return Image.fromarray(img_array)


def clean_edges(img, iterations=2):
    """
    Limpia los bordes de la imagen para remover halos.
    """
    img_array = np.array(img)
    alpha = img_array[:, :, 3]

    for _ in range(iterations):
        # Erosionar ligeramente el canal alpha para remover bordes
        from scipy import ndimage
        alpha = ndimage.binary_erosion(alpha > 128, iterations=1).astype(np.uint8) * 255

        # Suavizar
        alpha = ndimage.gaussian_filter(alpha.astype(float), sigma=0.5)
        alpha = np.clip(alpha, 0, 255).astype(np.uint8)

    img_array[:, :, 3] = alpha
    return Image.fromarray(img_array)


def upscale_image(img, scale=2):
    """
    Escala la imagen para mejor calidad.
    """
    new_size = (img.width * scale, img.height * scale)
    return img.resize(new_size, Image.Resampling.LANCZOS)


def process_logo_hd(input_path, output_path):
    """
    Proceso completo para remover fondo y mejorar calidad.
    """
    print(f"Cargando imagen: {input_path}")

    # Cargar imagen original
    original = Image.open(input_path)

    # Escalar primero para mejor procesamiento
    print("Escalando imagen para mejor calidad...")
    if original.width < 2000:
        scale = max(2, 2000 // original.width)
        original = upscale_image(original, scale)
        print(f"  Nueva resolución: {original.width}x{original.height}")

    # Convertir a RGBA
    if original.mode != 'RGBA':
        original = original.convert('RGBA')

    # Paso 1: Remover fondo con rembg
    print("Paso 1: Removiendo fondo con IA...")
    result = remove(original,
                   alpha_matting=True,
                   alpha_matting_foreground_threshold=240,
                   alpha_matting_background_threshold=10,
                   alpha_matting_erode_size=10)

    # Paso 2: Remover colores azules residuales
    print("Paso 2: Limpiando colores azules residuales...")
    blue_colors = [
        (43, 78, 178),    # Azul principal del fondo
        (35, 65, 160),    # Variación más oscura
        (50, 90, 190),    # Variación más clara
        (40, 70, 170),    # Variación intermedia
        (45, 80, 180),    # Otra variación
        (30, 60, 150),    # Más oscuro
        (55, 95, 200),    # Más claro
        (38, 72, 175),    # Intermedio
        (48, 85, 185),    # Intermedio
        (33, 68, 165),    # Intermedio
    ]
    result = remove_color_range(result, blue_colors, tolerance=50)

    # Paso 3: Limpieza adicional de bordes
    print("Paso 3: Limpiando bordes...")
    try:
        result = clean_edges(result, iterations=1)
    except ImportError:
        print("  (scipy no disponible, saltando limpieza de bordes)")

    # Paso 4: Segundo paso con rembg para asegurar limpieza
    print("Paso 4: Segunda pasada de limpieza...")
    result = remove(result,
                   alpha_matting=True,
                   alpha_matting_foreground_threshold=250,
                   alpha_matting_background_threshold=5)

    # Guardar resultado
    print(f"Guardando resultado HD: {output_path}")
    result.save(output_path, 'PNG', optimize=True)

    print(f"\n✓ Proceso completado!")
    print(f"  Resolución final: {result.width}x{result.height}")
    print(f"  Archivo: {output_path}")

    return output_path


if __name__ == "__main__":
    input_path = sys.argv[1] if len(sys.argv) > 1 else "/Users/dylanagostini/Desktop/logo-vnr.jpeg"
    output_path = sys.argv[2] if len(sys.argv) > 2 else "/Users/dylanagostini/Desktop/logo-vnr-hd-transparent.png"

    process_logo_hd(input_path, output_path)
