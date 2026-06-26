#!/usr/bin/env python3
"""
Versión final HD del logo VNR.
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


def process_final_logo(input_path, output_path, target_width=3000):
    """
    Procesa el logo en alta resolución con fondo transparente limpio.
    """
    print(f"Cargando: {input_path}")

    img = Image.open(input_path)
    original_ratio = img.height / img.width

    # Escalar a resolución objetivo
    scale = target_width / img.width
    new_size = (target_width, int(target_width * original_ratio))
    img = img.resize(new_size, Image.Resampling.LANCZOS)
    print(f"Resolución de trabajo: {img.width}x{img.height}")

    img = img.convert('RGBA')

    # Remover fondo con rembg
    print("Removiendo fondo con IA...")
    result = remove(img,
                   alpha_matting=True,
                   alpha_matting_foreground_threshold=270,
                   alpha_matting_background_threshold=20,
                   alpha_matting_erode_size=5)

    # Expandir máscara para preservar todos los bordes
    print("Refinando bordes...")
    from scipy import ndimage

    data = np.array(result)
    mask = data[:, :, 3]

    # Dilatar para no perder detalles
    mask_binary = mask > 30
    mask_dilated = ndimage.binary_dilation(mask_binary, iterations=4)

    # Suavizar
    mask_float = mask_dilated.astype(float) * 255
    mask_smooth = ndimage.gaussian_filter(mask_float, sigma=1.5)

    # Threshold
    mask_final = np.where(mask_smooth > 80, 255, 0).astype(np.uint8)

    # Aplicar a imagen original escalada
    data_original = np.array(img)
    data_original[:, :, 3] = mask_final

    result = Image.fromarray(data_original)

    # Recortar con margen
    print("Recortando...")
    bbox = result.getbbox()
    if bbox:
        margin = 50
        bbox = (
            max(0, bbox[0] - margin),
            max(0, bbox[1] - margin),
            min(result.width, bbox[2] + margin),
            min(result.height, bbox[3] + margin)
        )
        result = result.crop(bbox)

    # Guardar en máxima calidad
    print(f"Guardando en alta calidad: {output_path}")
    result.save(output_path, 'PNG', optimize=False)

    # Información del archivo
    import os
    file_size = os.path.getsize(output_path)
    print(f"\n✓ Logo procesado exitosamente!")
    print(f"  Resolución: {result.width}x{result.height}")
    print(f"  Tamaño: {file_size / 1024 / 1024:.2f} MB")
    print(f"  Archivo: {output_path}")

    return output_path


if __name__ == "__main__":
    input_path = sys.argv[1] if len(sys.argv) > 1 else "/Users/dylanagostini/Desktop/logo-vnr.jpeg"
    output_path = sys.argv[2] if len(sys.argv) > 2 else "/Users/dylanagostini/Desktop/LOGO-VNR-HD.png"

    process_final_logo(input_path, output_path)
