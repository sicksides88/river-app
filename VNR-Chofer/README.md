# VNR Chofer

App móvil (Expo / React Native) **exclusiva para choferes y cadetes**. Separada de la app de
solicitantes (`VNR-Solicitante`). Comparte el mismo backend y la misma base de datos (proyecto
Supabase `VNR`).

## Qué incluye
- Login / registro de conductor y onboarding (documentos, vehículo).
- Home del chofer: recibir pedidos, aceptar, viaje activo, completar.
- Ganancias y billetera del conductor, retiros.
- Notificaciones y menú del conductor.

La navegación raíz está bloqueada al rol conductor en `src/navigation/AppNavigator.js`:
tras autenticarse entra a `DriverOnboardingStack`, que se auto-rutea a la home del chofer
si la cuenta ya está activa, o al registro si faltan documentos.

## Configuración
- `app.config.js`: name `VNR Chofer`, slug `vnr-chofer`, scheme `vnrchofer`,
  bundle/package `com.vnr.chofer`.
- `.env`: `API_URL`, `GOOGLE_MAPS_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
  (apuntan al backend de producción `https://vnr-api.whapy.com/api`).

## Correr
```bash
npm install
npx expo start          # luego abrir en Expo Go o build
```

## Build (EAS)
Necesita su propio proyecto EAS:
```bash
npx eas init            # crea el projectId de VNR Chofer
npx eas build -p android
```

> Nota: el código compartido (servicios, componentes, contextos) está duplicado en cada app
> por simplicidad. Pendiente de limpieza fina: quitar restos de cambio de modo (`switchMode`)
> en pantallas del conductor, que en esta app no aplican.
