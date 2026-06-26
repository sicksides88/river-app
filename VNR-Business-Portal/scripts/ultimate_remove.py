#!/usr/bin/env python3
"""
Remoción de fondo definitiva: combina detección AI con flood fill.
"""

import sys
from PIL import Image
import numpy as np
from collections import deque

try:
    from rembg import remove
    from scipy import ndimage
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'rembg', 'onnxruntime', 'scipy'])
    from rembg import remove
    from scipy import ndimage


def flood_fill_mask(img_array, tolerance=35):
    """Crea máscara del fondo usando flood fill desde bordes."""
    height, width = img_array.shape[:2]
    visited = np.zeros((height, width), dtype=bool)
    is_background = np.zeros((height, width), dtype=bool)

    # Color de fondo desde esquinas
    corners = []
    for y in range(20):
        for x in range(20):
            corners.extend([
                img_array[y, x, :3],
                img_array[y, width-1-x, :3],
                img_array[height-1-y, x, :3],
                img_array[height-1-y, width-1-x, :3]
            ])
    bg_color = np.median(corners, axis=0)

    # BFS desde bordes
    queue = deque()
    for x in range(width):
        queue.extend([(x, 0), (x, height-1)])
    for y in range(height):
        queue.extend([(0, y), (width-1, y)])

    while queue:
        x, y = queue.popleft()
        if not (0 <= x < width and 0 <= y < height) or visited[y, x]:
            continue

        visited[y, x] = True
        pixel = img_array[y, x, :3].astype(float)
        dist = np.sqrt(np.sum((pixel - bg_color)**2))

        if dist < tolerance:
            is_background[y, x] = True
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = x+dx, y+dy
                if 0 <= nx < width and 0 <= ny < height and not visited[ny, nx]:
                    queue.append((nx, ny))

    return is_background


def ultimate_removal(input_path, output_path, target_width=2500):
    """Proceso definitivo de remoción."""
    print(f"Cargando: {input_path}")

    img = Image.open(input_path)
    ratio = img.height / img.width
    new_size = (target_width, int(target_width * ratio))
    img = img.resize(new_size, Image.Resampling.LANCZOS)
    print(f"Resolución: {img.width}x{img.height}")

    img = img.convert('RGBA')
    data = np.array(img)

    # Método 1: Máscara de rembg (detecta el logo)
    print("1. Detectando logo con IA...")
    rembg_result = remove(img, alpha_matting=True,
                         alpha_matting_foreground_threshold=250,
                         alpha_matting_background_threshold=30)
    rembg_mask = np.array(rembg_result)[:, :, 3] > 50

    # Expandir máscara de rembg para no perder bordes
    rembg_mask_expanded = ndimage.binary_dilation(rembg_mask, iterations=5)

    # Método 2: Flood fill (detecta el fondo)
    print("2. Detectando fondo con flood fill...")
    flood_background = flood_fill_mask(data, tolerance=35)

    # Combinar: pixel es logo si:
    # - rembg dice que es logo (expandido) Y
    # - flood fill dice que NO es fondo
    print("3. Combinando máscaras...")
    final_logo_mask = rembg_mask_expanded & (~flood_background)

    # También preservar cualquier pixel que rembg detectó fuertemente
    strong_rembg = np.array(rembg_result)[:, :, 3] > 150
    final_logo_mask = final_logo_mask | strong_rembg

    # Limpiar ruido
    final_logo_mask = ndimage.binary_opening(final_logo_mask, iterations=2)
    final_logo_mask = ndimage.binary_closing(final_logo_mask, iterations=2)

    # Suavizar bordes
    print("4. Suavizando bordes...")
    mask_float = final_logo_mask.astype(float)
    mask_smooth = ndimage.gaussian_filter(mask_float, sigma=1.5)
    mask_final = (mask_smooth > 0.3).astype(np.uint8) * 255

    # Aplicar máscara
    data[:, :, 3] = mask_final
    result = Image.fromarray(data)

    # Recortar
    print("5. Recortando...")
    bbox = result.getbbox()
    if bbox:
        margin = 40
        bbox = (max(0, bbox[0]-margin), max(0, bbox[1]-margin),
                min(result.width, bbox[2]+margin), min(result.height, bbox[3]+margin))
        result = result.crop(bbox)

    print(f"Guardando: {output_path}")
    result.save(output_path, 'PNG')

    import os
    size_mb = os.path.getsize(output_path) / 1024 / 1024
    print(f"\n✓ Completado!")
    print(f"  Resolución: {result.width}x{result.height}")
    print(f"  Tamaño: {size_mb:.2f} MB")

    return output_path


if __name__ == "__main__":
    input_path = sys.argv[1] if len(sys.argv) > 1 else "/Users/dylanagostini/Desktop/logo-vnr.jpeg"
    output_path = sys.argv[2] if len(sys.argv) > 2 else "/Users/dylanagostini/Desktop/LOGO-VNR-FINAL.png"
    ultimate_removal(input_path, output_path)
