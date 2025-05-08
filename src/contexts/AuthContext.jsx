import React, { createContext, useContext } from "react";
import { useAuthService } from "../hooks/useAuthService";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error("useAuth must be used within an AuthProvider");
    throw new Error("useAuth must be used within an AuthProvider");
  }
  console.log("useAuth: register function available:", !!context.register);
  return context;
};

import { auth as authFunctions } from "../lib/auth"; // Importar directamente las funciones de auth.js
import { useMemo } from 'react'; // Importar useMemo

export function AuthProvider({ children }) {
  console.log("AuthProvider: Initializing");
  const authService = useAuthService(); // Hook para login, logout, register (signUp), user state, loading etc.
  console.log("AuthProvider: register function available:", !!authService.register);

  // Combinar el servicio base con las funciones específicas del perfil, memorizando el valor
  const value = useMemo(() => ({
    ...authService, // Incluye user, login, logout, register, loading, authChecked, isAuthenticated etc. del hook
    // Añadir funciones estáticas directamente desde auth.js
    saveRecruiterProfile: authFunctions.saveRecruiterProfile,
    getRecruiterProfile: authFunctions.getRecruiterProfile,
    getRecruiterByEmail: authFunctions.getRecruiterByEmail
    // Asegúrate de que las funciones en auth.js no dependan de 'this' si las llamas así directamente
  }), [authService]); // El valor del contexto solo cambiará si el objeto authService cambia

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
