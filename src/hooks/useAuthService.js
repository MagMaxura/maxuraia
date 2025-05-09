import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/use-toast";
import { auth } from "../lib/auth";
import { supabase } from "../lib/supabase";

export function useAuthService() {
  console.log("useAuthService: Hook initialization");
  
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null); // <--- Añadir estado para la sesión
  const [loading, setLoading] = useState(true); // Iniciar en true hasta que se verifique la sesión inicial
  const [authChecked, setAuthChecked] = useState(false);
  const { toast } = useToast();
  // navigate ya no se usa directamente en este hook para la lógica principal de redirección
  // const navigate = useNavigate();

  const handleAuthChange = useCallback(async (event, newSession) => {
    console.log(`useAuthService: handleAuthChange - Event: ${event}, New Session User ID:`, newSession?.user?.id);
    
    setSession(newSession); // Actualizar el estado de la sesión
    const currentUser = newSession?.user || null;
    setUser(currentUser);
    setAuthChecked(true);
    setLoading(false);

    if (currentUser) {
      // La lógica de obtener perfil se ha simplificado aquí,
      // ya que el principal problema era el bucle de renderizado.
      // Los componentes pueden llamar a getRecruiterProfile si necesitan los datos del perfil.
      auth.user = currentUser;
      console.log("useAuthService: User and session state updated for user:", currentUser.id);
    } else {
      console.log("useAuthService: No active session, user and session state cleared.");
      auth.clearAuthUser();
    }
  }, []); // Sin dependencias para que sea estable

  useEffect(() => {
    console.log("useAuthService: useEffect - Setting up onAuthStateChange listener.");
    setLoading(true); // Indicar carga al inicio del efecto

    // onAuthStateChange se dispara con INITIAL_SESSION al cargar la página si hay una sesión,
    // o si no la hay. También se dispara con SIGNED_IN, SIGNED_OUT, etc.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`useAuthService: onAuthStateChange - Event received: ${event}`);
      handleAuthChange(event, session);
    });

    // La función de cleanup se ejecuta cuando el componente se desmonta
    return () => {
      // mounted = false; // Eliminar 'mounted'
      console.log("useAuthService: Cleanup - unsubscribing auth listener");
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [handleAuthChange]); // <--- Eliminar la dependencia [toast]

  // --- Simplificar/Eliminar funciones redundantes ---
  // La lógica de register ahora está en Register.jsx y src/lib/auth.js
  // La lógica de login ahora está en Login.jsx y src/lib/auth.js
  // Dejamos las funciones aquí por si otros componentes las usan,
  // pero asegurándonos de que llaman a las funciones correctas de src/lib/auth.js
  // y que no manejan navegación o toasts que ya se manejan en los componentes.

  // Las funciones register, login, logout, etc., ahora usan setLoading del hook
  // pero la lógica principal (llamadas a Supabase, manejo de errores específicos)
  // está en src/lib/auth.js. Estas funciones en el hook actúan como wrappers.

  const register = useCallback(async (formData) => {
    console.log("useAuthService: register wrapper called");
    setLoading(true);
    try {
      const result = await authFunctions.register(formData); // Usar authFunctions
      return result;
    } catch (error) {
      console.error("useAuthService: Registration error in wrapper:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    console.log("useAuthService: login wrapper called");
    setLoading(true);
    try {
      const result = await authFunctions.login(credentials); // Usar authFunctions
      // La sesión se establecerá a través de onAuthStateChange si el login en auth.js es exitoso
      return result;
    } catch (error) {
      console.error("useAuthService: Login error in wrapper:", error);
      // authFunctions.login ya debería devolver un objeto con el error
      return { success: false, error: error.message || "Error inesperado en login wrapper." };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    console.log("useAuthService: logout wrapper called");
    setLoading(true);
    try {
      await authFunctions.logout(); // Usar authFunctions
      // onAuthStateChange se encargará de limpiar user y session
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });
    } catch (error) {
      console.error("useAuthService: Logout error in wrapper:", error);
      toast({
        title: "Error al cerrar sesión",
        description: error.message || "No se pudo cerrar la sesión.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const resetPassword = useCallback(async (email) => {
    console.log("useAuthService: resetPassword wrapper called");
    setLoading(true);
    try {
      const result = await authFunctions.resetPassword(email); // Usar authFunctions
      toast({
        title: "Email enviado",
        description: "Revisa tu correo para restablecer tu contraseña.",
      });
      return result;
    } catch (error) {
      console.error("useAuthService: Reset password error in wrapper:", error);
      toast({
        title: "Error al enviar email",
        description: error.message || "No se pudo enviar el email de recuperación.",
        variant: "destructive",
      });
      throw error; // Re-lanzar para que el componente lo maneje si es necesario
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    user,
    session, // Exponer la sesión completa
    loading,
    authChecked,
    login,
    logout,
    register,
    resetPassword,
    isAuthenticated: !!user, // Basado en el estado user
  };
}
