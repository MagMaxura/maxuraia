import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
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
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import CheckoutPage from "./pages/CheckoutPage"; // Importa CheckoutPage
// import SupabaseTestPage from "./pages/SupabaseTestPage"; // Ya no se importa
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthCallback from "./components/AuthCallback";

// Carga tu clave pública de Stripe. Asegúrate de tenerla en tus variables de entorno.
// Es seguro exponer la clave pública en el frontend.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function App() {
  const options = {
    // Opciones para Elements, si es necesario (ej. apariencia)
    // Puedes configurar cosas como la moneda, locale, etc. aquí
    // mode: 'payment', // o 'setup' o 'subscription'
    // amount: 1099, // en la unidad más pequeña de la moneda (ej. centavos)
    // currency: 'usd',
    // appearance: { /* ... */ },
  };

  return (
    <Router>
      <AuthProvider>
        <Elements stripe={stripePromise} options={options}> {/* Envuelve con Elements */}
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
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancelled" element={<PaymentCancelled />} />
            {/* Nueva ruta para la página de checkout con Stripe Elements */}
            <Route path="/checkout/:priceId" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
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

            </Routes>
            <Toaster />
          </div>
        </Elements> {/* Cierra Elements */}
      </AuthProvider>
    </Router>
  );
}

export default App;
