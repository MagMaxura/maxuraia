import React, { createContext, useContext } from "react";
import { useAuthService } from "../hooks/useAuthService"; // Fixed relative path

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  // Usar el hook de servicio de autenticación real
  const authService = useAuthService();

  // Proveer los valores del servicio a través del contexto
  return (
    <AuthContext.Provider value={authService}>
      {children}
    </AuthContext.Provider>
  );
}
