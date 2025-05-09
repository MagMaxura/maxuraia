
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// This component redirects authenticated users away from public-only pages (like login, register, landing)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth(); 
  const location = useLocation();

  // Wait until the initial auth check is complete
  if (loading) {
    // You might want to return a loading indicator or null
    return (
       <div className="min-h-screen flex items-center justify-center bg-[#f3f2ef]">
         Cargando...
       </div>
    ); 
  }

  if (isAuthenticated) {
    // If user is authenticated, redirect them away from the public page,
    // typically to the dashboard or the page they came from.
    const from = location.state?.from?.pathname || "/dashboard";
    console.log(`PublicRoute: Authenticated user accessing public route. Redirecting to ${from}.`);
    return <Navigate to={from} replace />;
  }

  // If not loading and not authenticated, render the public page content.
  return children;
}

export default PublicRoute;
