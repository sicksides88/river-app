import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import {
  LoginPage,
  DashboardPage,
  MapaPage,
  KYCPage,
  TarifasPage,
  UsersPage,
  BannersPage,
  MarketplacePage,
  PagosPage,
  ReportesPage,
  AuditoriaPage,
  LegalesPage,
  ComerciosPage,
  PedidosComerciosPage,
  FacturacionComerciosPage,
} from './pages';
import {
  ProductosPage,
  CategoriasPage,
  CuponesPage,
  PromocionesPage,
  PedidosPage,
} from './pages/marketplace';
import {
  OperacionesDashboard,
  MapaOperativo,
  DespachoAuxilios,
  TurnosGuardias,
  AltaAuxilioTelefonico,
  DetalleAuxilio,
} from './pages/river';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mapa"
        element={
          <ProtectedRoute>
            <MapaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kyc"
        element={
          <ProtectedRoute>
            <KYCPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tarifas"
        element={
          <ProtectedRoute>
            <TarifasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/banners"
        element={
          <ProtectedRoute>
            <BannersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketplace"
        element={
          <ProtectedRoute>
            <MarketplacePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketplace/productos"
        element={
          <ProtectedRoute>
            <ProductosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketplace/categorias"
        element={
          <ProtectedRoute>
            <CategoriasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketplace/cupones"
        element={
          <ProtectedRoute>
            <CuponesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketplace/promociones"
        element={
          <ProtectedRoute>
            <PromocionesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketplace/pedidos"
        element={
          <ProtectedRoute>
            <PedidosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/comercios"
        element={
          <ProtectedRoute>
            <ComerciosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/comercios/pedidos"
        element={
          <ProtectedRoute>
            <PedidosComerciosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/comercios/facturacion"
        element={
          <ProtectedRoute>
            <FacturacionComerciosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pagos"
        element={
          <ProtectedRoute>
            <PagosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reportes"
        element={
          <ProtectedRoute>
            <ReportesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auditoria"
        element={
          <ProtectedRoute>
            <AuditoriaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/legales"
        element={
          <ProtectedRoute>
            <LegalesPage />
          </ProtectedRoute>
        }
      />
      <Route path="/river" element={<ProtectedRoute><OperacionesDashboard /></ProtectedRoute>} />
      <Route path="/river/mapa" element={<ProtectedRoute><MapaOperativo /></ProtectedRoute>} />
      <Route path="/river/despacho" element={<ProtectedRoute><DespachoAuxilios /></ProtectedRoute>} />
      <Route path="/river/turnos" element={<ProtectedRoute><TurnosGuardias /></ProtectedRoute>} />
      <Route path="/river/alta" element={<ProtectedRoute><AltaAuxilioTelefonico /></ProtectedRoute>} />
      <Route path="/river/auxilios/:id" element={<ProtectedRoute><DetalleAuxilio /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
