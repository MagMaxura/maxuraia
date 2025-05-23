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
    
    setSession(newSession);
    const supabaseAuthUser = newSession?.user || null;
    
    if (supabaseAuthUser) {
      try {
        console.log("useAuthService: Fetching full recruiter profile for user ID:", supabaseAuthUser.id);
        // auth.getRecruiterProfile ahora devuelve el perfil de 'reclutadores' + 'suscripcion'
        const fullUserProfile = await auth.getRecruiterProfile(supabaseAuthUser.id);
        
        if (fullUserProfile) {
          console.log("useAuthService: Full user profile fetched:", fullUserProfile);
          setUser(fullUserProfile); // Establecer el estado 'user' con el perfil completo
          auth.user = fullUserProfile; // Actualizar la referencia en el objeto 'auth' también
        } else {
          // Perfil no encontrado en 'reclutadores', pero el usuario está autenticado.
          // Esto podría ser un usuario recién registrado que aún no ha completado el perfil,
          // o un estado inconsistente. Por ahora, establecemos user con supabaseAuthUser.
          // La lógica de creación de perfil en el login o registro debería manejar esto.
          console.warn("useAuthService: Recruiter profile not found for authenticated user. Setting user to Supabase Auth user object.", supabaseAuthUser.id);
          setUser(supabaseAuthUser);
          auth.user = supabaseAuthUser;
        }
      } catch (error) {
        console.error("useAuthService: Error fetching full user profile:", error);
        // En caso de error al obtener el perfil completo, usar el usuario de Supabase Auth como fallback
        setUser(supabaseAuthUser);
        auth.user = supabaseAuthUser;
        // Podrías mostrar un toast aquí si el error es crítico
      }
    } else {
      console.log("useAuthService: No active session, clearing user state.");
      setUser(null);
      auth.clearAuthUser();
    }
    
    setAuthChecked(true);
    setLoading(false);
  }, []);

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
      const result = await auth.register(formData); // Corregido: usar 'auth' importado
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
      const result = await auth.login(credentials); // Corregido: usar 'auth' importado
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
      await auth.logout(); // Corregido: usar 'auth' importado
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
      const result = await auth.resetPassword(email); // Corregido: usar 'auth' importado
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
    refreshUser: () => handleAuthChange("REFRESH", session), // Añadir la función refreshUser
  };
}
