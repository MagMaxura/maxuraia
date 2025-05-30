import { useState, useEffect, useCallback, useMemo, useRef } from "react"; // Importar useRef
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
  const lastFetchedUserId = useRef(null); // <-- Añadir un ref para rastrear el último ID de usuario para el que se obtuvo el perfil.

  const handleAuthChange = useCallback(async (event, newSession) => {
    console.log(`useAuthService: handleAuthChange - Event: ${event}, New Session User ID:`, newSession?.user?.id);

    setSession(newSession);
    const supabaseAuthUser = newSession?.user || null;

    if (supabaseAuthUser) {
      // Solo obtener el perfil completo si el ID del usuario ha cambiado desde la última vez
      // o si es la primera vez que se maneja un usuario autenticado.
      if (lastFetchedUserId.current !== supabaseAuthUser.id) {
        setLoading(true); // Indicar carga mientras se obtiene el perfil
        try {
          console.log("useAuthService: Fetching full recruiter profile for user ID:", supabaseAuthUser.id);
          // auth.getRecruiterProfile ahora devuelve el perfil de 'reclutadores' + 'suscripcion'
          const fullUserProfile = await auth.getRecruiterProfile(supabaseAuthUser.id);

          if (fullUserProfile) {
            console.log("useAuthService: Full user profile fetched:", fullUserProfile);
            setUser(fullUserProfile); // Establecer el estado 'user' con el perfil completo
            auth.user = fullUserProfile; // Actualizar la referencia en el objeto 'auth' también
            lastFetchedUserId.current = supabaseAuthUser.id; // Actualizar el ref con el ID del usuario cuyo perfil se obtuvo
          } else {
            // Perfil no encontrado en 'reclutadores', pero el usuario está autenticado.
            console.warn("useAuthService: Recruiter profile not found for authenticated user. Setting user to Supabase Auth user object.", supabaseAuthUser.id);
            setUser(supabaseAuthUser);
            auth.user = supabaseAuthUser;
            lastFetchedUserId.current = supabaseAuthUser.id; // Actualizar el ref incluso si el perfil no se encontró, el usuario está autenticado
          }
        } catch (error) {
          console.error("useAuthService: Error fetching full user profile:", error);
          // En caso de error al obtener el perfil completo, usar el usuario de Supabase Auth como fallback
          setUser(supabaseAuthUser);
          auth.user = supabaseAuthUser;
          lastFetchedUserId.current = null; // Resetear el ref en caso de error para intentar de nuevo si el evento se dispara otra vez? O mantener el ID? Mantengamos el ID para evitar bucles si el fetch falla repetidamente para el mismo ID.
          // lastFetchedUserId.current = supabaseAuthUser.id; // Mantener el ID
          // Podrías mostrar un toast aquí si el error es crítico
        } finally {
           // setLoading(false); // El setLoading(false) final se maneja fuera de este bloque if
        }
      } else {
        console.log("useAuthService: User ID matches last fetched ID. No profile fetch needed.");
        // Asegurarse de que el estado 'user' esté sincronizado si por alguna razón no lo está
        if (!user || user.id !== supabaseAuthUser.id) {
             console.warn("useAuthService: User state out of sync with last fetched ID. Updating user state.");
             setUser(supabaseAuthUser); // Usar supabaseAuthUser como fallback
             auth.user = supabaseAuthUser;
        }
      }
    } else {
      console.log("useAuthService: No active session, clearing user state.");
      setUser(null);
      auth.clearAuthUser();
      lastFetchedUserId.current = null; // <-- Resetear el ref al cerrar sesión
    }

    setAuthChecked(true);
    setLoading(false); // <-- Establecer loading a false al final de handleAuthChange
  }, []); // Las dependencias están vacías, handleAuthChange es estable.

  useEffect(() => {
    console.log("useAuthService: useEffect - Setting up onAuthStateChange listener.");
    // setLoading(true); // Eliminado: el estado de carga se maneja dentro de handleAuthChange

    // onAuthStateChange se dispara con INITIAL_SESSION al cargar la página si hay una sesión,
    // o si no la hay. También se dispara con SIGNED_IN, SIGNED_OUT, etc.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`useAuthService: onAuthStateChange - Event received: ${event}`);
      // Considerar si necesitas establecer loading(true) aquí para *todos* los eventos,
      // o solo dentro de handleAuthChange cuando se dispara una obtención de perfil.
      // La lógica actual lo maneja dentro de handleAuthChange solo cuando se obtiene el perfil.
      handleAuthChange(event, session);
    });

    // La función de cleanup se ejecuta cuando el componente se desmonta
    return () => {
      console.log("useAuthService: Cleanup - unsubscribing auth listener");
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [handleAuthChange]); // handleAuthChange es estable debido a useCallback con dependencias vacías

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
