import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import Login from './pages/Login.jsx';
import DashboardInicio from './pages/DashboardInicio.jsx';
import GestionSocios from './pages/GestionSocios.jsx';
import GestionPlanes from './pages/GestionPlanes.jsx';
import GestionPagos from './pages/GestionPagos.jsx';
import TotemAcceso from './pages/TotemAcceso.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas solo para administradores */}
      <Route element={<ProtectedRoute requireAdmin />}>
        <Route path="/terminal" element={<TotemAcceso />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<DashboardInicio />} />
          <Route path="socios" element={<GestionSocios />} />
          <Route path="pagos" element={<GestionPagos />} />
          <Route path="planes" element={<GestionPlanes />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/admin/inicio" replace />} />
    </Routes>
  );
}
