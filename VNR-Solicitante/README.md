# VNR Solicitante

App móvil (Expo / React Native) **exclusiva para usuarios/solicitantes**. Separada de la app de
choferes (`VNR-Chofer`). Comparte el mismo backend y la misma base de datos (proyecto Supabase `VNR`).

## Qué incluye
- Login / registro de usuario.
- Inicio, selección de servicios: Vuelta Segura, Envíos, Fletes, Chofer.
- Seguimiento de pedidos en vivo, marketplace, billetera del usuario, perfil.

La navegación raíz está bloqueada al rol usuario en `src/navigation/AppNavigator.js`:
tras autenticarse entra directo a `MainTabNavigator` (+ `Services` y `Wallet`). No incluye el
flujo de conductor (eso vive en la app `VNR-Chofer`); se quitó el acceso "convertirse en conductor"
del perfil.

## Configuración
- `app.config.js`: name `VNR`, slug `vnr-solicitante`, scheme `vnr`, bundle/package `com.vnr.app`.
- `.env`: `API_URL`, `GOOGLE_MAPS_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
  (apuntan al backend de producción `https://vnr-api.whapy.com/api`).

## Correr
```bash
npm install
npx expo start
```

## Build (EAS)
```bash
npx eas init            # crea el projectId de VNR Solicitante
npx eas build -p android
```

> El código compartido (servicios, componentes, contextos) está duplicado en cada app por
> simplicidad. Si más adelante se quiere evitar la duplicación, se puede extraer a un paquete común.
