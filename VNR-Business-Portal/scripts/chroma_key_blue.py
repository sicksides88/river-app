#!/usr/bin/env python3
"""
Chroma key específico para remover fondo azul sólido.
"""

import sys
from PIL import Image
import numpy as np

def hex_to_rgb(hex_color):
    """Convierte color hex a RGB."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def remove_blue_background_advanced(input_path, output_path, tolerance=45):
    """
    Remueve el fondo azul usando detección de color avanzada.
    """
    print(f"Cargando: {input_path}")

    # Cargar imagen
    img = Image.open(input_path)

    # Escalar a HD si es necesario
    if img.width < 2000:
        scale = max(2, 2000 // img.width)
        new_size = (img.width * scale, img.height * scale)
        img = img.resize(new_size, Image.Resampling.LANCZOS)
        print(f"Escalado a: {img.width}x{img.height}")

    # Convertir a RGBA
    img = img.convert('RGBA')
    data = np.array(img)

    # Colores de fondo azul a detectar (el fondo del logo VNR)
    # Color principal aproximado: #2B4EB2 (RGB: 43, 78, 178)
    background_blues = [
        (43, 78, 178),   # Azul principal
        (45, 80, 180),
        (40, 75, 175),
        (50, 85, 185),
        (35, 70, 170),
        (48, 82, 182),
        (42, 76, 176),
        (38, 72, 172),
        (52, 88, 188),
        (30, 65, 165),
    ]

    print("Detectando y removiendo fondo azul...")

    # Crear canal alpha
    r = data[:, :, 0].astype(float)
    g = data[:, :, 1].astype(float)
    b = data[:, :, 2].astype(float)

    # Inicializar máscara (255 = opaco, 0 = transparente)
    alpha = np.ones((data.shape[0], data.shape[1])) * 255

    # Método 1: Detectar por color específico
    for bg_color in background_blues:
        bg_r, bg_g, bg_b = bg_color
        dist = np.sqrt((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2)
        mask = dist < tolerance
        alpha[mask] = 0

    # Método 2: Detectar azules saturados (característica del fondo)
    # El fondo azul tiene B > R y B > G significativamente
    is_blue_dominant = (b > r + 50) & (b > g + 30) & (b > 120)

    # Además, verificar que no sea parte del logo (los azules del logo tienen gradientes)
    # El fondo es más uniforme
    alpha[is_blue_dominant] = 0

    # Método 3: Detectar por ratio de colores
    # El azul del fondo tiene una proporción específica
    with np.errstate(divide='ignore', invalid='ignore'):
        blue_ratio = b / (r + g + 1)
        is_background_blue = (blue_ratio > 1.2) & (b > 100) & (g < 120) & (r < 80)
        alpha[is_background_blue] = 0

    # Suavizar bordes del alpha
    print("Suavizando bordes...")
    from scipy import ndimage

    # Dilatar ligeramente para capturar bordes
    alpha_binary = alpha > 128
    alpha_dilated = ndimage.binary_dilation(alpha_binary, iterations=1)

    # Aplicar un poco de blur al canal alpha para suavizar
    alpha_smooth = ndimage.gaussian_filter(alpha.astype(float), sigma=1.0)

    # Combinar: mantener transparencia donde detectamos fondo
    final_alpha = np.where(alpha == 0, 0, alpha_smooth)
    final_alpha = np.clip(final_alpha, 0, 255).astype(np.uint8)

    # Aplicar alpha
    data[:, :, 3] = final_alpha

    # Crear imagen resultante
    result = Image.fromarray(data)

    # Recortar bordes transparentes
    print("Recortando bordes innecesarios...")
    bbox = result.getbbox()
    if bbox:
        # Añadir un pequeño margen
        margin = 20
        bbox = (
            max(0, bbox[0] - margin),
            max(0, bbox[1] - margin),
            min(result.width, bbox[2] + margin),
            min(result.height, bbox[3] + margin)
        )
        result = result.crop(bbox)

    # Guardar
    print(f"Guardando: {output_path}")
    result.save(output_path, 'PNG', optimize=True)

    print(f"\n✓ Completado!")
    print(f"  Resolución: {result.width}x{result.height}")

    return output_path


if __name__ == "__main__":
    input_path = sys.argv[1] if len(sys.argv) > 1 else "/Users/dylanagostini/Desktop/logo-vnr.jpeg"
    output_path = sys.argv[2] if len(sys.argv) > 2 else "/Users/dylanagostini/Desktop/logo-vnr-final.png"

    remove_blue_background_advanced(input_path, output_path)
