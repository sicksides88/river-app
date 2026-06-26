# Deploy VNR - Ubuntu Server (Cockpit + Cloudflare)

## Acceso
- **Cockpit**: Panel web del servidor (terminal desde el navegador)
- **Todos los comandos Docker requieren `sudo`**

---

## 1. Clonar repo (primera vez)

Desde la terminal de Cockpit:
```bash
cd /opt
sudo git clone https://<GITHUB_TOKEN>@github.com/Whapy-Dev/Whapy-VNR.git vnr-backend
```

Reemplazá `<GITHUB_TOKEN>` con tu Personal Access Token de GitHub.

---

## 2. Backend VNR

### Crear .env de producción
```bash
sudo nano /opt/vnr-backend/backend/.env
```
```env
SUPABASE_URL=https://zgkdqnmordbrsbpzdgem.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna2Rxbm1vcmRicnNicHpkZ2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5Nzc0NjYsImV4cCI6MjA4MDU1MzQ2Nn0.VW8GZzCr5_pRrwcs0utG4BoYgtQybzqe8ste72VdELI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna2Rxbm1vcmRicnNicHpkZ2VtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDk3NzQ2NiwiZXhwIjoyMDgwNTUzNDY2fQ.FMoaa2-Hgc4yQMya563w5Cmim0l1OwUNygxzOEriBKw
PORT=5001
NODE_ENV=production
JWT_SECRET=vnr-super-secret-jwt-key-2024
GOOGLE_MAPS_API_KEY=AIzaSyDVx2koEMBRSqFRRFn_YvDPcgEU53gPsbM
ALLOWED_ORIGINS=https://comercios-vnr.whapy.com,https://crm-vnr.whapy.com
```

### Build y deploy
```bash
cd /opt/vnr-backend/backend
sudo docker stop vnr-backend 2>/dev/null; sudo docker rm vnr-backend 2>/dev/null
sudo docker build -t vnr-backend:latest .
sudo docker run -d \
  --name vnr-backend \
  -p 5001:5001 \
  --env-file .env \
  --restart unless-stopped \
  vnr-backend:latest
```

### Verificar
```bash
sudo docker ps | grep vnr-backend
sudo docker logs vnr-backend --tail 20
```

---

## 3. Portal de Comercios

### Build y deploy
```bash
cd /opt/vnr-backend/business-portal
sudo docker stop vnr-comercios 2>/dev/null; sudo docker rm vnr-comercios 2>/dev/null
sudo docker build -t vnr-comercios:latest \
  --build-arg VITE_API_URL=https://vnr-api.whapy.com/api \
  --build-arg VITE_SUPABASE_URL=https://zgkdqnmordbrsbpzdgem.supabase.co \
  --build-arg "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna2Rxbm1vcmRicnNicHpkZ2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5Nzc0NjYsImV4cCI6MjA4MDU1MzQ2Nn0.VW8GZzCr5_pRrwcs0utG4BoYgtQybzqe8ste72VdELI" \
  --build-arg VITE_GOOGLE_MAPS_KEY=AIzaSyDVx2koEMBRSqFRRFn_YvDPcgEU53gPsbM \
  .
sudo docker run -d \
  --name vnr-comercios \
  -p 3021:80 \
  --restart unless-stopped \
  vnr-comercios:latest
```

### Verificar
```bash
sudo docker ps | grep vnr-comercios
sudo docker logs vnr-comercios --tail 10
```

---

## 4. Nginx Reverse Proxy (en el servidor)

### Backend API
```bash
sudo nano /etc/nginx/sites-available/vnr-api.whapy.com
```
```nginx
server {
    listen 80;
    server_name vnr-api.whapy.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

### Portal Comercios
```bash
sudo nano /etc/nginx/sites-available/comercios-vnr.whapy.com
```
```nginx
server {
    listen 80;
    server_name comercios-vnr.whapy.com;

    location / {
        proxy_pass http://localhost:3021;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Activar y recargar
```bash
sudo ln -sf /etc/nginx/sites-available/vnr-api.whapy.com /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/comercios-vnr.whapy.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Cloudflare DNS

En el dashboard de Cloudflare para `whapy.com`, agregar:

| Tipo | Nombre | Contenido | Proxy |
|------|--------|-----------|-------|
| A | vnr-api | IP del servidor | Proxied (naranja) |
| A | comercios-vnr | IP del servidor | Proxied (naranja) |

Cloudflare maneja SSL automáticamente con proxy habilitado.

**Importante**: En Cloudflare SSL/TLS settings, asegurar que esté en modo **Full** (no Flexible).

---

## 6. Re-deploy (actualizaciones)

```bash
cd /opt/vnr-backend && sudo git pull

# Backend
cd backend
sudo docker stop vnr-backend && sudo docker rm vnr-backend
sudo docker build -t vnr-backend:latest .
sudo docker run -d --name vnr-backend -p 5001:5001 --env-file .env --restart unless-stopped vnr-backend:latest

# Portal
cd ../business-portal
sudo docker stop vnr-comercios && sudo docker rm vnr-comercios
sudo docker build -t vnr-comercios:latest \
  --build-arg VITE_API_URL=https://vnr-api.whapy.com/api \
  --build-arg VITE_SUPABASE_URL=https://zgkdqnmordbrsbpzdgem.supabase.co \
  --build-arg "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna2Rxbm1vcmRicnNicHpkZ2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5Nzc0NjYsImV4cCI6MjA4MDU1MzQ2Nn0.VW8GZzCr5_pRrwcs0utG4BoYgtQybzqe8ste72VdELI" \
  --build-arg VITE_GOOGLE_MAPS_KEY=AIzaSyDVx2koEMBRSqFRRFn_YvDPcgEU53gPsbM \
  .
sudo docker run -d --name vnr-comercios -p 3021:80 --restart unless-stopped vnr-comercios:latest
```

---

## Puertos
| Servicio | Puerto | Subdominio |
|----------|--------|------------|
| vnr-backend | 5001 | vnr-api.whapy.com |
| vnr-comercios | 3021 | comercios-vnr.whapy.com |
| (futuro) vnr-crm | 3022 | crm-vnr.whapy.com |
