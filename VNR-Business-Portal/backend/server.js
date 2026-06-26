import 'dotenv/config';
import express from "express";
import { createServer } from "http";
import cors from "cors";
import os from "os";
import { supabaseAdmin } from "./config/supabase.js";
import { initSocket } from "./config/socket.js";
import { initSocketHandlers } from "./sockets/index.js";
import rideQueueService from "./services/rideQueue.service.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import locationRoutes from "./routes/location.routes.js";
import rideRoutes from "./routes/ride.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";
import driverRoutes from "./routes/driver.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import driverWalletRoutes from "./routes/driverWallet.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import ratingRoutes from "./routes/rating.routes.js";
import mapsRoutes from "./routes/maps.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import paymentSplitRoutes from "./routes/paymentSplit.routes.js";
import refundRoutes from "./routes/refund.routes.js";
import productRoutes from "./routes/product.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import orderRoutes from "./routes/order.routes.js";
import scheduleRoutes from "./routes/schedule.routes.js";
import mercadopagoOAuthRoutes from "./routes/mercadopagoOAuth.routes.js";
import businessRoutes from "./routes/business.routes.js";
import businessAdminRoutes from "./routes/businessAdmin.routes.js";
import usersAdminRoutes from "./routes/usersAdmin.routes.js";
import pricingRoutes from "./routes/pricing.routes.js";
import auxilioRoutes from "./routes/auxilio.routes.js";
import vesselRoutes from "./routes/vessel.routes.js";
import membershipRoutes from "./routes/membership.routes.js";
import adminAuxilioRoutes from "./routes/adminAuxilio.routes.js";
import patrolShiftRoutes, { patrolAdminRoutes } from "./routes/patrolShift.routes.js";
import { initializeBucket } from "./services/upload.service.js";
import { startMPTokenRefreshJob } from "./jobs/refreshMPTokens.job.js";
import errorHandler from "./middleware/errorHandler.js";



const app = express();
const server = createServer(app);

// Inicializar Socket.IO
initSocket(server);
initSocketHandlers();

// Inicializar servicio de cola de viajes
rideQueueService.initialize();

// Middlewares
// Configuración de CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (origin, callback) => {
        // Permitir requests sin origin (mobile apps, curl, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Permitir todo temporalmente - ajustar si se necesita restringir
        }
      }
    : true,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Aumentar límite para imágenes base64
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/auxilio", auxilioRoutes);
app.use("/api/vessels", vesselRoutes);
app.use("/api/membership", membershipRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/drivers", driverRoutes);

// Rutas de pagos y wallet
app.use("/api/payments", paymentRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/driver/wallet", driverWalletRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/payment-splits", paymentSplitRoutes);
app.use("/api/refunds", refundRoutes);

// Rutas de notificaciones
app.use("/api/notifications", notificationRoutes);

// Rutas de calificaciones
app.use("/api/ratings", ratingRoutes);

// Rutas de mapas (Google Maps API proxy)
app.use("/api/maps", mapsRoutes);

// Rutas de precios (tarifas del CRM - fuente de verdad)
app.use("/api/pricing", pricingRoutes);

// Rutas de productos/marketplace
app.use("/api/products", productRoutes);

// Rutas de cupones
app.use("/api/coupons", couponRoutes);

// Rutas de órdenes
app.use("/api/orders", orderRoutes);

// Rutas de horarios de conductores
app.use("/api/drivers/schedule", scheduleRoutes);

// Rutas de OAuth MercadoPago para drivers
app.use("/api/driver/mercadopago", mercadopagoOAuthRoutes);

// Rutas del portal de comercios
app.use("/api/business", businessRoutes);

// Rutas admin de comercios (para CRM)
app.use("/api/admin", businessAdminRoutes);
app.use("/api/admin", usersAdminRoutes);
app.use("/api/admin", adminAuxilioRoutes);
app.use("/api/admin", patrolAdminRoutes);
app.use("/api/patrols", patrolShiftRoutes);

// Inicializar bucket de Storage para documentos
initializeBucket();

// Inicializar job de refresh de tokens de MercadoPago
startMPTokenRefreshJob(60); // Cada 60 minutos


// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "API de VNR funcionando correctamente (Supabase)" });
});

// Health check con Supabase
app.get("/api/health", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('profiles').select('count').limit(1);
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ status: 'ok', database: 'connected', provider: 'supabase' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Middleware de manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Escucha en todas las interfaces de red

server.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor corriendo en http://${HOST}:${PORT}`);
  console.log(`📦 Base de datos: Supabase (${process.env.SUPABASE_URL})`);
  console.log(`🔌 WebSocket: Socket.IO activo`);

  // Mostrar IPs de red local para testing móvil
  if (process.env.NODE_ENV === 'development') {
    const networkInterfaces = os.networkInterfaces();
    const addresses = [];

    for (const name of Object.keys(networkInterfaces)) {
      for (const net of networkInterfaces[name]) {
        // Solo mostrar IPv4 y no localhost
        if (net.family === 'IPv4' && !net.internal) {
          addresses.push(net.address);
        }
      }
    }

    if (addresses.length > 0) {
      console.log('\n📱 Para probar desde celular, usa:');
      addresses.forEach(addr => {
        console.log(`   http://${addr}:${PORT}/api`);
      });
      console.log('');
    }
  }
});
