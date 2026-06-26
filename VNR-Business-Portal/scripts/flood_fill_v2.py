#!/usr/bin/env python3
"""
Remoción de fondo v2 - Más conservador para preservar el logo.
"""

import sys
from PIL import Image
import numpy as np
from collections import deque

def color_distance(c1, c2):
    """Calcula la distancia euclidiana entre dos colores RGB."""
    return np.sqrt(sum((float(a) - float(b)) ** 2 for a, b in zip(c1[:3], c2[:3])))


def flood_fill_conservative(img_array, start_points, bg_color, tolerance=30, edge_tolerance=60):
    """
    Flood fill conservador que se detiene en bordes pronunciados.
    """
    height, width = img_array.shape[:2]
    visited = np.zeros((height, width), dtype=bool)
    is_background = np.zeros((height, width), dtype=bool)

    queue = deque(start_points)
    processed = 0

    while queue:
        x, y = queue.popleft()

        if x < 0 or x >= width or y < 0 or y >= height:
            continue
        if visited[y, x]:
            continue

        visited[y, x] = True
        pixel_color = img_array[y, x, :3]

        # Verificar si este pixel es similar al fondo
        dist_to_bg = color_distance(pixel_color, bg_color)

        if dist_to_bg < tolerance:
            is_background[y, x] = True
            processed += 1

            # Añadir vecinos (4-conectividad para ser más conservador)
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height and not visited[ny, nx]:
                    neighbor_color = img_array[ny, nx, :3]
                    # Solo expandir si el vecino también es similar al fondo
                    if color_distance(neighbor_color, bg_color) < tolerance:
                        queue.append((nx, ny))

    return is_background, processed


def remove_background_v2(input_path, output_path):
    """Proceso principal."""
    print(f"Cargando: {input_path}")

    img = Image.open(input_path)

    # Escalar a HD
    if img.width < 2000:
        scale = max(2, 2000 // img.width)
        new_size = (img.width * scale, img.height * scale)
        img = img.resize(new_size, Image.Resampling.LANCZOS)
        print(f"Escalado a: {img.width}x{img.height}")

    img = img.convert('RGBA')
    data = np.array(img)
    height, width = data.shape[:2]

    # Detectar color de fondo desde las esquinas (más muestras)
    corner_samples = []
    sample_size = 20
    # Esquinas
    for y in range(sample_size):
        for x in range(sample_size):
            corner_samples.append(data[y, x, :3])
            corner_samples.append(data[y, width-1-x, :3])
            corner_samples.append(data[height-1-y, x, :3])
            corner_samples.append(data[height-1-y, width-1-x, :3])

    bg_color = np.median(corner_samples, axis=0)
    print(f"Color de fondo: RGB{tuple(int(c) for c in bg_color)}")

    # Puntos de inicio: todo el borde de la imagen
    start_points = []
    for x in range(width):
        start_points.append((x, 0))
        start_points.append((x, height - 1))
    for y in range(height):
        start_points.append((0, y))
        start_points.append((width - 1, y))

    # Ejecutar flood fill con tolerancia baja (conservador)
    print("Flood fill conservador (tolerancia=28)...")
    is_background, count = flood_fill_conservative(data, start_points, bg_color, tolerance=28)
    print(f"  Pixeles de fondo: {count}")

    # Crear alpha channel
    alpha = np.where(is_background, 0, 255).astype(np.uint8)

    # Suavizar bordes
    print("Suavizando bordes...")
    from scipy import ndimage

    # Erosión muy suave para limpiar bordes irregulares
    alpha_binary = alpha > 128
    alpha_clean = ndimage.binary_erosion(alpha_binary, iterations=1)
    alpha_clean = ndimage.binary_dilation(alpha_clean, iterations=1)

    # Blur suave
    alpha_float = alpha_clean.astype(float) * 255
    alpha_smooth = ndimage.gaussian_filter(alpha_float, sigma=1.0)
    alpha_final = np.clip(alpha_smooth, 0, 255).astype(np.uint8)

    # Hacer los bordes más definidos
    alpha_final = np.where(alpha_final > 180, 255,
                          np.where(alpha_final < 75, 0, alpha_final))

    data[:, :, 3] = alpha_final

    result = Image.fromarray(data)

    # Recortar
    print("Recortando...")
    bbox = result.getbbox()
    if bbox:
        margin = 40
        bbox = (
            max(0, bbox[0] - margin),
            max(0, bbox[1] - margin),
            min(result.width, bbox[2] + margin),
            min(result.height, bbox[3] + margin)
        )
        result = result.crop(bbox)

    print(f"Guardando: {output_path}")
    result.save(output_path, 'PNG', optimize=True)

    print(f"\n✓ Completado!")
    print(f"  Resolución: {result.width}x{result.height}")

    return output_path


if __name__ == "__main__":
    input_path = sys.argv[1] if len(sys.argv) > 1 else "/Users/dylanagostini/Desktop/logo-vnr.jpeg"
    output_path = sys.argv[2] if len(sys.argv) > 2 else "/Users/dylanagostini/Desktop/logo-vnr-v2.png"

    remove_background_v2(input_path, output_path)
