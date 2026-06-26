# 📡 API Documentation - App Movilidad

## Base URL
```
http://localhost:5000/api
```

## Autenticación

Todas las rutas privadas requieren el header:
```
Authorization: Bearer {token}
```

---

## 🔐 Auth Endpoints

### Registrar Usuario
```http
POST /auth/register
```

**Body:**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@ejemplo.com",
  "password": "password123",
  "codigoPais": "+54",
  "telefono": "1234567890",
  "direccion": "Calle 123"
}
```

### Iniciar Sesión
```http
POST /auth/login
```

**Body:**
```json
{
  "email": "juan@ejemplo.com",
  "password": "password123"
}
```

### Obtener Perfil Actual
```http
GET /auth/me
```
*Requiere autenticación*

### Cerrar Sesión
```http
POST /auth/logout
```
*Requiere autenticación*

---

## 📍 Location Endpoints

### Obtener Ubicaciones Recientes
```http
GET /locations/recent?limit=5
```
*Requiere autenticación*

**Response:**
```json
{
  "success": true,
  "count": 5,
  "locations": [
    {
      "_id": "...",
      "address": "Independencia 156",
      "coordinates": {
        "lat": -34.603722,
        "lng": -58.381592
      },
      "label": "home",
      "usageCount": 5,
      "lastUsed": "2024-01-15T..."
    }
  ]
}
```

### Obtener Ubicaciones Frecuentes
```http
GET /locations/frequent?limit=5
```
*Requiere autenticación*

### Guardar Ubicación
```http
POST /locations
```
*Requiere autenticación*

**Body:**
```json
{
  "address": "Independencia 156",
  "formatted_address": "Independencia 156, CABA, Argentina",
  "coordinates": {
    "lat": -34.603722,
    "lng": -58.381592
  },
  "type": "both",
  "label": "home"
}
```

### Actualizar Ubicación
```http
PUT /locations/:id
```
*Requiere autenticación*

**Body:**
```json
{
  "label": "work",
  "type": "pickup"
}
```

### Eliminar Ubicación
```http
DELETE /locations/:id
```
*Requiere autenticación*

---

## 🚗 Ride Endpoints (Viajes)

### Crear Solicitud de Viaje
```http
POST /rides
```
*Requiere autenticación*

**Body:**
```json
{
  "serviceType": "vuelta-segura",
  "pickup": {
    "address": "Independencia 156",
    "coordinates": {
      "lat": -34.603722,
      "lng": -58.381592
    }
  },
  "dropoff": {
    "address": "Av. Corrientes 1234",
    "coordinates": {
      "lat": -34.603722,
      "lng": -58.381592
    }
  },
  "scheduledDate": "2024-01-20",
  "scheduledTime": {
    "hour": 14,
    "minute": 30
  },
  "notes": "Notas adicionales"
}
```

### Obtener Viajes del Usuario
```http
GET /rides?page=1&limit=10&status=pending
```
*Requiere autenticación*

**Query params:**
- `page` (opcional): Número de página
- `limit` (opcional): Items por página
- `status` (opcional): pending, confirmed, completed, cancelled

### Obtener Viaje Específico
```http
GET /rides/:id
```
*Requiere autenticación*

### Cancelar Viaje
```http
PUT /rides/:id/cancel
```
*Requiere autenticación*

---

## 📦 Delivery Endpoints (Envíos)

### Crear Solicitud de Envío
```http
POST /deliveries
```
*Requiere autenticación*

**Body:**
```json
{
  "serviceType": "envio",
  "deliveryType": "enviar",
  "pickup": {
    "address": "Independencia 156",
    "coordinates": {
      "lat": -34.603722,
      "lng": -58.381592
    },
    "contactName": "Juan Pérez",
    "contactPhone": "+541234567890"
  },
  "dropoff": {
    "address": "Av. Corrientes 1234",
    "coordinates": {
      "lat": -34.603722,
      "lng": -58.381592
    },
    "contactName": "María García",
    "contactPhone": "+549876543210"
  },
  "scheduledDate": "2024-01-20",
  "scheduledTime": {
    "hour": 10,
    "minute": 0
  },
  "packageDetails": {
    "description": "Documentos",
    "weight": 0.5,
    "isFragile": false
  },
  "notes": "Tocar timbre 3 veces"
}
```

### Obtener Envíos del Usuario
```http
GET /deliveries?page=1&limit=10&status=pending&serviceType=envio
```
*Requiere autenticación*

**Query params:**
- `page` (opcional): Número de página
- `limit` (opcional): Items por página
- `status` (opcional): pending, confirmed, picked-up, in-transit, delivered, cancelled
- `serviceType` (opcional): envio, flete

### Obtener Envío Específico
```http
GET /deliveries/:id
```
*Requiere autenticación*

### Rastrear Envío (Público)
```http
GET /deliveries/track/:trackingNumber
```
*No requiere autenticación*

**Response:**
```json
{
  "success": true,
  "tracking": {
    "trackingNumber": "DEL170500012345678",
    "status": "in-transit",
    "pickup": "Independencia 156",
    "dropoff": "Av. Corrientes 1234",
    "scheduledDate": "2024-01-20",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### Cancelar Envío
```http
PUT /deliveries/:id/cancel
```
*Requiere autenticación*

---

## 👤 User Endpoints

### Actualizar Perfil
```http
PUT /users/profile
```
*Requiere autenticación*

**Body:**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": {
    "codigoPais": "+54",
    "numero": "1234567890"
  },
  "direccion": "Nueva dirección",
  "password": "nueva_contraseña_opcional"
}
```

---

## 📊 Estados (Status)

### Rides
- `pending`: Pendiente de confirmación
- `confirmed`: Confirmado
- `driver-assigned`: Conductor asignado
- `in-progress`: En progreso
- `completed`: Completado
- `cancelled`: Cancelado

### Deliveries
- `pending`: Pendiente
- `confirmed`: Confirmado
- `picked-up`: Recogido
- `in-transit`: En tránsito
- `delivered`: Entregado
- `cancelled`: Cancelado

---

## 🏷️ Etiquetas de Ubicación (Labels)

- `home`: Casa
- `work`: Trabajo
- `other`: Otro

---

## 🔍 Tipos de Ubicación (Types)

- `pickup`: Recogida
- `dropoff`: Entrega
- `both`: Ambos

---

## ⚠️ Códigos de Error

- `400`: Bad Request - Datos inválidos
- `401`: Unauthorized - No autenticado o token inválido
- `403`: Forbidden - Sin permisos
- `404`: Not Found - Recurso no encontrado
- `500`: Internal Server Error - Error del servidor

---

## 💡 Ejemplos de Uso

### Flujo Completo: Solicitar un Viaje

1. **Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@ejemplo.com","password":"password123"}'
```

2. **Obtener ubicaciones recientes**
```bash
curl http://localhost:5000/api/locations/recent \
  -H "Authorization: Bearer {token}"
```

3. **Crear viaje**
```bash
curl -X POST http://localhost:5000/api/rides \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

4. **Ver mis viajes**
```bash
curl http://localhost:5000/api/rides \
  -H "Authorization: Bearer {token}"
```

---

**Última actualización:** 2024
**Versión de la API:** 1.0.0

