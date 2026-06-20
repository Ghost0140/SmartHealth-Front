import { useAuth } from "../../context/AuthContext";

export default function RecepcionistaInicio() {
  const { usuario } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">
        Bienvenido, Recepcionista
      </h1>
      <p className="text-slate-500 mt-1">{usuario?.correo}</p>
    </div>
  );
}
