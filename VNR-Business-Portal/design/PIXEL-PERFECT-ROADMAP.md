# ROADMAP: Pixel Perfect Implementation

## Resumen del Análisis Figma

He analizado **45+ capturas** del diseño Figma. A continuación el plan de implementación organizado por secciones.

---

## PATRONES DE DISEÑO DETECTADOS

### Colores Principales
- **Fondo**: `#FFFFFF` (blanco puro)
- **Texto principal**: `#000000` (negro)
- **Texto secundario**: `#666666` / `#999999`
- **Bordes**: `#E5E5E5` / `#F0F0F0`
- **Acento/CTA**: `#000000` (negro para botones principales)
- **Error**: `#FF0000` (rojo para cancelar)
- **Destacado**: `#FFD700` (amarillo/dorado para badges como "POCOS")

### Tipografía
- **Títulos grandes**: 28-32px, font-weight: 700
- **Subtítulos**: 18-20px, font-weight: 600
- **Body**: 14-16px, font-weight: 400
- **Labels pequeños**: 12px, font-weight: 500
- **Precios**: 20-28px, font-weight: 700

### Componentes Clave
- **Inputs**: Bordes redondeados `25px` (pill shape), fondo gris claro `#F5F5F5`
- **Botones principales**: Negro `#000000`, texto blanco, border-radius `25px`
- **Botones secundarios**: Borde negro, fondo blanco, border-radius `25px`
- **Cards**: Border-radius `16px`, sombra sutil, fondo blanco
- **Bottom Tab Bar**: 5 iconos, fondo blanco, iconos línea

### Bottom Navigation (Tab Bar)
```
[Home] [Servicios] [Historial] [Marketplace] [Más]
  ⌂       ⊞         📋          🏪          •••
```

---

## SECCIÓN 1: AUTENTICACIÓN (01-Auth)

### Pantallas
| Archivo | Propósito | Estado Actual |
|---------|-----------|---------------|
| Login.png | Inicio de sesión | EXISTE - Necesita ajustes |
| Registro.png | Registro de usuario | EXISTE - Necesita ajustes |

### Cambios Requeridos - LoginScreen

**Figma muestra:**
- Logo/marca arriba centrado
- Texto "Bienvenido a VNR" grande
- Input Email con ícono de sobre
- Input Contraseña con ícono candado y eye toggle
- Botón "Iniciar sesión" negro pill
- Link "¿Olvidaste tu contraseña?"
- Separador "o continuar con"
- Botones sociales (Google, Apple, Facebook) - iconos en círculos
- Link "¿No tienes cuenta? Regístrate"

**ASSETS NECESARIOS:**
- [ ] Logo VNR (PNG/SVG)
- [ ] Ícono Google
- [ ] Ícono Apple
- [ ] Ícono Facebook

### Cambios Requeridos - RegisterScreen

**Figma muestra:**
- Título "Crear cuenta"
- Input Nombre completo
- Input Email
- Input Teléfono con código de país (+54)
- Input Contraseña
- Input Confirmar contraseña
- Checkbox términos y condiciones
- Botón "Registrarse" negro pill

---

## SECCIÓN 2: HOME (02-Home)

### Pantallas
| Archivo | Propósito | Estado Actual |
|---------|-----------|---------------|
| Home.png | Pantalla principal | EXISTE - Necesita rediseño |
| Servicios.png | Modal/vista de servicios | PARCIAL |

### Cambios Requeridos - HomeScreen

**Figma muestra:**
- Header con "¡Hola, [Nombre]!" y avatar
- Barra de búsqueda "¿A dónde vamos?"
- Mapa grande mostrando ubicación
- Sección "Servicios" con 4 cards horizontales:
  - Vuelta Segura (ícono auto)
  - Envíos (ícono caja)
  - Fletes (ícono camión)
  - Chofer (ícono persona)
- Sección "Actividad reciente" con lista de viajes
- Bottom Tab Bar

**ASSETS NECESARIOS:**
- [ ] Ícono Vuelta Segura (auto estilizado)
- [ ] Ícono Envíos (caja/paquete)
- [ ] Ícono Fletes (camión)
- [ ] Ícono Chofer (persona con volante)
- [ ] Íconos Tab Bar (home, servicios, historial, marketplace, más)

---

## SECCIÓN 3: VUELTA SEGURA (03-VueltaSegura)

### Pantallas
| Archivo | Propósito | Estado Actual |
|---------|-----------|---------------|
| Vuelta Segura.png | Formulario solicitud | EXISTE - Ajustes |
| Elegí.png | Selección de conductor | NO EXISTE |
| Viaje aceptado.png | Confirmación viaje | NO EXISTE |
| Espera.png | Pantalla de espera | NO EXISTE |
| programar.png | Dropdown ahora/programar | Componente nuevo |
| hora.png | Selector fecha/hora | Componente nuevo |
| Opciones.png | Menú cancelar/cambiar | Componente nuevo |

### Flujo Completo Vuelta Segura

**3.1 VueltaSeguraScreen (Formulario)**
- Input "¿Dónde te recogemos?" con ícono ubicación verde
- Input "¿A dónde vas?" con ícono ubicación rojo
- Línea conectando los dos puntos
- Dropdown "Iniciar viaje" → Ahora / Programar
- Si Programar: picker de Día, Hora, Min (scroll wheels)
- Botón "Buscar conductor"

**3.2 ElegirConductorScreen (NUEVA)**
- Mapa con ruta trazada
- Card inferior con info del conductor:
  - Foto conductor
  - Nombre, rating (estrellas amarillas)
  - Info del vehículo (marca, modelo, patente)
  - Tiempo estimado "2 MIN"
  - Precio "$1500"
- Botón "Aceptar"

**3.3 ViajeAceptadoScreen (NUEVA)**
- Mapa con conductor acercándose
- Card con:
  - Foto conductor circular
  - "Carlos Rodríguez" - ★4.5
  - "Toyota Corolla - ABC 123"
  - "Llegando en 3 min"
- Botones: Mensaje, Llamar
- Menú 3 puntos → Cancelar viaje / Cambiar conductor

**3.4 EsperaScreen (NUEVA)**
- Mapa con ubicación actual
- Animación/indicador de búsqueda
- "Buscando conductor..."
- Opción cancelar

**ASSETS NECESARIOS:**
- [ ] Dot verde (origen)
- [ ] Dot rojo (destino)
- [ ] Ícono auto en mapa
- [ ] Foto placeholder conductor

---

## SECCIÓN 4: ENVÍOS (04-Envios)

### Pantallas
| Archivo | Propósito | Estado Actual |
|---------|-----------|---------------|
| Envíos.png | Home envíos | EXISTE - Rediseñar |
| Enviar articulo.png | Formulario envío | Ajustes |
| Recibir articulo.png | Tracking envío | NO EXISTE |
| Envíos-tipos.png | Selección tipo paquete | NO EXISTE |
| Envíos-tipos-ok.png | Tipo seleccionado | NO EXISTE |
| Envíos-Dimensiones.png | Input dimensiones | NO EXISTE |
| Opciones de pago.png | Métodos de pago | NO EXISTE |

### Flujo Envíos

**4.1 EnviosHomeScreen**
- Título "Envíos"
- 2 cards grandes:
  - "Enviar artículo" - ícono caja saliendo
  - "Recibir artículo" - ícono caja entrando

**4.2 EnviarArticuloScreen**
- Input origen con autocompletado
- Input destino con autocompletado
- Sección "Tipo de paquete" con chips seleccionables:
  - Sobre
  - Caja pequeña
  - Caja mediana
  - Caja grande
  - Frágil
- Al seleccionar caja → modal dimensiones (Alto, Ancho, Largo, Peso)
- Card precio estimado
- Botón "Continuar"

**4.3 OpcionesPagoScreen**
- Título "Opciones de pago"
- Cards seleccionables:
  - Efectivo
  - Tarjeta de crédito/débito
  - MercadoPago
- Botón "Confirmar envío"

**ASSETS NECESARIOS:**
- [ ] Ícono sobre
- [ ] Ícono caja pequeña
- [ ] Ícono caja mediana
- [ ] Ícono caja grande
- [ ] Ícono frágil
- [ ] Ícono efectivo
- [ ] Ícono tarjeta
- [ ] Ícono MercadoPago

---

## SECCIÓN 5: FLETES (05-Fletes)

### Pantallas
| Archivo | Propósito | Estado Actual |
|---------|-----------|---------------|
| Fletes.png | Home fletes | EXISTE - Rediseñar |
| Orígen.png | Input origen | Componente |
| Destino.png | Input destino | Componente |
| Tipos.png | Selección vehículo | NO EXISTE |
| Tipos-ok.png | Vehículo seleccionado | NO EXISTE |
| Dimensiones.png | Input dimensiones | Componente |
| Opciones de pago.png | Métodos de pago | Reusar |

### Flujo Fletes

**5.1 FletesScreen**
- Título "Fletes"
- Subtítulo "Mudanzas y cargas grandes"
- Input origen expandible (lista lugares guardados)
- Input destino expandible
- Sección "Tipo de vehículo":
  - Utilitario (hasta 500kg)
  - Camioneta (hasta 1000kg)
  - Camión pequeño (hasta 2000kg)
  - Camión grande (hasta 5000kg)
- Input dimensiones carga
- Card precio estimado
- Botón "Solicitar flete"

**ASSETS NECESARIOS:**
- [ ] Ícono utilitario
- [ ] Ícono camioneta
- [ ] Ícono camión pequeño
- [ ] Ícono camión grande

---

## SECCIÓN 6: CHOFER (06-Chofer)

### Pantallas
| Archivo | Propósito | Estado Actual |
|---------|-----------|---------------|
| Chofer.png | Home chofer | NO EXISTE |
| elegir.png | Lista conductores | NO EXISTE |
| elegir2.png | Conductor seleccionado | NO EXISTE |
| Programacion Horarios.png | Calendario/horarios | NO EXISTE |
| Viaje aceptado Chofer.png | Confirmación | NO EXISTE |
| Filtro chofer.png | Modal filtros | NO EXISTE |

### Flujo Chofer (Servicio Premium)

**6.1 ChoferHomeScreen**
- Título "Chofer Privado"
- Descripción servicio
- Input origen
- Input destino
- Dropdown duración (por hora, medio día, día completo)
- Botón "Ver conductores disponibles"

**6.2 ElegirChoferScreen**
- Lista de conductores con:
  - Foto
  - Nombre
  - Rating
  - Años experiencia
  - Vehículo
  - Precio/hora
- Filtros: Precio, Hora, Vehículo, Puntación

**6.3 ChoferDetailScreen**
- Foto grande conductor
- Info completa
- Horarios disponibles (calendario)
- Botón "Contratar"

**ASSETS NECESARIOS:**
- [ ] Fotos placeholder conductores
- [ ] Ícono filtro
- [ ] Ícono calendario

---

## SECCIÓN 7: HISTORIAL (07-Historial)

### Pantallas
| Archivo | Propósito | Estado Actual |
|---------|-----------|---------------|
| Historial.png | Lista actividad | PLACEHOLDER |

### HistorialScreen (ActivityScreen)

**Figma muestra:**
- Título "Historial"
- Tabs: "Anteriores" (activo)
- Card destacada con mapa mini del último viaje
- Lista de viajes pasados:
  - Ícono servicio (auto/caja/camión)
  - Dirección destino
  - Fecha y hora
  - Precio
- Filtro por fecha

**ASSETS NECESARIOS:**
- [ ] Mini iconos de servicios para lista

---

## SECCIÓN 8: MARKETPLACE (08-Marketplace)

### Pantallas - SECCIÓN NUEVA COMPLETA
| Archivo | Propósito | Estado Actual |
|---------|-----------|---------------|
| Marketplace.png | Grid productos compra | NO EXISTE |
| Marketplace - Alquiler.png | Grid productos alquiler | NO EXISTE |
| Vista Producto - Compra.png | Detalle producto | NO EXISTE |
| Carrito.png | Carrito compra | NO EXISTE |
| Carrito alquiler.png | Carrito alquiler | NO EXISTE |
| Fitro marketplace.png | Filtros compra | NO EXISTE |
| Fitro marketplace2.png | Filtros alquiler | NO EXISTE |

### Flujo Marketplace

**8.1 MarketplaceScreen**
- Tabs: "Comprar" | "Alquilar"
- Barra búsqueda
- Botón filtros
- Grid 2 columnas de productos:
  - Imagen producto
  - Badge "POCOS" si stock bajo
  - Nombre
  - Rating (estrellas)
  - Precio (compra o /Hora para alquiler)

**8.2 ProductDetailScreen**
- Carousel de imágenes
- Nombre producto
- Rating
- Variantes (colores/tamaños)
- Descripción expandible
- Precio
- Botón "Añadir al carrito"

**8.3 CartScreen**
- Lista productos:
  - Imagen
  - Nombre
  - Precio
  - Cantidad (+/-)
  - Botón eliminar
- Input cupón descuento
- Resumen:
  - Subtotal
  - Cantidad horas (si alquiler)
  - Total
- Botón "Finalizar compra/alquiler"
- Botón secundario "Continuar comprando"

**ASSETS NECESARIOS:**
- [ ] Imágenes productos (monopatines, bicicletas)
- [ ] Ícono carrito
- [ ] Ícono filtro
- [ ] Badge "POCOS"

---

## SECCIÓN 9: PERFIL/MÁS (09-Perfil)

### Pantallas
| Archivo | Propósito | Estado Actual |
|---------|-----------|---------------|
| Mas.png | Menú perfil | EXISTE - Rediseñar |
| Informacion.png | Info personal | NO EXISTE |
| Seguridad.png | Opciones seguridad | NO EXISTE |
| Protección de datos.png | Privacidad | NO EXISTE |
| Seguridad/Contraseña.png | Cambiar contraseña | NO EXISTE |
| Seguridad/Teléfono.png | Teléfono recuperación | NO EXISTE |

### Flujo Perfil

**9.1 MasScreen (ProfileScreen)**
- Header con nombre usuario y avatar
- Lista opciones:
  - ⚙️ Configuración
  - 💰 Genera ganancias: conduce o haz entregas
  - ℹ️ Legal
- Sin bottom bar visible (está en "Más")

**9.2 ConfiguracionScreen**
- Tabs: "Información personal" | "Seguridad" | "Protección de datos"

**9.3 InformacionPersonalScreen**
- Avatar con botón editar
- Campos:
  - Nombre → editable
  - Género → selector
  - Número de teléfono → editable
  - Correo electrónico → editable
  - Verificar identidad → "Agregar tu ID"

**9.4 SeguridadScreen**
- Contraseña → navega a cambio
- Teléfono recuperación → navega a agregar

**9.5 CambiarContrasenaScreen**
- Instrucciones
- Input contraseña actual
- Input nueva contraseña (con eye toggle)
- Input confirmar contraseña
- Botón "Actualizar"

**9.6 TelefonoRecuperacionScreen**
- Input con código país (+54) y número
- Texto: "Se enviará código de verificación"
- Botón "Actualizar"

**ASSETS NECESARIOS:**
- [ ] Ícono configuración
- [ ] Ícono ganancias/dinero
- [ ] Ícono legal
- [ ] Bandera Argentina para código país

---

## PRIORIDAD DE IMPLEMENTACIÓN

### FASE 1: Componentes Base (CRÍTICO)
1. [ ] Actualizar theme.js con colores exactos de Figma
2. [ ] Crear/actualizar componente Input pill-shaped
3. [ ] Crear/actualizar componente Button (primario/secundario)
4. [ ] Crear componente TabBar inferior
5. [ ] Crear componente Card estándar

### FASE 2: Auth (ALTA)
6. [ ] Rediseñar LoginScreen
7. [ ] Rediseñar RegisterScreen

### FASE 3: Home (ALTA)
8. [ ] Rediseñar HomeScreen con servicios horizontales
9. [ ] Implementar TabBar global

### FASE 4: Vuelta Segura (ALTA)
10. [ ] Ajustar VueltaSeguraScreen
11. [ ] Crear ElegirConductorScreen
12. [ ] Crear ViajeAceptadoScreen
13. [ ] Crear componentes: TimePicker, OptionsMenu

### FASE 5: Envíos (MEDIA)
14. [ ] Crear EnviosHomeScreen con 2 opciones
15. [ ] Crear flujo EnviarArticulo
16. [ ] Crear TiposPaqueteSelector
17. [ ] Crear OpcionesPagoScreen

### FASE 6: Fletes (MEDIA)
18. [ ] Actualizar FletesScreen con selector vehículos
19. [ ] Crear TiposVehiculoSelector

### FASE 7: Chofer (MEDIA)
20. [ ] Crear ChoferHomeScreen
21. [ ] Crear ElegirChoferScreen
22. [ ] Crear FiltrosChoferModal
23. [ ] Crear ChoferDetailScreen

### FASE 8: Historial (MEDIA)
24. [ ] Rediseñar ActivityScreen según Figma

### FASE 9: Marketplace (BAJA - Feature nuevo)
25. [ ] Crear MarketplaceScreen
26. [ ] Crear ProductDetailScreen
27. [ ] Crear CartScreen
28. [ ] Crear FiltrosMarketplace

### FASE 10: Perfil (BAJA)
29. [ ] Rediseñar ProfileScreen
30. [ ] Crear ConfiguracionScreen con tabs
31. [ ] Crear InformacionPersonalScreen
32. [ ] Crear SeguridadScreen
33. [ ] Crear CambiarContrasenaScreen
34. [ ] Crear TelefonoRecuperacionScreen

---

## LISTA COMPLETA DE ASSETS NECESARIOS

### Íconos de Servicios
- [ ] Logo VNR
- [ ] Vuelta Segura (auto)
- [ ] Envíos (caja)
- [ ] Fletes (camión)
- [ ] Chofer (persona)

### Íconos Tab Bar
- [ ] Home (casa outline/filled)
- [ ] Servicios (grid 4 cuadros)
- [ ] Historial (documento/lista)
- [ ] Marketplace (tienda)
- [ ] Más (3 puntos)

### Íconos Auth/Social
- [ ] Google
- [ ] Apple
- [ ] Facebook

### Íconos Envíos
- [ ] Sobre
- [ ] Caja pequeña
- [ ] Caja mediana
- [ ] Caja grande
- [ ] Frágil

### Íconos Fletes/Vehículos
- [ ] Utilitario
- [ ] Camioneta
- [ ] Camión pequeño
- [ ] Camión grande

### Íconos Pago
- [ ] Efectivo
- [ ] Tarjeta
- [ ] MercadoPago

### Íconos Varios
- [ ] Filtro
- [ ] Carrito
- [ ] Calendario
- [ ] Ubicación verde (origen)
- [ ] Ubicación roja (destino)

### Imágenes
- [ ] Placeholder avatar usuario
- [ ] Placeholder foto conductor
- [ ] Productos marketplace (monopatines, bicicletas)
- [ ] Bandera Argentina

---

## NOTAS TÉCNICAS

### Fuentes
La app parece usar la fuente sistema (San Francisco en iOS, Roboto en Android). No se requieren fuentes custom.

### Responsive
Todas las medidas deben usar el sistema de SIZES existente, ajustando valores según Figma.

### Navegación
- Bottom Tab Bar: 5 tabs fijos
- Stack navigation dentro de cada tab
- Modales para filtros y selectores

---

*Documento generado: 7 Diciembre 2024*
*Basado en análisis de 45+ capturas de Figma*
