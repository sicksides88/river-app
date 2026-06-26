# App Movilidad 🚗

Aplicación web móvil de movilidad similar a Uber, con sistema completo de autenticación y backend.

## ✨ Características

- 🔐 **Autenticación completa** - Registro, login y manejo de sesiones con JWT
- 🚗 **Vuelta Segura** - Servicio de transporte personal con planificación de viajes
- 📦 **Envíos** - Servicio de entregas (enviar y recibir artículos)
- 🚚 **Fletes** - Servicio de transporte de carga
- 👔 **Chofer** - Servicio de conductor privado
- 🛍️ **Tienda** - Compra y alquiler de productos
- 📊 **Actividad** - Historial de viajes y servicios
- ⚙️ **Perfil** - Gestión de cuenta y cerrar sesión

## 📱 Diseño

Diseñada específicamente para dispositivos móviles con una interfaz moderna, responsiva y fácil de usar.

### Testing en Dispositivos Móviles Reales

El servidor de desarrollo está configurado para ser accesible desde tu red local. Esto te permite probar la app directamente en tu celular:

```bash
npm run dev
# Busca la URL de "Network" en la terminal
# Ej: http://192.168.1.15:5173/
# Ábrela en tu celular (misma WiFi)
```

📚 **Guía completa:** [MOBILE_TESTING_RESUMEN.md](MOBILE_TESTING_RESUMEN.md)

## 🚀 Inicio Rápido

### Opción 1: Script automático (recomendado)

**Windows:**

```bash
start-dev.bat
```

**Linux/Mac:**

```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Opción 2: Manual

1. **Instalar dependencias del backend:**

```bash
cd backend
npm install
cd ..
```

2. **Instalar dependencias del frontend:**

```bash
npm install
```

3. **Configurar variables de entorno:**

Crea `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/app-movilidad
JWT_SECRET=tu_secreto_super_seguro_aqui
JWT_EXPIRE=7d
NODE_ENV=development
```

Crea `.env` en la raíz:

```env
VITE_API_URL=http://localhost:5000/api
```

4. **Iniciar MongoDB:**

```bash
mongod
```

5. **Iniciar backend:**

```bash
cd backend
npm run dev
```

6. **Iniciar frontend (en otra terminal):**

```bash
npm run dev
```

7. **Abrir en el navegador:**

```
http://localhost:5173
```

## 📚 Documentación Completa

Para instrucciones detalladas de instalación, configuración y troubleshooting, consulta:

📖 **[SETUP.md](SETUP.md)** - Guía completa de configuración

## 📦 Tecnologías

### Frontend

- **React 18** - Framework de UI
- **Vite** - Build tool y dev server
- **React Icons** - Biblioteca de iconos
- **Axios** - Cliente HTTP
- **Context API** - Manejo de estado global

### Backend

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación con tokens
- **Bcrypt** - Encriptación de contraseñas

## 🎨 Estructura del Proyecto

```
app-movilidad/
├── backend/                    # API REST
│   ├── config/
│   │   └── db.js              # Configuración de MongoDB
│   ├── controllers/
│   │   └── auth.controller.js # Lógica de autenticación
│   ├── middleware/
│   │   ├── auth.middleware.js # Middleware de autenticación
│   │   └── errorHandler.js    # Manejo de errores
│   ├── models/
│   │   └── User.model.js      # Modelo de usuario
│   ├── routes/
│   │   ├── auth.routes.js     # Rutas de autenticación
│   │   └── user.routes.js     # Rutas de usuario
│   ├── utils/
│   │   └── generateToken.js   # Generación de JWT
│   ├── .env                    # Variables de entorno (crear)
│   ├── server.js              # Punto de entrada
│   └── package.json
├── src/                       # Frontend React
│   ├── components/            # Componentes de UI
│   │   ├── Login.jsx          # Pantalla de login
│   │   ├── Register.jsx       # Pantalla de registro
│   │   ├── Header.jsx         # Navegación superior
│   │   ├── BottomNav.jsx      # Navegación inferior
│   │   ├── PlanTrip.jsx       # Planificar viaje
│   │   ├── Envios.jsx         # Sección de envíos
│   │   ├── Chofer.jsx         # Sección de chofer
│   │   ├── Actividad.jsx      # Historial de actividad
│   │   ├── Tienda.jsx         # Tienda
│   │   └── Mas.jsx            # Perfil y configuración
│   ├── context/
│   │   └── AuthContext.jsx    # Context API para autenticación
│   ├── services/
│   │   ├── api.js             # Configuración de Axios
│   │   └── auth.service.js    # Servicios de autenticación
│   ├── App.jsx                # Componente principal
│   ├── main.jsx               # Punto de entrada
│   └── index.css              # Estilos globales
├── .env                       # Variables de entorno frontend (crear)
├── SETUP.md                   # Guía de configuración detallada
├── start-dev.bat              # Script de inicio (Windows)
├── start-dev.sh               # Script de inicio (Linux/Mac)
├── package.json
└── vite.config.js
```

## 📝 Scripts Disponibles

### Frontend

```bash
npm run dev      # Inicia el servidor de desarrollo
npm run build    # Construye la aplicación para producción
npm run preview  # Previsualiza la build de producción
```

### Backend

```bash
cd backend
npm run dev      # Inicia el servidor con nodemon (auto-reload)
npm start        # Inicia el servidor en modo producción
```

## 🔐 Autenticación

La aplicación incluye un sistema completo de autenticación:

- ✅ Registro de usuarios con validación
- ✅ Login con email y contraseña
- ✅ Tokens JWT que expiran en 7 días
- ✅ Protección de rutas privadas
- ✅ Persistencia de sesión
- ✅ Cerrar sesión

### Ejemplo de Uso

1. **Registro:** Crea una cuenta con tu email, contraseña, teléfono y dirección
2. **Login:** Inicia sesión con tu email y contraseña
3. **Navegación:** Explora todos los servicios autenticado
4. **Perfil:** Ve a "Más" para ver tu perfil y cerrar sesión

## 🐛 Troubleshooting

Consulta [SETUP.md](SETUP.md) para soluciones a problemas comunes.

## 📄 Licencia

MIT

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request
