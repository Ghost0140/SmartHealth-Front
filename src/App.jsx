import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import NoAutorizado from "./pages/NoAutorizado";
import DashboardLayout from "./layouts/DashboardLayout";

// Páginas por rol
import AdminInicio from "./pages/admin/AdminInicio";
import DoctorInicio from "./pages/doctor/DoctorInicio";
import DoctorHistorial from "./pages/doctor/DoctorHistorial";
import RecepcionistaInicio from "./pages/recepcionista/RecepcionistaInicio";

// Páginas compartidas entre roles (permisos reales los valida el backend)
import Pacientes from "./pages/shared/Pacientes";
import Doctores from "./pages/shared/Doctores";
import Citas from "./pages/recepcionista/Citas";

import Notificaciones from "./pages/admin/Notificaciones";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/no-autorizado" element={<NoAutorizado />} />

      {/* Rutas protegidas: requieren login */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>

          {/* Solo ADMIN */}
          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="/admin" element={<AdminInicio />} />
            <Route path="/admin/pacientes" element={<Pacientes />} />
            <Route path="/admin/doctores" element={<Doctores />} />
            <Route path="/admin/notificaciones" element={<Notificaciones />} />
          </Route>

          {/* Solo DOCTOR */}
          <Route element={<ProtectedRoute roles={["DOCTOR"]} />}>
            <Route path="/doctor" element={<DoctorInicio />} />
            <Route path="/doctor/historial" element={<DoctorHistorial />} />
          </Route>

          {/* Solo RECEPCIONISTA */}
          <Route element={<ProtectedRoute roles={["RECEPCIONISTA"]} />}>
            <Route path="/recepcionista" element={<RecepcionistaInicio />} />
            <Route path="/recepcionista/pacientes" element={<Pacientes />} />
            <Route path="/recepcionista/doctores" element={<Doctores />} />
            <Route path="/recepcionista/citas" element={<Citas />} />
          </Route>

        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
