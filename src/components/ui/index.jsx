// ===== Input =====
export function Input({ label, error, ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full rounded-lg border px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
          ${error ? "border-red-300" : "border-slate-300"}`}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ===== Select =====
export function Select({ label, error, children, ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`w-full rounded-lg border px-3 py-2 text-sm bg-white
          focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
          ${error ? "border-red-300" : "border-slate-300"}`}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ===== Button =====
const VARIANTS = {
  primary: "bg-teal-600 hover:bg-teal-700 text-white",
  secondary: "bg-white border border-slate-300 hover:bg-slate-50 text-slate-700",
  danger: "bg-white border border-red-300 hover:bg-red-50 text-red-600",
};

export function Button({ variant = "primary", className = "", ...props }) {
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors
        disabled:opacity-60 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    />
  );
}

// ===== Badge (activo/inactivo) =====
export function EstadoBadge({ activo }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        activo
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}

// ===== Modal =====
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ===== Alerta de error inline =====
export function AlertaError({ mensaje }) {
  if (!mensaje) return null;
  return (
    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
      {mensaje}
    </p>
  );
}
