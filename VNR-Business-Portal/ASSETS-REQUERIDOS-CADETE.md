# ASSETS REQUERIDOS - SECCIÓN CADETE (CONDUCTOR)

## Resumen del Análisis Figma vs Implementación

Este documento lista todos los assets gráficos necesarios para la sección de Conductor/Cadete.

---

## 1. AUTENTICACIÓN CONDUCTOR

### Login.png / Registro.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `logo-vnr.png` | Logo principal (mismo que USER) | **FALTANTE** |

**NOTA:** Comparte las mismas pantallas que USER - usar mismos assets.

---

## 2. ELECCIÓN DE SERVICIO (Onboarding)

### Elección de servicio.png
| Asset | Descripción | Ubicación en código | Estado |
|-------|-------------|---------------------|--------|
| `icon-service-vuelta-segura.png` | Auto blanco 3D para card Vuelta Segura | `DriverServiceSelectionScreen.js` | **FALTANTE** |
| `icon-service-envios.png` | Moto/scooter 3D para card Envíos | `DriverServiceSelectionScreen.js` | **FALTANTE** |
| `icon-service-fletes.png` | Camión 3D para card Fletes | `DriverServiceSelectionScreen.js` | **FALTANTE** |
| `icon-service-chofer.png` | Auto con persona 3D para card Chofer | `DriverServiceSelectionScreen.js` | **FALTANTE** |

**ASSETS NECESARIOS:**
```
- assets/images/driver/services/icon-vuelta-segura.png (~80x50px, 3D render)
- assets/images/driver/services/icon-envios.png (~80x50px, 3D render)
- assets/images/driver/services/icon-fletes.png (~80x50px, 3D render)
- assets/images/driver/services/icon-chofer.png (~80x50px, 3D render)
```

---

## 3. PASOS DE REGISTRO / DOCUMENTOS

### Pasos registro.png / Foto perfil.png / Foto licencia.png / Foto cédula.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `avatar-placeholder.png` | Silueta de persona gris para foto de perfil | Usando Ionicons (OK) |
| `illust-licencia-frente.png` | Ilustración licencia frente (placeholder azul) | **FALTANTE** |
| `illust-licencia-dorso.png` | Ilustración licencia dorso (placeholder celeste) | **FALTANTE** |
| `illust-cedula-frente.png` | Ilustración cédula verde frente | **FALTANTE** |
| `illust-cedula-dorso.png` | Ilustración cédula verde dorso | **FALTANTE** |

**ASSETS NECESARIOS:**
```
- assets/images/driver/documents/illust-licencia-frente.png (~180x100px)
- assets/images/driver/documents/illust-licencia-dorso.png (~180x100px)
- assets/images/driver/documents/illust-cedula-frente.png (~180x100px)
- assets/images/driver/documents/illust-cedula-dorso.png (~180x100px)
```

---

## 4. HOME CONDUCTOR (Inicio)

### Inicio.png / Selección de viaje.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `marker-driver-location.png` | Marcador de brújula/ubicación del conductor | **FALTANTE** - Custom marker |
| `icon-earnings-badge.png` | Badge negro con "$0,00" | Usando View + Text (OK) |
| `btn-iniciar.png` | Botón circular "INICIAR" negro | Usando View + styles (OK) |
| `icon-my-location.png` | Icono GPS/ubicación actual | Usando Ionicons (OK) |

**ASSETS NECESARIOS:**
```
- assets/images/markers/marker-driver-compass.png (~50x50px, círculo con flecha)
```

---

## 5. SELECCIÓN DE VIAJE / SOLICITUD

### Selección de viaje - Iniciar.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `badge-vuelta-segura.png` | Badge negro "Vuelta segura" | Usando View + styles (OK) |
| `icon-star-rating.png` | Estrella amarilla para rating | Usando Ionicons (star) |
| `icon-origin-destination.png` | Iconos círculo + punto para ruta | Usando View + styles (OK) |

**NO SE REQUIEREN ASSETS ADICIONALES** - Se puede lograr con componentes.

---

## 6. GANANCIAS

### Ganancias.png / Detalles de Ganancias.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `icon-help.png` | Icono de ayuda (círculo con ?) | Usando Ionicons (help-circle-outline) |
| `icon-lightning.png` | Icono rayo para "Retirar ganancias" | **FALTANTE** |

**ASSETS NECESARIOS:**
```
- assets/images/icons/icon-lightning.png (~24x24px, rayo/flash)
```

**Gráfico de barras:** Se implementa con librería de charts (react-native-chart-kit o similar), no requiere assets.

---

## 7. BILLETERA

### Billetera.png / Agregar cuenta bancaria.png / Método de pago.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `icon-credit-card.png` | Icono tarjeta de crédito | Usando Ionicons (card-outline) |
| `icon-help-circle.png` | Icono ayuda | Usando Ionicons (help-circle-outline) |

**NO SE REQUIEREN ASSETS ADICIONALES**

---

## 8. MENÚ CONDUCTOR

### Menú.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `avatar-placeholder.png` | Avatar circular del conductor | Usando View + Ionicons |
| `icon-edit-avatar.png` | Icono lápiz para editar | Usando Ionicons (pencil) |
| `icon-vehicles.png` | Icono auto | Usando Ionicons (car-outline) |
| `icon-documents.png` | Icono documento | Usando Ionicons (document-outline) |
| `icon-insurance.png` | Icono escudo/seguro | Usando Ionicons (shield-outline) |
| `icon-payment-method.png` | Icono tarjeta | Usando Ionicons (card-outline) |
| `icon-about.png` | Icono información | Usando Ionicons (information-circle-outline) |

**NO SE REQUIEREN ASSETS ADICIONALES** - Ionicons cubre todo.

---

## 9. VEHÍCULOS

### Vehículos.png / Información del vehículo.png / Requisitos del vehículo.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `car-honda-civic-silver.png` | Foto Honda Civic Silver | **FALTANTE** |
| `icon-add-vehicle.png` | Icono auto con + | Usando Ionicons (car-outline + add) |

**ASSETS NECESARIOS:**
```
- assets/images/cars/honda-civic-silver.png (~100x50px)
- assets/images/cars/[otros modelos].png (según se agreguen)
```

---

## 10. DOCUMENTOS

### Documentos.png / Documentos-1.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `car-thumbnail.png` | Miniatura del auto en lista | **FALTANTE** - Mismo que vehículos |
| `icon-status-complete.png` | Indicador verde "Completo" | Usando Text con color verde |
| `icon-status-pending.png` | Indicador naranja "Vence el..." | Usando Text con color naranja |

**NO SE REQUIEREN ASSETS ADICIONALES**

---

## 11. NOTIFICACIONES

### Notificaciones.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `badge-notification.png` | Badge circular negro para notificación nueva | Usando View + styles |

**NO SE REQUIEREN ASSETS ADICIONALES**

---

## 12. BOTTOM TAB BAR CONDUCTOR

### NavBar.png
| Asset | Descripción | Estado |
|-------|-------------|--------|
| `tab-inicio.png` | Icono casa con círculo | Usando Ionicons (home-outline) |
| `tab-ganancias.png` | Icono dólar con flechas circulares | **FALTANTE** - Custom icon |
| `tab-notificaciones.png` | Icono campana | Usando Ionicons (notifications-outline) |
| `tab-menu.png` | Icono 3 líneas horizontales | Usando Ionicons (menu-outline) |

**ASSETS NECESARIOS (OPCIONAL para match exacto):**
```
- assets/images/driver/tabs/tab-ganancias.png (~24x24px, $ con flechas circulares)
```

---

## RESUMEN DE ASSETS PRIORITARIOS - CADETE

### CRÍTICOS (Impacto visual alto):
1. `icon-service-vuelta-segura.png` - Card selección de servicio
2. `icon-service-envios.png` - Card selección de servicio
3. `icon-service-fletes.png` - Card selección de servicio
4. `icon-service-chofer.png` - Card selección de servicio
5. `car-honda-civic-silver.png` - Lista de vehículos

### MEDIOS (Mejora visual):
- Ilustraciones de documentos (licencia frente/dorso, cédula)
- Marcador de ubicación del conductor
- Icono de rayo para ganancias

### OPCIONALES (Polish final):
- Tab icon custom para ganancias
- Fotos de otros modelos de autos

---

## ESTRUCTURA DE CARPETAS SUGERIDA

```
src/assets/images/driver/
├── services/
│   ├── icon-vuelta-segura.png
│   ├── icon-envios.png
│   ├── icon-fletes.png
│   └── icon-chofer.png
├── documents/
│   ├── illust-licencia-frente.png
│   ├── illust-licencia-dorso.png
│   ├── illust-cedula-frente.png
│   └── illust-cedula-dorso.png
├── tabs/
│   └── tab-ganancias.png (opcional)
└── markers/
    └── marker-driver-compass.png
```

---

## COMPARACIÓN CON IMPLEMENTACIÓN ACTUAL

### Pantallas implementadas vs Figma:

| Pantalla Figma | Archivo Implementado | Estado |
|----------------|---------------------|--------|
| Login.png | `LoginScreen.js` | ✅ Implementado |
| Registro.png | `RegisterScreen.js` | ✅ Implementado |
| Elección de servicio.png | `DriverServiceSelectionScreen.js` | ✅ Implementado (faltan assets) |
| Pasos registro.png | `DriverWelcomeScreen.js` | ✅ Implementado |
| Foto perfil.png | `PhotoUploadScreen.js` | ✅ Implementado |
| Foto licencia.png | `DocumentsScreen.js` | ✅ Implementado (faltan ilustraciones) |
| Foto cédula.png | `DocumentsScreen.js` | ✅ Implementado |
| Inicio.png | `DriverHomeScreen.js` | ✅ Implementado |
| Selección de viaje.png | `DriverHomeScreen.js` | ✅ Implementado |
| Selección de viaje - Iniciar.png | `TripRequestScreen.js` | ✅ Implementado |
| Ganancias.png | `DriverEarningsScreen.js` | ✅ Implementado |
| Detalles de Ganancias.png | `EarningsDetailScreen.js` | ✅ Implementado |
| Billetera.png | `WalletScreen.js` | ✅ Implementado |
| Agregar cuenta bancaria.png | `AddBankAccountScreen.js` | ✅ Implementado |
| Método de pago.png | `PaymentMethodsScreen.js` | ✅ Implementado |
| Menú.png | `DriverMenuScreen.js` | ✅ Implementado |
| Vehículos.png | `VehiclesScreen.js` | ✅ Implementado |
| Información del vehículo.png | `VehicleInfoScreen.js` | ✅ Implementado |
| Requisitos del vehículo.png | `AddVehicleScreen.js` | ✅ Implementado |
| Documentos.png | `DocumentsScreen.js` | ✅ Implementado |
| Notificaciones.png | `DriverNotificationsScreen.js` | ✅ Implementado |
| NavBar.png | Navigation config | ✅ Implementado |

**RESULTADO: Todas las pantallas están implementadas. Solo faltan assets gráficos.**

---

**TOTAL DE ASSETS CRÍTICOS NECESARIOS: ~6 imágenes**
**TOTAL DE ASSETS COMPLETOS: ~12 imágenes**

Por favor, exporta estos assets desde Figma y los integraré en la implementación.
