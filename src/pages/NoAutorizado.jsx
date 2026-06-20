import { Link } from "react-router-dom";

export default function NoAutorizado() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-slate-800 mb-2">403</h1>
        <p className="text-slate-500 mb-6">No tienes permisos para ver esta página.</p>
        <Link to="/login" className="text-teal-600 hover:underline text-sm">
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
