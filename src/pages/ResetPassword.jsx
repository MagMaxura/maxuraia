import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import { supabase } from "../lib/supabase";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setHasSession(!!session);
      } catch (error) {
        console.error('Error checking session:', error);
        toast({
          title: "Error",
          description: "No se pudo verificar tu sesión. Por favor, solicita un nuevo enlace de restablecimiento.",
          variant: "destructive",
        });
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasSession) {
      toast({
        title: "Error",
        description: "No hay una sesión activa. Por favor, solicita un nuevo enlace de restablecimiento.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        if (error.message.includes('stronger password')) {
          throw new Error('La contraseña es demasiado débil. Usa una combinación de letras, números y símbolos.');
        }
        throw error;
      }

      toast({
        title: "¡Éxito!",
        description: "Tu contraseña ha sido actualizada correctamente",
      });
      
      // Sign out after password change for security
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error('Password update error:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la contraseña. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Sesión no válida</h2>
          <p className="mb-4">El enlace de restablecimiento de contraseña ha expirado o no es válido.</p>
          <Button
            onClick={() => navigate('/login')}
            className="bg-white text-blue-600 hover:bg-white/90"
          >
            Volver al inicio de sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-blue-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-xl p-8 w-full max-w-md space-y-8 shadow-2xl border border-white/20"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Restablecer Contraseña</h2>
          <p className="text-white/80">Ingresa tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-base font-medium text-white mb-2">
              Nueva Contraseña
            </label>
            <input
              type="password"
              className="mt-1 block w-full rounded-lg border border-white/30 
                bg-white/10 text-white placeholder-white/50 p-3
                focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent
                text-base transition-all duration-200"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-base font-medium text-white mb-2">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              className="mt-1 block w-full rounded-lg border border-white/30 
                bg-white/10 text-white placeholder-white/50 p-3
                focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent
                text-base transition-all duration-200"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-white hover:bg-white/90 text-blue-600 
              font-semibold py-3 px-4 rounded-lg transition duration-200
              text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Actualizar Contraseña
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

export default ResetPassword;
