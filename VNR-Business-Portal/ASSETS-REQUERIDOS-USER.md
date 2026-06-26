# ASSETS REQUERIDOS - SECCIÓN USER

## Resumen del Análisis Figma vs Implementación

Este documento lista todos los assets gráficos necesarios para reemplazar los placeholders actuales en la implementación y alcanzar el diseño exacto de Figma.

---

## 1. AUTENTICACIÓN (Login/Registro)

### Login.png / Registro.png
| Asset | Descripción | Ubicación en código | Estado |
|-------|-------------|---------------------|--------|
| `logo-vnr.png` | Logo principal de la app (cuadrado con esquinas redondeadas) | `LoginScreen.js:70-80`, `RegisterScreen.js:121-124` | **FALTANTE** - Actualmente es un placeholder gris |
| `icon-email.png` | Icono de sobre/email para input | `LoginScreen.js:105` | Usando Ionicons (mail-outline) |
| `icon-lock.png` | Icono de candado para contraseña | `LoginScreen.js:114` | Usando Ionicons (lock-closed-outline) |
| `flag-argentina.png` | Bandera Argentina para selector de país | `RegisterScreen.js:170` | Usando emoji 🇦🇷 |

**ASSETS NECESARIOS:**
```
- assets/images/logo-vnr.png (100x100px, esquinas redondeadas)
```

---

## 2. HOME SCREEN

### Home.png
| Asset | Descripción | Ubicación en código | Estado |
|-------|-------------|---------------------|--------|
| `icon-vuelta-segura.png` | Icono auto blanco 3D | `HomeScreen.js:35` | **FALTANTE** - Usando Ionicons |
| `icon-envios.png` | Icono camioneta/furgoneta 3D | `HomeScreen.js:41` | **FALTANTE** - Usando Ionicons |
| `icon-fletes.png` | Icono camión 3D | `HomeScreen.js:47` | **FALTANTE** - Usando Ionicons |
| `icon-chofer.png` | Icono auto con persona 3D | `HomeScreen.js:53` | **FALTANTE** - Usando Ionicons |
| `promo-hand-phone.png` | Mano sosteniendo teléfono con mapa | `HomeScreen.js:163-167` | **FALTANTE** - Placeholder |
| `promo-first-ride.png` | Ilustración persona con mapa y taxi | `HomeScreen.js:63` | **FALTANTE** |
| `promo-delivery.png` | Ilustración persona recibiendo paquete | `HomeScreen.js:69` | **FALTANTE** |

**ASSETS NECESARIOS:**
```
- assets/images/services/icon-vuelta-segura.png (64x64px, 3D render)
- assets/images/services/icon-envios.png (64x64px, 3D render)
- assets/images/services/icon-fletes.png (64x64px, 3D render)
- assets/images/services/icon-chofer.png (64x64px, 3D render)
- assets/images/promos/promo-hand-phone.png (~150x150px)
- assets/images/promos/promo-first-ride.png (~200x140px)
- assets/images/promos/promo-delivery.png (~200x140px)
```

---

## 3. SERVICIOS - TABS HEADER

### Común en todas las pantallas de servicios
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `tab-icon-vuelta.png` | Icono pequeño auto para tab | Usando Ionicons |
| `tab-icon-envios.png` | Icono pequeño caja para tab | Usando Ionicons |
| `tab-icon-fletes.png` | Icono pequeño camión para tab | Usando Ionicons |
| `tab-icon-chofer.png` | Icono pequeño persona para tab | Usando Ionicons |

**OPCIONAL** - Los iconos de Ionicons funcionan bien, pero para match exacto con Figma:
```
- assets/images/tabs/tab-vuelta.png (16x16px)
- assets/images/tabs/tab-envios.png (16x16px)
- assets/images/tabs/tab-fletes.png (16x16px)
- assets/images/tabs/tab-chofer.png (16x16px)
```

---

## 4. VUELTA SEGURA

### Vuelta Segura.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `icon-origin-dot.png` | Círculo con punto para origen | Usando View + styles |
| `icon-destination-dot.png` | Círculo negro para destino | Usando View + styles |
| `icon-clock.png` | Icono reloj para historial | Usando Ionicons |

**NO SE REQUIEREN ASSETS ADICIONALES** - La pantalla usa correctamente componentes nativos.

---

## 5. ENVÍOS

### Envíos.png / Enviar articulo.png / Recibir articulo.png
| Asset | Descripción | Ubicación | Estado |
|-------|-------------|-----------|--------|
| `illust-enviar-articulos.png` | Ilustración manos intercambiando sobre con dinero | `EnviosInitialScreen.js:100-102` | **FALTANTE** |
| `illust-recibir-articulos.png` | Ilustración personas con cajas | `EnviosInitialScreen.js:100-102` | **FALTANTE** |
| `illust-como-usar-envios.png` | Ilustración personas con teléfono | `EnviosInitialScreen.js:113-117` | **FALTANTE** |

**ASSETS NECESARIOS:**
```
- assets/images/envios/illust-enviar.png (~150x120px, fondo beige)
- assets/images/envios/illust-recibir.png (~150x120px, fondo beige)
- assets/images/envios/illust-como-usar.png (~200x120px)
```

---

## 6. FLETES

### Fletes.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `illust-programar-flete.png` | Ilustración camión con calendario | **FALTANTE** |
| `illust-flete-inmediato.png` | Ilustración repartidor con cajas | **FALTANTE** |
| `illust-mudanzas.png` | Ilustración casa en camión | **FALTANTE** |
| `illust-mercancias.png` | Ilustración persona con cajas | **FALTANTE** |
| `illust-como-usar-fletes.png` | Ilustración camión con cajas | **FALTANTE** |
| `icon-flete-clasico.png` | Icono camión pequeño | Usando Ionicons |
| `icon-flete-full.png` | Icono camión mediano | Usando Ionicons |
| `icon-flete-express.png` | Icono camión grande | Usando Ionicons |

**ASSETS NECESARIOS:**
```
- assets/images/fletes/illust-programar.png (~150x100px)
- assets/images/fletes/illust-inmediato.png (~150x100px)
- assets/images/fletes/illust-mudanzas.png (~150x100px)
- assets/images/fletes/illust-mercancias.png (~150x100px)
- assets/images/fletes/illust-como-usar.png (~300x100px)
```

---

## 7. CHOFER

### Chofer.png / elegir.png / Programacion Horarios.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `illust-chofer-banner.png` | Ilustración persona con auto amarillo y mapa | **FALTANTE** |
| `car-honda-civic.png` | Foto auto Honda Civic | **FALTANTE** - Para lista de choferes |
| `car-fiat-cronos.png` | Foto auto Fiat Cronos | **FALTANTE** |

**ASSETS NECESARIOS:**
```
- assets/images/chofer/illust-banner.png (~300x150px)
- assets/images/cars/honda-civic.png (~120x60px)
- assets/images/cars/fiat-cronos.png (~120x60px)
```

---

## 8. HISTORIAL

### Historial.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `icon-car-history.png` | Auto pequeño para items de historial | Usando Ionicons |
| `map-preview.png` | Preview de mapa con ruta | Usando MapView (implementado) |

**NO SE REQUIEREN ASSETS ADICIONALES**

---

## 9. MAS (Perfil Menu)

### Mas.png / Perfil/*.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `icon-config.png` | Icono engranaje | Usando Ionicons |
| `icon-earnings.png` | Icono moneda/dinero | Usando Ionicons |
| `icon-legal.png` | Icono información | Usando Ionicons |
| `avatar-placeholder.png` | Avatar circular vacío | Usando View + Ionicons |
| `icon-edit-avatar.png` | Icono lápiz pequeño para editar | Usando Ionicons |

**NO SE REQUIEREN ASSETS ADICIONALES**

---

## 10. MARKETPLACE

### Marketplace.png / Marketplace - Alquiler.png / Vista Producto - Compra.png / Carrito.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `product-monopatin-extreme.png` | Foto monopatín eléctrico Extreme 300 | **FALTANTE** |
| `product-bicicleta-bi200.png` | Foto bicicleta eléctrica Bi-200 | **FALTANTE** |
| `product-bicicleta-spinning.png` | Foto bicicleta spinning Athletic | **FALTANTE** |
| `product-monopatin-xiaomi.png` | Foto monopatín Xiaomi M365 | **FALTANTE** |
| `icon-cart.png` | Icono carrito de compras | Usando Ionicons |
| `icon-filter.png` | Icono filtros | Usando Ionicons |
| `badge-pocos.png` | Badge "POCOS" amarillo | **FALTANTE** |

**ASSETS NECESARIOS:**
```
- assets/images/marketplace/products/*.png (imágenes de productos)
- assets/images/badges/badge-pocos.png (~50x20px)
```

---

## 11. VIAJE ACTIVO / ESPERA

### Viaje aceptado.png / Espera.png / Viaje aceptado Chofer.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `illust-buscando-conductor.png` | Ilustración persona buscando con lupa y auto | **FALTANTE** |
| `marker-destination.png` | Marcador rojo de destino con "2 MIN" | **FALTANTE** - Custom marker |
| `marker-car.png` | Marcador auto en mapa | **FALTANTE** - Custom marker |
| `driver-avatar.png` | Foto de perfil del conductor | Placeholder circular |
| `car-photo.png` | Foto del vehículo del conductor | **FALTANTE** |

**ASSETS NECESARIOS:**
```
- assets/images/ride/illust-buscando.png (~200x150px)
- assets/images/markers/marker-destination.png (~40x50px)
- assets/images/markers/marker-car.png (~30x30px)
```

---

## 12. OPCIONES DE PAGO

### Opciones de pago.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `icon-visa.png` | Logo Visa | **FALTANTE** |
| `icon-mastercard.png` | Logo Mastercard | **FALTANTE** |
| `icon-efectivo.png` | Icono efectivo/billete | **FALTANTE** |

**ASSETS NECESARIOS:**
```
- assets/images/payment/icon-visa.png (~40x25px)
- assets/images/payment/icon-mastercard.png (~40x25px)
- assets/images/payment/icon-efectivo.png (~40x25px)
```

---

## 13. FILTROS (Modales)

### Filtro chofer.png / Fitro marketplace.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| Ninguno requerido | Los filtros usan componentes nativos | OK |

**NO SE REQUIEREN ASSETS ADICIONALES**

---

## 14. BOTTOM TAB BAR (NavBar)

### Común en todas las pantallas
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `tab-home.png` | Icono casa | Usando Ionicons (home-outline) |
| `tab-services.png` | Icono cuadrícula 4 puntos | Usando Ionicons (grid-outline) |
| `tab-history.png` | Icono documento/recibo | Usando Ionicons (receipt-outline) |
| `tab-marketplace.png` | Icono tienda | Usando Ionicons (storefront-outline) |
| `tab-more.png` | Icono 3 puntos | Usando Ionicons (ellipsis-horizontal) |

**OPCIONAL** - Para match exacto con Figma (iconos custom):
```
- assets/images/tabs/tab-home.png (24x24px)
- assets/images/tabs/tab-services.png (24x24px)
- assets/images/tabs/tab-history.png (24x24px)
- assets/images/tabs/tab-marketplace.png (24x24px)
- assets/images/tabs/tab-more.png (24x24px)
```

---

## RESUMEN DE ASSETS PRIORITARIOS

### CRÍTICOS (Impacto visual alto):
1. `logo-vnr.png` - Logo de la app
2. `icon-vuelta-segura.png` - Icono servicio 3D
3. `icon-envios.png` - Icono servicio 3D
4. `icon-fletes.png` - Icono servicio 3D
5. `icon-chofer.png` - Icono servicio 3D
6. `promo-hand-phone.png` - Banner principal Home
7. `illust-enviar.png` - Card Enviar artículos
8. `illust-recibir.png` - Card Recibir artículos
9. `illust-buscando.png` - Pantalla de espera
10. Ilustraciones de Fletes (4 cards)

### MEDIOS (Mejora visual):
- Ilustraciones "Cómo usar" para cada servicio
- Banner de Chofer
- Fotos de autos para selección de chofer
- Productos del Marketplace
- Iconos de métodos de pago

### OPCIONALES (Polish final):
- Iconos custom para tabs
- Markers custom para mapas
- Badge "POCOS" para marketplace

---

## ESTRUCTURA DE CARPETAS SUGERIDA

```
src/assets/images/
├── logo-vnr.png
├── services/
│   ├── icon-vuelta-segura.png
│   ├── icon-envios.png
│   ├── icon-fletes.png
│   └── icon-chofer.png
├── promos/
│   ├── promo-hand-phone.png
│   ├── promo-first-ride.png
│   └── promo-delivery.png
├── envios/
│   ├── illust-enviar.png
│   ├── illust-recibir.png
│   └── illust-como-usar.png
├── fletes/
│   ├── illust-programar.png
│   ├── illust-inmediato.png
│   ├── illust-mudanzas.png
│   ├── illust-mercancias.png
│   └── illust-como-usar.png
├── chofer/
│   └── illust-banner.png
├── ride/
│   └── illust-buscando.png
├── markers/
│   ├── marker-destination.png
│   └── marker-car.png
├── payment/
│   ├── icon-visa.png
│   ├── icon-mastercard.png
│   └── icon-efectivo.png
├── cars/
│   ├── honda-civic.png
│   └── fiat-cronos.png
├── marketplace/
│   └── products/
│       └── [product-images].png
└── tabs/ (opcional)
    ├── tab-home.png
    ├── tab-services.png
    ├── tab-history.png
    ├── tab-marketplace.png
    └── tab-more.png
```

---

**TOTAL DE ASSETS CRÍTICOS NECESARIOS: ~20 imágenes**
**TOTAL DE ASSETS COMPLETOS: ~40 imágenes**

Por favor, exporta estos assets desde Figma y los integraré en la implementación.
