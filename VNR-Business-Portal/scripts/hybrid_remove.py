#!/usr/bin/env python3
"""
Método híbrido: usa rembg para detectar el logo, luego limpia solo el exterior.
"""

import sys
from PIL import Image
import numpy as np

try:
    from rembg import remove
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'rembg', 'onnxruntime'])
    from rembg import remove


def hybrid_background_removal(input_path, output_path):
    """
    1. Usa rembg para obtener máscara del logo
    2. Expande ligeramente la máscara para preservar bordes
    3. Aplica la máscara al original escalado
    """
    print(f"Cargando: {input_path}")

    img = Image.open(input_path)

    # Escalar a HD
    if img.width < 2000:
        scale = max(2, 2000 // img.width)
        new_size = (img.width * scale, img.height * scale)
        img = img.resize(new_size, Image.Resampling.LANCZOS)
        print(f"Escalado a: {img.width}x{img.height}")

    img = img.convert('RGBA')

    # Paso 1: Usar rembg para obtener la silueta del logo
    print("Detectando logo con IA...")
    result_rembg = remove(img,
                         alpha_matting=True,
                         alpha_matting_foreground_threshold=270,
                         alpha_matting_background_threshold=20,
                         alpha_matting_erode_size=5)

    # Obtener el canal alpha de rembg como máscara
    data_rembg = np.array(result_rembg)
    mask_rembg = data_rembg[:, :, 3]

    # Paso 2: Dilatar la máscara para incluir bordes que rembg pudo haber cortado
    print("Expandiendo máscara para preservar bordes...")
    from scipy import ndimage

    # Dilatar la máscara
    mask_binary = mask_rembg > 50
    mask_dilated = ndimage.binary_dilation(mask_binary, iterations=3)

    # Paso 3: Crear máscara suave
    mask_float = mask_dilated.astype(float) * 255
    mask_smooth = ndimage.gaussian_filter(mask_float, sigma=2)

    # Threshold para bordes definidos
    mask_final = np.where(mask_smooth > 100, 255, 0).astype(np.uint8)

    # Paso 4: Aplicar máscara a la imagen original
    print("Aplicando máscara...")
    data_original = np.array(img)
    data_original[:, :, 3] = mask_final

    result = Image.fromarray(data_original)

    # Paso 5: Recortar
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

    print(f"Guardando: {output_path}")
    result.save(output_path, 'PNG', optimize=True)

    print(f"\n✓ Completado!")
    print(f"  Resolución: {result.width}x{result.height}")

    return output_path


if __name__ == "__main__":
    input_path = sys.argv[1] if len(sys.argv) > 1 else "/Users/dylanagostini/Desktop/logo-vnr.jpeg"
    output_path = sys.argv[2] if len(sys.argv) > 2 else "/Users/dylanagostini/Desktop/logo-vnr-hybrid.png"

    hybrid_background_removal(input_path, output_path)
