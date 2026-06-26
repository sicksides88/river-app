#!/usr/bin/env python3
"""
Remoción de fondo usando flood fill desde los bordes.
Más preciso para logos con colores similares al fondo.
"""

import sys
from PIL import Image
import numpy as np
from collections import deque

def get_neighbors(x, y, width, height):
    """Obtiene los vecinos de un pixel."""
    neighbors = []
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]:
        nx, ny = x + dx, y + dy
        if 0 <= nx < width and 0 <= ny < height:
            neighbors.append((nx, ny))
    return neighbors


def color_distance(c1, c2):
    """Calcula la distancia euclidiana entre dos colores."""
    return np.sqrt(sum((a - b) ** 2 for a, b in zip(c1, c2)))


def flood_fill_background(img_array, tolerance=35):
    """
    Usa flood fill desde los bordes para identificar el fondo.
    """
    height, width = img_array.shape[:2]
    visited = np.zeros((height, width), dtype=bool)
    is_background = np.zeros((height, width), dtype=bool)

    # Obtener el color de referencia del fondo (esquina superior izquierda)
    # Promedio de algunos pixeles de la esquina
    corner_colors = []
    for y in range(min(10, height)):
        for x in range(min(10, width)):
            corner_colors.append(img_array[y, x, :3])

    bg_color = np.mean(corner_colors, axis=0)
    print(f"Color de fondo detectado: RGB{tuple(int(c) for c in bg_color)}")

    # Cola para BFS desde todos los bordes
    queue = deque()

    # Añadir todos los pixeles de los bordes
    for x in range(width):
        queue.append((x, 0))           # Borde superior
        queue.append((x, height - 1))  # Borde inferior
    for y in range(height):
        queue.append((0, y))           # Borde izquierdo
        queue.append((width - 1, y))   # Borde derecho

    print("Ejecutando flood fill desde bordes...")
    processed = 0

    while queue:
        x, y = queue.popleft()

        if visited[y, x]:
            continue

        visited[y, x] = True
        pixel_color = img_array[y, x, :3]
        dist = color_distance(pixel_color, bg_color)

        if dist < tolerance:
            is_background[y, x] = True
            processed += 1

            # Añadir vecinos
            for nx, ny in get_neighbors(x, y, width, height):
                if not visited[ny, nx]:
                    queue.append((nx, ny))

    print(f"  Pixeles de fondo detectados: {processed}")
    return is_background


def remove_background_flood(input_path, output_path):
    """
    Proceso principal de remoción de fondo.
    """
    print(f"Cargando: {input_path}")

    # Cargar imagen
    img = Image.open(input_path)

    # Escalar a HD
    original_size = (img.width, img.height)
    if img.width < 2000:
        scale = max(2, 2000 // img.width)
        new_size = (img.width * scale, img.height * scale)
        img = img.resize(new_size, Image.Resampling.LANCZOS)
        print(f"Escalado a: {img.width}x{img.height}")

    # Convertir a RGBA
    img = img.convert('RGBA')
    data = np.array(img)

    # Detectar fondo con flood fill
    is_background = flood_fill_background(data, tolerance=40)

    # Aplicar transparencia
    print("Aplicando transparencia...")
    alpha = np.where(is_background, 0, 255).astype(np.uint8)

    # Suavizar bordes del alpha
    print("Suavizando bordes...")
    from scipy import ndimage

    # Aplicar un pequeño blur al alpha para suavizar bordes
    alpha_float = alpha.astype(float)
    alpha_smooth = ndimage.gaussian_filter(alpha_float, sigma=1.5)

    # Threshold para mantener bordes definidos pero suaves
    alpha_final = np.where(alpha_smooth > 200, 255,
                          np.where(alpha_smooth < 50, 0, alpha_smooth))
    alpha_final = alpha_final.astype(np.uint8)

    data[:, :, 3] = alpha_final

    # Crear imagen resultante
    result = Image.fromarray(data)

    # Recortar bordes transparentes
    print("Recortando...")
    bbox = result.getbbox()
    if bbox:
        margin = 30
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
    print(f"  Resolución final: {result.width}x{result.height}")

    return output_path


if __name__ == "__main__":
    input_path = sys.argv[1] if len(sys.argv) > 1 else "/Users/dylanagostini/Desktop/logo-vnr.jpeg"
    output_path = sys.argv[2] if len(sys.argv) > 2 else "/Users/dylanagostini/Desktop/logo-vnr-clean.png"

    remove_background_flood(input_path, output_path)
