import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/use-toast";
import { auth } from "../lib/auth";
import { supabase } from "../lib/supabase";

export function useAuthService() {
  console.log("useAuthService: Hook initialization");
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAuthChange = useCallback(async (event, session) => {
    console.log("Auth state changed:", event, session);
    const currentUser = session?.user;

    if (currentUser) {
      try {
        // Usar getRecruiterProfile por ID en lugar de email
        const profileData = await auth.getRecruiterProfile(currentUser.id);
        
        // Guardar solo el usuario de autenticación por ahora.
        // Los componentes pueden obtener el perfil completo si lo necesitan.
        // Esto simplifica el estado aquí y evita posibles bucles si profileData cambia.
        auth.user = currentUser; // Actualizar la instancia singleton si se usa en otro lugar
        // Considera si realmente necesitas guardar en localStorage aquí o si la sesión de Supabase es suficiente
        // localStorage.setItem('auth_user', JSON.stringify(currentUser));
        setUser(currentUser);
        console.log("useAuthService: User session set:", currentUser);

        // Ya no manejamos la navegación aquí, se hace en Login.jsx y AuthCallback.jsx
        // if (event === 'SIGNED_IN') {
        //    // La navegación depende de si el perfil existe, manejado en Login/Callback
        // }

      } catch (error) {
        // Error al intentar obtener el perfil (puede ser un error de red o RLS si la política SELECT falla)
        console.error("useAuthService: Error fetching recruiter profile during auth change:", error);
        // Aún así, establecemos el usuario de autenticación si la sesión existe
        auth.user = currentUser;
        // localStorage.setItem('auth_user', JSON.stringify(currentUser));
        setUser(currentUser);
        // Podríamos mostrar un toast aquí si obtener el perfil es crítico en este punto
        // toast({ title: "Advertencia", description: "No se pudo cargar completamente el perfil.", variant: "warning" });
      } finally {
         // if (mounted) setAuthChecked(true); // Eliminar check 'mounted'
         setAuthChecked(true); // Establecer authChecked directamente
      }
    } else {
      // No hay sesión de Supabase
      console.log("useAuthService: No user session found or user logged out.");
      auth.clearAuthUser(); // Limpiar la instancia singleton
      // localStorage.removeItem('auth_user'); // Limpiar localStorage si se usa
      // if (mounted) { // Eliminar check 'mounted'
         setUser(null);
         setAuthChecked(true);
      // }
      // Ya no manejamos la navegación de SIGNED_OUT aquí
      // if (event === 'SIGNED_OUT' && window.location.pathname !== '/login') {
      //    navigate("/login", { replace: true });
      // }
    }
  }, [toast]); // Eliminar navigate de las dependencias ya que no se usa aquí

  useEffect(() => {
    // let mounted = true; // Eliminar 'mounted'
    console.log("useAuthService: Mount effect running");

    const checkInitialSession = async () => {
      // if (!mounted) return; // Eliminar check
      console.log("useAuthService: Checking initial session...");
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        // if (!mounted) return; // Eliminar check
        if (error) {
          console.error("useAuthService: Error getting initial session:", error);
          await handleAuthChange('INITIAL_SESSION_ERROR', null);
        } else {
          await handleAuthChange('INITIAL_SESSION_LOADED', session);
        }
      } catch (e) {
        // if (!mounted) return; // Eliminar check
        console.error("useAuthService: Critical error during initial session check:", e);
        auth.clearAuthUser();
        setUser(null); // Asegurarse de que setUser y setAuthChecked estén disponibles aquí
        setAuthChecked(true);
        toast({
          title: "Error Crítico de Sesión",
          description: "No se pudo verificar el estado de autenticación inicial.",
          variant: "destructive",
        });
      }
    };

    checkInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // if (!mounted) return; // Eliminar check
      // La función de cleanup del useEffect se encargará de desuscribir
      console.log(`useAuthService: onAuthStateChange event: ${event}, session present: ${!!session}`);
      await handleAuthChange(event, session);
    });

    // La función de cleanup se ejecuta cuando el componente se desmonta
    return () => {
      // mounted = false; // Eliminar 'mounted'
      console.log("useAuthService: Cleanup - unsubscribing auth listener");
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [handleAuthChange, toast]); // handleAuthChange ahora tiene menos dependencias

  // --- Simplificar/Eliminar funciones redundantes ---
  // La lógica de register ahora está en Register.jsx y src/lib/auth.js
  // La lógica de login ahora está en Login.jsx y src/lib/auth.js
  // Dejamos las funciones aquí por si otros componentes las usan,
  // pero asegurándonos de que llaman a las funciones correctas de src/lib/auth.js
  // y que no manejan navegación o toasts que ya se manejan en los componentes.

  const register = useCallback(async (formData) => {
    // Esta función ahora solo llama a auth.register y devuelve el resultado
    // El componente Register.jsx maneja el toast y la lógica post-registro.
    console.log("useAuthService: register called");
    setLoading(true);
    try {
      // Llama a la función register de src/lib/auth.js que devuelve { user, needsEmailConfirmation }
      const result = await auth.register(formData);
      return result; // Devolver el resultado para que Register.jsx lo maneje
    } catch (error) {
      console.error("useAuthService: Registration error:", error);
      // Re-lanzar el error para que Register.jsx lo capture y muestre el toast
      throw error;
    } finally {
      setLoading(false);
    }
  }, []); // No necesita dependencias si solo llama a auth.register

  const login = useCallback(async (credentials) => {
    // Esta función ahora solo llama a auth.login y devuelve el resultado
    // El componente Login.jsx maneja el toast y la navegación.
    console.log("useAuthService: login called");
    setLoading(true);
    try {
      // Llama a la función login de src/lib/auth.js que devuelve { success, profileExists, error }
      const result = await auth.login(credentials);
      return result; // Devolver el resultado para que Login.jsx lo maneje
    } catch (error) {
      // Esto no debería ocurrir si auth.login maneja sus propios errores y devuelve un objeto
      console.error("useAuthService: Unexpected error during login call:", error);
      return { success: false, error: error.message || "Error inesperado." };
    } finally {
      setLoading(false);
    }
  }, []); // No necesita dependencias si solo llama a auth.login

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await auth.logout();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión. Inténtalo de nuevo.",
        variant: "destructive",
      });
       console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const resetPassword = useCallback(async (email) => {
    setLoading(true);
    try {
      await auth.resetPassword(email);
      toast({
        title: "Email enviado",
        description: "Revisa tu correo para restablecer tu contraseña.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el email de recuperación.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    user,
    loading,
    authChecked,
    login,
    logout,
    register,
    resetPassword,
    isAuthenticated: !!user,
  };
}
