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
    // Valores y funciones del hook useAuthService
    user: authService.user,
    loading: authService.loading,
    authChecked: authService.authChecked,
    isAuthenticated: authService.isAuthenticated,
    isProfileComplete: authService.isProfileComplete, // Añadir isProfileComplete al contexto
    login: authService.login,
    logout: authService.logout,
    register: authService.register, // signUp inicial
    resetPassword: authService.resetPassword,
    refreshUser: authService.refreshUser, // <--- AÑADIR ESTA LÍNEA
    // Funciones añadidas directamente desde auth.js
    saveRecruiterProfile: authFunctions.saveRecruiterProfile,
    getRecruiterProfile: authFunctions.getRecruiterProfile,
    getRecruiterByEmail: authFunctions.getRecruiterByEmail,
    updateRecruiterProfile: authFunctions.updateRecruiterProfile // Añadir la nueva función
  }), [
    authService.user,
       authService.loading,
       authService.authChecked,
       authService.isAuthenticated,
       authService.login,
       authService.logout,
       authService.register,
       authService.resetPassword,
       authService.refreshUser // Asegurarse de que refreshUser esté en las dependencias
     ]); // Depender de los valores individuales estabiliza el contexto

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
