
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import RegisterConfirmation from "@/pages/RegisterConfirmation";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Landing from "@/pages/Landing"; // This is the main landing page now
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#f3f2ef]">
          <Routes>
            <Route path="/" element={<Landing />} /> {/* Landing page is now the root */}
            <Route path="/login" element={<Login />} /> {/* Login page moved to /login */}
            <Route path="/register" element={<Register />} />
            <Route path="/register-confirmation" element={<RegisterConfirmation />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            {/* Removed /about route */}
            {/* Add a catch-all or 404 page if desired */}
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
          <Toaster />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
