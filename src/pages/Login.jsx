
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { Brain } from 'lucide-react'; // Import Brain icon

function Login() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [isResetting, setIsResetting] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const { login, resetPassword, loading } = useAuth(); // Get loading state
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos",
        variant: "destructive",
      });
      return;
    }
    
    await login(credentials);
    // Navigation is handled within useAuthService on successful login
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({
        title: "Error",
        description: "Por favor, ingresa tu email",
        variant: "destructive",
      });
      return;
    }

    const success = await resetPassword(resetEmail);
    if (success) {
      setIsResetting(false);
      setResetEmail("");
      // Toast message is handled within useAuthService
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
       {/* Link back to the main landing page */}
       <div className="absolute top-4 left-4">
         <Link to="/">
           <Button variant="ghost" className="text-white hover:bg-white/20">
             ← Volver al Inicio
           </Button>
         </Link>
       </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-xl p-8 w-full max-w-md space-y-8 shadow-2xl border border-white/20"
      >
        <div className="text-center">
           <Link to="/" className="inline-flex items-center justify-center mb-4"> {/* Link logo to root */}
             <Brain className="h-10 w-10 text-white" />
           </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Iniciar Sesión</h2>
          <p className="text-white/80">Accede a tu cuenta EmploySmart IA</p>
        </div>

        {!isResetting ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-base font-medium text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  className="mt-1 block w-full rounded-lg border border-white/30 
                    bg-white/10 text-white placeholder-white/50 p-3
                    focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent
                    text-base transition-all duration-200"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  placeholder="tu@email.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-base font-medium text-white mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  className="mt-1 block w-full rounded-lg border border-white/30 
                    bg-white/10 text-white placeholder-white/50 p-3
                    focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent
                    text-base transition-all duration-200"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-white hover:bg-white/90 text-blue-600 
                  font-semibold py-3 px-4 rounded-lg transition duration-200
                  text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                  disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Iniciando...' : 'Iniciar Sesión'}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <button
                onClick={() => setIsResetting(true)}
                className="text-white/80 hover:text-white text-sm transition-colors duration-200"
                disabled={loading}
              >
                ¿Olvidaste tu contraseña?
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 text-white/60 bg-transparent backdrop-blur-lg">
                    ¿No tienes una cuenta?
                  </span>
                </div>
              </div>

              <Link 
                to="/register"
                className={`block text-white hover:text-white/90 transition-colors duration-200
                  underline decoration-2 underline-offset-4 hover:decoration-4
                  font-medium text-base ${loading ? 'pointer-events-none opacity-50' : ''}`}
                aria-disabled={loading}
                tabIndex={loading ? -1 : undefined}
              >
                Regístrate Gratis
              </Link>
            </div>
          </>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-base font-medium text-white mb-2">
                Email para recuperación
              </label>
              <input
                type="email"
                autoComplete="email"
                className="mt-1 block w-full rounded-lg border border-white/30 
                  bg-white/10 text-white placeholder-white/50 p-3
                  focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent
                  text-base transition-all duration-200"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-white hover:bg-white/90 text-blue-600 
                font-semibold py-3 px-4 rounded-lg transition duration-200
                text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Email de Recuperación'}
            </Button>

            <button
              type="button"
              onClick={() => setIsResetting(false)}
              className="w-full text-white/80 hover:text-white text-sm transition-colors duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default Login;
