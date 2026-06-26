#!/usr/bin/env python3
"""
Script para remover el fondo de un logo y guardarlo como PNG transparente.
Utiliza rembg para una remoción de fondo de alta calidad.
"""

import sys
import os

def install_dependencies():
    """Instala las dependencias necesarias si no están disponibles."""
    import subprocess
    packages = ['rembg', 'Pillow']
    for package in packages:
        try:
            __import__(package.lower().replace('-', '_'))
        except ImportError:
            print(f"Instalando {package}...")
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])

# Intentar instalar dependencias
try:
    from rembg import remove
    from PIL import Image
except ImportError:
    print("Instalando dependencias necesarias...")
    install_dependencies()
    from rembg import remove
    from PIL import Image

def remove_background(input_path: str, output_path: str = None) -> str:
    """
    Remueve el fondo de una imagen y la guarda como PNG transparente.

    Args:
        input_path: Ruta a la imagen de entrada
        output_path: Ruta para guardar la imagen (opcional)

    Returns:
        Ruta del archivo de salida
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"No se encontró el archivo: {input_path}")

    # Generar nombre de salida si no se proporciona
    if output_path is None:
        base_name = os.path.splitext(input_path)[0]
        output_path = f"{base_name}_transparent.png"

    print(f"Procesando: {input_path}")

    # Abrir imagen
    with Image.open(input_path) as img:
        # Convertir a RGBA si es necesario
        if img.mode != 'RGBA':
            img = img.convert('RGBA')

        # Remover fondo usando rembg
        print("Removiendo fondo...")
        output = remove(img)

        # Guardar como PNG
        output.save(output_path, 'PNG')
        print(f"Imagen guardada: {output_path}")

        return output_path

def remove_blue_background(input_path: str, output_path: str = None, tolerance: int = 60) -> str:
    """
    Remueve específicamente el fondo azul de una imagen.
    Útil cuando rembg no está disponible o para fondos de color sólido.

    Args:
        input_path: Ruta a la imagen de entrada
        output_path: Ruta para guardar la imagen (opcional)
        tolerance: Tolerancia para detectar el color azul (0-255)

    Returns:
        Ruta del archivo de salida
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"No se encontró el archivo: {input_path}")

    if output_path is None:
        base_name = os.path.splitext(input_path)[0]
        output_path = f"{base_name}_transparent.png"

    print(f"Procesando: {input_path}")

    with Image.open(input_path) as img:
        img = img.convert('RGBA')
        pixels = img.load()
        width, height = img.size

        # Color azul del fondo (aproximado del logo VNR)
        target_blue = (43, 78, 178)  # #2B4EB2 aproximadamente

        print("Removiendo fondo azul...")
        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]

                # Verificar si el pixel es cercano al azul del fondo
                if (abs(r - target_blue[0]) < tolerance and
                    abs(g - target_blue[1]) < tolerance and
                    abs(b - target_blue[2]) < tolerance):
                    # Hacer transparente
                    pixels[x, y] = (r, g, b, 0)

        img.save(output_path, 'PNG')
        print(f"Imagen guardada: {output_path}")

        return output_path

def main():
    if len(sys.argv) < 2:
        print("Uso: python remove_background.py <imagen_entrada> [imagen_salida]")
        print("\nEjemplo:")
        print("  python remove_background.py logo.jpg logo_transparent.png")
        print("\nOpciones:")
        print("  --blue    Usar método específico para fondo azul")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else None
    use_blue_method = '--blue' in sys.argv

    try:
        if use_blue_method:
            result = remove_blue_background(input_path, output_path)
        else:
            result = remove_background(input_path, output_path)
        print(f"\n¡Listo! Imagen guardada en: {result}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
