export function TarjetaMetrica({ titulo, valor, icono, color = "teal" }) {
  const colores = {
    teal: "bg-teal-50 text-teal-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colores[color]}`}>
        {icono}
      </div>
      <div>
        <p className="text-2xl font-semibold text-slate-800">{valor}</p>
        <p className="text-sm text-slate-500">{titulo}</p>
      </div>
    </div>
  );
}

