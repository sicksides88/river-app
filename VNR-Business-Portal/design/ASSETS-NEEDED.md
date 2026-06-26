# ASSETS NECESARIOS - VNR App

Este documento lista todos los assets requeridos para completar la implementación pixel-perfect.
Los placeholders ya están en el código (usando Ionicons), solo necesitan ser reemplazados con los assets reales del Figma.

---

## SECCIÓN 1: AUTH (Login + Registro)

| Asset | Tamaño | Descripción | Ubicación en código |
|-------|--------|-------------|---------------------|
| `logo-vnr.png` | 100x100 | Logo de la app para pantallas de auth | `LoginScreen.js`, `RegisterScreen.js` |
| `flag-argentina.png` | 24x16 | Bandera Argentina para selector país | `RegisterScreen.js` |

---

## SECCIÓN 2: TAB BAR (Navegación inferior)

| Asset | Tamaño | Descripción | Ubicación en código |
|-------|--------|-------------|---------------------|
| `icon-home.png` | 24x24 | Ícono casa (outline) | `TabBar.js` |
| `icon-home-filled.png` | 24x24 | Ícono casa (filled/activo) | `TabBar.js` |
| `icon-services.png` | 24x24 | Ícono grid 4 cuadros | `TabBar.js` |
| `icon-services-filled.png` | 24x24 | Ícono grid filled | `TabBar.js` |
| `icon-history.png` | 24x24 | Ícono documento/historial | `TabBar.js` |
| `icon-history-filled.png` | 24x24 | Ícono documento filled | `TabBar.js` |
| `icon-marketplace.png` | 24x24 | Ícono tienda | `TabBar.js` |
| `icon-marketplace-filled.png` | 24x24 | Ícono tienda filled | `TabBar.js` |
| `icon-more.png` | 24x24 | Ícono 3 puntos horizontales | `TabBar.js` |

**Nota:** Actualmente usando Ionicons como placeholder. Si los íconos del Figma son custom, necesito los PNGs.

---

## SECCIÓN 3: SERVICIOS (Tab Servicios + Home Grid)

| Asset | Tamaño | Descripción | Ubicación en código |
|-------|--------|-------------|---------------------|
| `service-vuelta-segura.png` | 72x72 | Auto 3D estilizado | `ServicesTabScreen.js`, `HomeScreen.js` |
| `service-envios.png` | 72x72 | Camión delivery 3D | `ServicesTabScreen.js`, `HomeScreen.js` |
| `service-fletes.png` | 72x72 | Camión mudanza 3D | `ServicesTabScreen.js`, `HomeScreen.js` |
| `service-chofer.png` | 72x72 | Auto con chofer 3D | `ServicesTabScreen.js`, `HomeScreen.js` |

---

## SECCIÓN 4: HOME

| Asset | Tamaño | Descripción | Ubicación en código |
|-------|--------|-------------|---------------------|
| `promo-hand-phone.png` | 160x160 | Mano sosteniendo celular con mapa | `HomeScreen.js` |
| `promo-first-ride.png` | 400x280 | Ilustración persona con auto/mapa | `HomeScreen.js` |
| `promo-delivery.png` | 400x280 | Ilustración envíos/delivery | `HomeScreen.js` |

---

## SECCIÓN 5: MARKETPLACE

| Asset | Tamaño | Descripción | Ubicación en código |
|-------|--------|-------------|---------------------|
| `product-monopatin-1.png` | 200x200 | Monopatín Extreme 300 | `MarketplaceScreen.js` |
| `product-bicicleta-1.png` | 200x200 | Bicicleta Electrica Bi-200 | `MarketplaceScreen.js` |
| `product-bicicleta-2.png` | 200x200 | Bicicleta Spinning | `MarketplaceScreen.js` |
| `product-monopatin-2.png` | 200x200 | Monopatín Xiaomi M365 | `MarketplaceScreen.js` |

**Nota:** Las imágenes de productos vendrán de la API en producción. Solo necesito placeholders para desarrollo.

---

## SECCIÓN 6: VUELTA SEGURA

| Asset | Tamaño | Descripción | Ubicación en código |
|-------|--------|-------------|---------------------|
| `marker-origin.png` | 24x24 | Marcador verde para origen | `MapViewWrapper.js` |
| `marker-destination.png` | 24x24 | Marcador rojo para destino | `MapViewWrapper.js` |
| `car-marker.png` | 32x32 | Auto en el mapa | `MapViewWrapper.js`, `TripActiveScreen.js` |
| `driver-placeholder.png` | 60x60 | Foto placeholder conductor | `TripActiveScreen.js` |

**Pantallas actualizadas:**
- `VueltaSeguraScreen.js` - Planificar viaje
- `SelectServiceScreen.js` - Elegir servicio y método de pago
- `TripActiveScreen.js` - Viaje aceptado con info del conductor

---

## SECCIÓN 7: ENVÍOS

| Asset | Tamaño | Descripción | Ubicación en código |
|-------|--------|-------------|---------------------|
| `package-sobre.png` | 48x48 | Ícono sobre/documento | `EnviosScreen.js` |
| `package-caja-s.png` | 48x48 | Ícono caja pequeña (S) | `EnviosScreen.js` |
| `package-caja-m.png` | 48x48 | Ícono caja mediana (M) | `EnviosScreen.js` |
| `package-caja-l.png` | 48x48 | Ícono caja grande (L) | `EnviosScreen.js` |
| `package-fragil.png` | 48x48 | Ícono frágil | `EnviosScreen.js` |

**Pantalla actualizada:** `EnviosScreen.js` - Planificar envío con selector de tipo de paquete

---

## SECCIÓN 8: FLETES

| Asset | Tamaño | Descripción | Ubicación en código |
|-------|--------|-------------|---------------------|
| `vehicle-utilitario.png` | 56x56 | Utilitario (hasta 500kg) | `FletesScreen.js` |
| `vehicle-camioneta.png` | 56x56 | Camioneta (hasta 1000kg) | `FletesScreen.js` |
| `vehicle-camion-s.png` | 56x56 | Camión pequeño (hasta 2000kg) | `FletesScreen.js` |
| `vehicle-camion-l.png` | 56x56 | Camión grande (hasta 5000kg) | `FletesScreen.js` |

**Pantalla actualizada:** `FletesScreen.js` - Planificar flete con selector de vehículo y ayudantes

---

## SECCIÓN 9: PAGOS

| Asset | Tamaño | Descripción | Ubicación en código |
|-------|--------|-------------|---------------------|
| `payment-cash.png` | 32x32 | Ícono efectivo | `SelectServiceScreen.js` |
| `payment-card.png` | 32x32 | Ícono tarjeta | `SelectServiceScreen.js` |
| `payment-mercadopago.png` | 32x32 | Logo MercadoPago | (futuro) |

---

## SECCIÓN 10: PERFIL

| Asset | Tamaño | Descripción | Ubicación en código |
|-------|--------|-------------|---------------------|
| `avatar-placeholder.png` | 80x80 | Avatar placeholder usuario | `ProfileScreen.js` |
| `icon-settings.png` | 24x24 | Ícono configuración | `ProfileScreen.js` |
| `icon-earnings.png` | 24x24 | Ícono ganancias/dinero | `ProfileScreen.js` |
| `icon-legal.png` | 24x24 | Ícono legal/documento | `ProfileScreen.js` |
| `icon-help.png` | 24x24 | Ícono ayuda/soporte | `ProfileScreen.js` |
| `icon-logout.png` | 24x24 | Ícono cerrar sesión | `ProfileScreen.js` |

---

## RESUMEN POR PRIORIDAD

### ALTA (Bloquean flujos principales)
- [ ] `logo-vnr.png` - Logo principal de la app
- [ ] `service-vuelta-segura.png` - Ícono servicio Vuelta Segura
- [ ] `service-envios.png` - Ícono servicio Envíos
- [ ] `service-fletes.png` - Ícono servicio Fletes
- [ ] `service-chofer.png` - Ícono servicio Chofer

### MEDIA (Mejoran UX significativamente)
- [ ] Tab bar icons (si son custom del Figma)
- [ ] `driver-placeholder.png` - Foto placeholder conductor
- [ ] Map markers (`marker-origin.png`, `marker-destination.png`)
- [ ] `promo-hand-phone.png` - Ilustración promo principal

### BAJA (Para features secundarios)
- [ ] Package type icons (Envíos)
- [ ] Vehicle type icons (Fletes)
- [ ] Payment method icons
- [ ] Product images (Marketplace - vendrán de API)
- [ ] Promo cards illustrations

---

## FORMATOS REQUERIDOS

Para compatibilidad con React Native y diferentes densidades de pantalla:

```
assets/
├── images/
│   ├── logo-vnr.png      (100x100)
│   ├── logo-vnr@2x.png   (200x200)
│   ├── logo-vnr@3x.png   (300x300)
│   └── ...
```

**Recomendación:** Exportar desde Figma en formato PNG con fondo transparente, en 1x, 2x y 3x.

---

*Última actualización: 7 Diciembre 2024*
*Pantallas implementadas: Login, Register, Home, Services Tab, Vuelta Segura (3 screens), Envíos, Fletes, Historial, Marketplace*
