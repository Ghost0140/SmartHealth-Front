import { createContext, useContext, useState } from "react";
import { login as loginRequest } from "../api/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const stored = localStorage.getItem("usuario");
    return stored ? JSON.parse(stored) : null;
  });

  async function login(correo, clave) {
    const data = await loginRequest(correo, clave);
    // data: { token, idUsuario, correo, rol, idDoctor }
    const usuarioData = {
      idUsuario: data.idUsuario,
      correo: data.correo,
      rol: data.rol,
      idDoctor: data.idDoctor,
    };

    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(usuarioData));
    setUsuario(usuarioData);

    return usuarioData;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
