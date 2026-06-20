import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Uso:
 * <ProtectedRoute roles={["ADMIN"]} />
 * <ProtectedRoute roles={["ADMIN", "RECEPCIONISTA"]} />
 * Sin "roles" -> solo exige estar logueado, cualquier rol pasa.
 */
export default function ProtectedRoute({ roles }) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return <Outlet />;
}
