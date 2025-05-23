import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterConfirmation from "./pages/RegisterConfirmation";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import CompleteProfile from "./pages/CompleteProfile"; // Importar la nueva página
import LegalPage from "./pages/LegalPage"; // Importar página de términos y políticas
import PrivacyPage from "./pages/PrivacyPage"; // Importar página de privacidad
import TermsPage from "./pages/TermsPage"; // Importar página de términos
// import SupabaseTestPage from "./pages/SupabaseTestPage"; // Ya no se importa
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthCallback from "./components/AuthCallback";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#f3f2ef]">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-confirmation" element={<RegisterConfirmation />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route
              path="/complete-profile"
              element={
                <ProtectedRoute>
                  <CompleteProfile />
                </ProtectedRoute>
              }
            />
            {/* <Route
              path="/supabase-test"
              element={
                <ProtectedRoute>
                  <SupabaseTestPage />
                </ProtectedRoute>
              }
            /> */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancelled" element={<PaymentCancelled />} />
          </Routes>
          <Toaster />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
