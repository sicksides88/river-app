import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LoginPage } from './pages';
import {
  OperacionesDashboard,
  MapaOperativo,
  DespachoAuxilios,
  TurnosGuardias,
  AltaAuxilioTelefonico,
  DetalleAuxilio,
  GestionUsuarios,
  InformesRiver,
  GestionRoles,
  GestionEmbarcaciones,
} from './pages/river';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isCrmUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1220]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user || !isCrmUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<ProtectedRoute><OperacionesDashboard /></ProtectedRoute>} />
      <Route path="/mapa" element={<ProtectedRoute><MapaOperativo /></ProtectedRoute>} />
      <Route path="/despacho" element={<ProtectedRoute><DespachoAuxilios /></ProtectedRoute>} />
      <Route path="/turnos" element={<ProtectedRoute><TurnosGuardias /></ProtectedRoute>} />
      <Route path="/alta" element={<ProtectedRoute><AltaAuxilioTelefonico /></ProtectedRoute>} />
      <Route path="/auxilios/:id" element={<ProtectedRoute><DetalleAuxilio /></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute><GestionUsuarios /></ProtectedRoute>} />
      <Route path="/flota" element={<ProtectedRoute><GestionEmbarcaciones /></ProtectedRoute>} />
      <Route path="/informes" element={<ProtectedRoute><InformesRiver /></ProtectedRoute>} />
      <Route path="/roles" element={<ProtectedRoute><GestionRoles /></ProtectedRoute>} />

      {/* Compatibilidad bookmarks antiguos */}
      <Route path="/river" element={<Navigate to="/" replace />} />
      <Route path="/river/mapa" element={<Navigate to="/mapa" replace />} />
      <Route path="/river/despacho" element={<Navigate to="/despacho" replace />} />
      <Route path="/river/turnos" element={<Navigate to="/turnos" replace />} />
      <Route path="/river/alta" element={<Navigate to="/alta" replace />} />
      <Route path="/river/auxilios/:id" element={<Navigate to="/auxilios/:id" replace />} />

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
