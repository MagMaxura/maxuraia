import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Building2, Phone, Globe, Users, Flag } from 'lucide-react';

function Register() {
  console.log("Register component rendering");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  console.log("Register: register function available:", !!register);

  // validateWebsite ya no es necesaria aquí ya que el campo website fue eliminado del formulario inicial.

  const handleSubmit = async (e) => {
    console.log("Register.jsx: handleSubmit - INICIO DE FUNCIÓN");
    e.preventDefault();
    
    if (isSubmitting) {
      console.log("Register.jsx: Form submission blocked - already submitting");
      return;
    }

    if (!register) {
      console.error("Register.jsx: register function is not available");
      toast({
        title: "Error del sistema",
        description: "No se puede procesar el registro en este momento.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Register.jsx: Form data being validated:", formData);
    
    // Validate required fields
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, completa email, contraseña y confirmación de contraseña.",
        variant: "destructive",
      });
      return;
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      console.log("Register.jsx: Passwords don't match");
      toast({
        title: "Error en la contraseña",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      console.log("Register.jsx: Password too short");
      toast({
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    // Validate website format - ya no está en este formulario

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.log("Register.jsx: Invalid email format");
      toast({
        title: "Formato de email inválido",
        description: "Por favor, ingresa un email válido",
        variant: "destructive",
      });
      return;
    }

    console.log("Register.jsx: All validations passed, proceeding with registration");
    setIsSubmitting(true);

    try {
      // Solo necesitamos email y password para el signUp inicial
      const dataForSignUp = {
        email: formData.email,
        password: formData.password,
      };
      // No es necesario pasar confirmPassword a la función de signUp de Supabase.
      // La validación de que coinciden ya se hizo.

      console.log("Register.jsx: Calling register function with data for signUp:", dataForSignUp);
      const registrationAttempt = await register(dataForSignUp);

      console.log("Register.jsx: Registration (signUp) attempt result:", registrationAttempt);
      
      if (registrationAttempt && registrationAttempt.user) {
        console.log("Register.jsx: SignUp successful, user needs to confirm email.");
        // Ya no guardamos 'pendingUserProfile' aquí, eso se hará en la página /complete-profile
        toast({
          title: "¡Casi listo!",
          description: "Hemos enviado un correo de confirmación a tu email. Por favor, revísalo para activar tu cuenta.",
          variant: "default",
          duration: 10000,
        });
        
        setFormData({ email: "", password: "", confirmPassword: "" }); // Limpiar formulario
        
        // Redirigir al usuario a la página de login después de mostrar el mensaje
        console.log("Register.jsx: Attempting to navigate to /login"); // Log de depuración
        navigate('/login');
      } else {
        // Esto no debería suceder si register no lanzó un error, pero es una salvaguarda
        console.error("Register.jsx: SignUp attempt did not return expected user object or needsEmailConfirmation was false.");
        toast({
          title: "Error Inesperado",
          description: "Ocurrió un problema durante el registro. Intenta nuevamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Register.jsx: Error during signUp process:", error.message, error);
      toast({
        title: "Error en el registro",
        description: error.message || "Ocurrió un error inesperado durante el registro.",
        variant: "destructive",
      });
    } finally {
      console.log("Register.jsx: Registration process completed, resetting submit state");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-blue-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-xl p-8 w-full max-w-2xl space-y-8 shadow-2xl border border-white/20"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Prueba Gratuita</h2>
          <p className="text-white/80">7 días de acceso completo sin costo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="md:col-span-2"> {/* Email ocupa todo el ancho */}
              <label className="block text-base font-medium text-white mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <input
                  type="email"
                  className="mt-1 block w-full rounded-lg border border-white/30
                    bg-white/10 text-white placeholder-white/50 p-3 pl-10
                    focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tu@email.com"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="md:col-span-2"> {/* Contraseña ocupa todo el ancho */}
              <label className="block text-base font-medium text-white mb-2">
                Contraseña *
              </label>
              <input
                type="password"
                className="mt-1 block w-full rounded-lg border border-white/30
                  bg-white/10 text-white placeholder-white/50 p-3
                  focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Confirmar Contraseña */}
            <div className="md:col-span-2"> {/* Confirmar Contraseña ocupa todo el ancho */}
              <label className="block text-base font-medium text-white mb-2">
                Confirmar contraseña *
              </label>
              <input
                type="password"
                className="mt-1 block w-full rounded-lg border border-white/30
                  bg-white/10 text-white placeholder-white/50 p-3
                  focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          {/* Marketing Consent ya no está en este formulario */}

          <Button
            type="submit"
            className="w-full bg-white hover:bg-white/90 text-blue-600
              font-semibold py-3 px-4 rounded-lg transition duration-200
              text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Procesando..." : "Registrarme"}
          </Button>

          <p className="text-sm text-white/60 text-center mt-4">
            Al registrarte, aceptas nuestros términos y condiciones y nuestra política de privacidad.
          </p>
        </form>
      </motion.div>
    </div>
  );
}

export default Register;
