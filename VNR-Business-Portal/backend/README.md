# Backend - App Movilidad

Backend para la aplicación de movilidad construido con Node.js, Express y MongoDB.

## 🚀 Instalación

1. Instalar dependencias:

```bash
cd backend
npm install
```

2. Configurar variables de entorno:

```bash
cp .env.example .env
```

3. Editar `.env` con tus credenciales:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/app-movilidad
JWT_SECRET=tu_secreto_super_seguro_aqui
JWT_EXPIRE=7d
NODE_ENV=development
```

4. Iniciar servidor de desarrollo:

```bash
npm run dev
```

## 📚 Endpoints API

### Autenticación

#### Registro

```http
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "Santiago",
  "apellido": "Escobar",
  "email": "santiago@example.com",
  "password": "password123",
  "codigoPais": "+54",
  "telefono": "1234567890",
  "direccion": "Independencia 156"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "santiago@example.com",
  "password": "password123"
}
```

#### Obtener perfil

```http
GET /api/auth/me
Authorization: Bearer {token}
```

#### Logout

```http
POST /api/auth/logout
Authorization: Bearer {token}
```

### Usuario

#### Actualizar perfil

```http
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Santiago",
  "apellido": "Escobar",
  "telefono": {
    "codigoPais": "+54",
    "numero": "1234567890"
  },
  "direccion": "Nueva dirección"
}
```

## 🛠️ Tecnologías

- **Express** - Framework web
- **MongoDB** - Base de datos
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación con tokens
- **Bcrypt** - Encriptación de contraseñas
- **CORS** - Compartir recursos entre orígenes

## 📁 Estructura del Proyecto

```
backend/
├── config/
│   └── db.js              # Configuración de MongoDB
├── controllers/
│   └── auth.controller.js # Controladores de autenticación
├── middleware/
│   ├── auth.middleware.js # Middleware de autenticación
│   └── errorHandler.js    # Manejador de errores
├── models/
│   └── User.model.js      # Modelo de usuario
├── routes/
│   ├── auth.routes.js     # Rutas de autenticación
│   └── user.routes.js     # Rutas de usuario
├── utils/
│   └── generateToken.js   # Utilidad para generar JWT
├── .env.example           # Ejemplo de variables de entorno
├── .gitignore
├── package.json
├── README.md
└── server.js              # Punto de entrada
```

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt
- Autenticación con JWT
- Tokens con expiración configurable
- Validación de datos de entrada
- Protección de rutas con middleware

## 📝 Notas

- El token JWT se incluye en el header `Authorization` como `Bearer {token}`
- Los tokens expiran en 7 días por defecto (configurable)
- Las contraseñas deben tener al menos 6 caracteres
- El email debe ser único en la base de datos
