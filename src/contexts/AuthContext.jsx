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

export function AuthProvider({ children }) {
  console.log("AuthProvider: Initializing");
  const authService = useAuthService();
  console.log("AuthProvider: register function available:", !!authService.register);

  return (
    <AuthContext.Provider value={authService}>
      {children}
    </AuthContext.Provider>
  );
}
