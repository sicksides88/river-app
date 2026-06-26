# ASSETS REQUERIDOS - SECCIÓN CRM (Dashboard Admin)

## Resumen del Análisis Figma vs Implementación

Este documento analiza el diseño de Figma del CRM (home.png) comparándolo con la implementación actual en React + Tailwind.

---

## CAPTURA ANALIZADA: home.png

### Estructura del Dashboard (Figma)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌─────────┐                                        ┌───────────────┐│
│ │ SIDEBAR │  MAIN CONTENT                          │ RIGHT PANEL   ││
│ │         │                                        │               ││
│ │ Logo    │  "Ganancias"                    [Más]  │ Pedidos       ││
│ │         │  ┌──────────────────────────────────┐  │ - Producto 1  ││
│ │ Dashboard│  │  ⚪ 18%  │ Mis ganancias        │  │ - Producto 2  ││
│ │ Mapa    │  │  ──────  │ $1.000.000,00        │  │ - Producto 3  ││
│ │ GestiónKYC│ └──────────────────────────────────┘  │ - Producto 4  ││
│ │ Tarifas │                                        │               ││
│ │ Usuarios│  ┌────────┬────────┬────────┬────────┐ │ [Ver más]     ││
│ │Marketplace│ │$100.000│$50.000 │10.000  │4.8     │ │               ││
│ │ Pagos   │  │Ingresos│Egresos │Pedidos │Rating  │ │ Servicios     ││
│ │ Reportes│  └────────┴────────┴────────┴────────┘ │ preferidos    ││
│ │ Auditoría│                                       │ [Donut Chart] ││
│ │ Legales │  "Actividad por servicio"              │ 51% 24% 18% 7%││
│ │         │  [Gráfico de barras por mes]           │               ││
│ └─────────┘                                        └───────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## COMPARACIÓN FIGMA vs IMPLEMENTACIÓN

### Sidebar
| Elemento Figma | Implementación | Estado |
|----------------|----------------|--------|
| Logo (cuadrado negro) | Logo placeholder | **FALTANTE** - Usar `logo-vnr.png` |
| Dashboard icon | Lucide `LayoutDashboard` | ✅ OK |
| Mapa icon | Lucide `Map` | ✅ OK |
| Gestión KYC icon | Lucide `UserCheck` | ✅ OK |
| Tarifas y reglas icon | Lucide `Receipt` | ✅ OK |
| Usuarios icon | Lucide `Users` | ✅ OK |
| Marketplace icon | Lucide `Store` | ✅ OK |
| Pagos icon | Lucide `CreditCard` | ✅ OK |
| Reportes icon | Lucide `BarChart3` | ✅ OK |
| Auditoría icon | Lucide `History` | ✅ OK |
| Legales icon | Lucide `Scale` | ✅ OK |

**NOTA:** Lucide icons son equivalentes funcionales. No se requieren assets custom.

### Main Content - Dashboard

#### Card de Ganancias Principal
| Elemento | Estado |
|----------|--------|
| Donut chart con 18% | **FALTANTE** - Requiere librería de charts |
| Fondo oscuro (gradient) | ✅ Implementable con Tailwind |
| Botón "Más" | ✅ Implementable |

#### Cards de Estadísticas (4 cards)
| Card | Icono Figma | Implementación |
|------|-------------|----------------|
| Ingresos ($100.000) | Flecha abajo | Lucide `ArrowDown` |
| Egresos ($50.000) | Flecha arriba | Lucide `ArrowUp` |
| Pedidos activos (10.000) | Círculos/monedas | Lucide `Package` |
| Puntuación (4.8) | Estrella | Lucide `Star` |

**NOTA:** Los iconos de Lucide son suficientes.

#### Gráfico "Actividad por servicio"
| Elemento | Estado |
|----------|--------|
| Bar chart mensual | **FALTANTE** - Requiere Recharts o Chart.js |
| Colores: azul, verde, negro, rosa, morado | Definir en tema |
| Filtros: Día, Mes, Servicios | ✅ Implementable con selects |

### Right Panel - Pedidos

| Elemento | Estado |
|----------|--------|
| Lista de productos recientes | ✅ Implementable |
| Thumbnails de productos | **FALTANTE** - Imágenes de marketplace |
| Botón "Ver más" | ✅ Implementable |

### Right Panel - Servicios Preferidos

| Elemento | Estado |
|----------|--------|
| Donut chart con % | **FALTANTE** - Requiere librería de charts |
| Leyenda (High, Medium, Low, Other) | ✅ Implementable |

---

## ASSETS REQUERIDOS

### 1. Logo
```
- assets/logo-vnr.png (para sidebar - mismo que app móvil)
```

### 2. Imágenes de Productos (Marketplace)
```
- assets/products/monopatin-extreme-300.png
- assets/products/bicicleta-bi-200.png
- assets/products/bicicleta-spinning.png
- assets/products/monopatin-xiaomi.png
```

**NOTA:** Estas imágenes son las mismas del marketplace de la app móvil.

### 3. Librerías de Gráficos (No son assets, sino dependencias)
```bash
npm install recharts
# o
npm install react-chartjs-2 chart.js
```

---

## IMPLEMENTACIÓN RECOMENDADA

### Gráficos a implementar:

1. **Donut Chart - Ganancias**
```tsx
// Recharts example
<PieChart>
  <Pie data={data} innerRadius={60} outerRadius={80}>
    <Cell fill="#1a1a2e" />
    <Cell fill="#e8e8e8" />
  </Pie>
</PieChart>
```

2. **Bar Chart - Actividad por servicio**
```tsx
<BarChart data={monthlyData}>
  <Bar dataKey="vueltaSegura" fill="#60a5fa" />
  <Bar dataKey="envios" fill="#34d399" />
  <Bar dataKey="fletes" fill="#1f2937" />
  <Bar dataKey="chofer" fill="#f472b6" />
</BarChart>
```

3. **Donut Chart - Servicios preferidos**
```tsx
<PieChart>
  <Pie data={servicesData} innerRadius={40} outerRadius={60}>
    {/* Colors: azul, beige, rosa, verde */}
  </Pie>
</PieChart>
```

---

## PALETA DE COLORES (Figma)

| Uso | Color | Hex (aproximado) |
|-----|-------|------------------|
| Sidebar background | Negro | `#1a1a2e` |
| Card Ganancias bg | Negro oscuro | `#1f2937` |
| Card Ingresos bg | Amarillo claro | `#fef3c7` |
| Card Egresos bg | Verde claro | `#d1fae5` |
| Card Pedidos bg | Gris claro | `#f3f4f6` |
| Card Rating bg | Gris claro | `#f3f4f6` |
| Barra Enero | Azul | `#60a5fa` |
| Barra Febrero | Verde | `#34d399` |
| Barra Marzo | Negro | `#1f2937` |
| Barra Abril | Azul | `#60a5fa` |
| Barra Mayo | Verde | `#34d399` |
| Barra Junio | Azul | `#60a5fa` |
| Barra Julio | Negro | `#1f2937` |
| Barra Agosto | Azul | `#60a5fa` |
| Barra Septiembre | Beige | `#fde68a` |
| Barra Octubre | Beige | `#fde68a` |
| Barra Noviembre | Rosa | `#f9a8d4` |
| Barra Diciembre | Morado | `#c4b5fd` |

---

## ESTADO DE IMPLEMENTACIÓN CRM

| Página | Figma | Implementación | Estado |
|--------|-------|----------------|--------|
| Dashboard | home.png | DashboardPage.tsx | ⚠️ Parcial (faltan gráficos) |
| Mapa | - | MapaPage.tsx | 📝 Placeholder |
| KYC | - | KYCPage.tsx | ✅ Funcional |
| Tarifas | - | TarifasPage.tsx | ✅ Funcional |
| Usuarios | - | UsersPage.tsx | ✅ Funcional |
| Marketplace | - | MarketplacePage.tsx | ✅ Funcional |
| Pagos | - | PagosPage.tsx | 📝 Placeholder |
| Reportes | - | ReportesPage.tsx | ⚠️ Parcial |
| Auditoría | - | AuditoriaPage.tsx | 📝 Placeholder |
| Legales | - | LegalesPage.tsx | 📝 Placeholder |

**Leyenda:**
- ✅ Funcional
- ⚠️ Parcial (falta completar)
- 📝 Placeholder (página vacía)

---

## RESUMEN

### Assets Gráficos Necesarios:
1. `logo-vnr.png` - Logo para sidebar
2. Imágenes de productos del marketplace (compartidas con app móvil)

### Dependencias a Instalar:
```bash
cd /home/rdpuser/Desktop/Proyectos/VNR/crm
npm install recharts
```

### Tareas de Implementación:
1. Agregar logo al sidebar
2. Implementar gráfico donut de ganancias
3. Implementar gráfico de barras de actividad
4. Implementar gráfico donut de servicios preferidos
5. Conectar lista de pedidos recientes con datos reales
6. Aplicar paleta de colores del Figma

---

**NOTA:** La mayoría del diseño del CRM se puede lograr con Tailwind CSS y una librería de gráficos. No se requieren muchos assets gráficos adicionales.
