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

export function AuthProvider({ children }) {
  console.log("AuthProvider: Initializing");
  const authService = useAuthService(); // Hook para login, logout, register (signUp), user state, loading etc.
  console.log("AuthProvider: register function available:", !!authService.register);

  // Combinar el servicio base con las funciones específicas del perfil
  const value = {
    ...authService, // Incluye user, login, logout, register, loading, etc. del hook
    saveRecruiterProfile: authFunctions.saveRecruiterProfile, // Añadir función para guardar perfil
    getRecruiterProfile: authFunctions.getRecruiterProfile,   // Añadir función para obtener perfil por ID
    getRecruiterByEmail: authFunctions.getRecruiterByEmail // Asegurarse que esta también esté si se necesita
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
