# ASSETS REQUERIDOS - SECCIÓN VUELTA-SEGURA (CONDUCTOR)

## Análisis

**NOTA IMPORTANTE:** Esta sección es **idéntica** a la sección CADETE.
Representa el flujo del conductor específico para el servicio "Vuelta Segura".

---

## Pantallas Analizadas

Las siguientes capturas de Figma son las mismas que en CADETE:

| Captura | Equivalente en CADETE |
|---------|----------------------|
| Login.png | Login.png ✅ |
| Registro.png | Registro.png ✅ |
| Inicio.png | Inicio.png ✅ |
| Elección de servicio.png | Elección de servicio.png ✅ |
| Selección de viaje.png | Selección de viaje.png ✅ |
| Selección de viaje - Iniciar.png | Selección de viaje - Iniciar.png ✅ |
| Selección de viaje - Viaje aceptado.png | (Viaje activo) ✅ |
| Selcción de viaje - Menú.png | (Menú contextual) ✅ |
| Pasos registro.png | Pasos registro.png ✅ |
| Pasos registro/Foto perfil.png | Foto perfil.png ✅ |
| Pasos registro/Foto licencia.png | Foto licencia.png ✅ |
| Pasos registro/Foto cédula.png | Foto cédula.png ✅ |
| NavBar.png | NavBar.png ✅ |

---

## Assets Específicos Encontrados

### Iconos GPS (iconsax)
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `iconsax-gps.png` | Icono de GPS/ubicación estilo iconsax | **DISPONIBLE** en carpeta |
| `iconsax-gps-1.png` | Variante del icono GPS | **DISPONIBLE** en carpeta |

### Líneas decorativas
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `Line 5.png` | Línea decorativa | Elemento UI menor |
| `Line 6.png` | Línea decorativa | Elemento UI menor |
| `Line 7.png` | Línea decorativa | Elemento UI menor |

### Frames adicionales
Los archivos `Frame 339.png` hasta `Frame 339-15.png` parecen ser variantes o estados de UI que se pueden lograr con código.

---

## Conclusión

**No se requieren assets adicionales específicos para esta sección.**

Todos los assets necesarios están documentados en:
- `ASSETS-REQUERIDOS-CADETE.md` (assets del conductor)
- `ASSETS-REQUERIDOS-USER.md` (assets compartidos)

Los iconos `iconsax-gps.png` ya están disponibles en la carpeta de Figma y pueden usarse como markers personalizados en el mapa.

---

## Assets para Exportar de esta Carpeta

```
CAPTURAS-FIGMA/vuelta-segura/
├── iconsax-gps.png      → Usar como marker de GPS
└── iconsax-gps-1.png    → Variante del marker
```

Estos iconos pueden copiarse directamente a:
```
src/assets/images/markers/
├── marker-gps.png
└── marker-gps-alt.png
```
