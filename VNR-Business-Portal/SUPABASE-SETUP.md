# Configuracion Supabase para VNR

## SQL a ejecutar en Supabase

El otro dev debe ejecutar el archivo `backend/supabase/schema.sql` en el SQL Editor de Supabase.

**Ruta:** Supabase Dashboard > SQL Editor > New Query > Pegar contenido de `schema.sql` > Run

### Que crea este schema:

1. **Tabla `profiles`** - Extiende auth.users con datos adicionales del usuario
   - nombre, apellido, email, telefono, direccion, role, avatar, etc.

2. **Tabla `rides`** - Viajes (Vuelta Segura / Chofer)
   - pickup/dropoff addresses, coordenadas, estado, precios, etc.

3. **Tabla `deliveries`** - Envios y fletes
   - direcciones origen/destino, datos del paquete, tracking, etc.

4. **Tabla `saved_locations`** - Direcciones guardadas del usuario

5. **Triggers importantes:**
   - `handle_new_user`: Crea automaticamente un perfil cuando se registra un usuario en auth.users
   - `update_*_updated_at`: Actualiza timestamps automaticamente
   - `generate_tracking_number`: Genera numero de tracking para deliveries

6. **Row Level Security (RLS):**
   - Usuarios solo pueden ver/editar sus propios datos
   - Drivers pueden ver viajes/envios asignados a ellos

### Verificar que existe:

Despues de ejecutar el SQL, verificar en Supabase > Table Editor que existan:
- [ ] profiles
- [ ] rides
- [ ] deliveries
- [ ] saved_locations

### Notas importantes:

- El schema usa `uuid-ossp` extension (se crea automaticamente)
- Los profiles se crean automaticamente cuando un usuario se registra via el trigger `on_auth_user_created`
- RLS esta habilitado - el backend usa `service_role` key para bypass cuando es necesario
