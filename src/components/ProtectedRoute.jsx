
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    // AuthProvider shows the main loading indicator during initial check
    return null; 
  }

  if (!isAuthenticated) {
    // Redirect to the /login path if not authenticated
    // TEMPORALMENTE COMENTADO PARA ACCESO DIRECTO A PÁGINAS PROTEGIDAS DURANTE DEBUG
    // console.warn("ProtectedRoute: User not authenticated, normally would redirect to /login. Path:", location.pathname);
    // return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render the protected content if authenticated
  return children;
}

export default ProtectedRoute;
