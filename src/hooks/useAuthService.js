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

    setLoading(true); // Set loading true at the start of processing the event
    setSession(newSession);
    const supabaseAuthUser = newSession?.user || null;

    if (supabaseAuthUser) {
      // If the user ID has changed or it's the first time we see an authenticated user
      if (lastFetchedUserId.current !== supabaseAuthUser.id) {
        console.log("useAuthService: User ID changed or first auth check. Attempting to fetch full profile.");
        try {
          const fullUserProfile = await auth.getRecruiterProfile(supabaseAuthUser.id);

          if (fullUserProfile) {
            console.log("useAuthService: Full user profile fetched successfully.");
            setUser(fullUserProfile); // Set state with the full profile
            auth.user = fullUserProfile; // Update auth object reference
            lastFetchedUserId.current = supabaseAuthUser.id; // Mark this user ID as having its profile fetched
          } else {
            // Profile not found in 'reclutadores', but user is authenticated.
            console.warn("useAuthService: Recruiter profile not found for authenticated user. Setting user state to basic Supabase Auth user.");
            setUser(supabaseAuthUser); // Use basic user as fallback
            auth.user = supabaseAuthUser;
            lastFetchedUserId.current = supabaseAuthUser.id; // Mark ID as processed even if profile not found
          }
        } catch (error) {
          console.error("useAuthService: Error fetching full user profile:", error);
          // On error fetching profile, use basic user as fallback and mark ID as processed
          setUser(supabaseAuthUser);
          auth.user = supabaseAuthUser;
          lastFetchedUserId.current = supabaseAuthUser.id; // Mark ID as processed even on error
        }
      } else {
        console.log("useAuthService: User ID matches last fetched ID. Profile fetch skipped.");
        // User ID is the same. The 'user' state should already hold the profile
        // from the previous successful fetch or fallback.
        // Ensure the auth.user reference is up-to-date if the hook's user state is valid.
        if (user && user.id === supabaseAuthUser.id) {
             console.log("useAuthService: User state is synced. Ensuring auth.user reference is current.");
             auth.user = user; // Ensure auth.user points to the current user state object
        } else {
             // If user state is inconsistent despite matching ID, attempt to set it to the basic Supabase user
             // This might help stabilize the state and break a potential loop.
             console.warn("useAuthService: User ID matches last fetched ID, but hook's user state is inconsistent. Attempting to set user state to basic Supabase user.");
             setUser(supabaseAuthUser); // Attempt to set state to basic user
             auth.user = supabaseAuthUser; // Update auth.user reference
             // Note: This might overwrite a richer profile if it was somehow lost from the hook's state.
             // A more robust solution might involve re-fetching the profile here, but that risks the loop.
             // This is a pragmatic step to try and break the current inconsistency loop.
        }
      }
    } else { // No active session
      console.log("useAuthService: No active session, clearing user state.");
      setUser(null);
      auth.clearAuthUser();
      lastFetchedUserId.current = null; // Reset ref on logout
    }

    setAuthChecked(true);
    setLoading(false); // Set loading false at the very end of processing the event
  }, []); // Keep dependencies empty for stability

  useEffect(() => {
    console.log("useAuthService: useEffect - Setting up onAuthStateChange listener.");
    // El estado de carga inicial se establece en el useState.
    // El manejo de carga durante los cambios de autenticación se hace en handleAuthChange.

    // onAuthStateChange se dispara con INITIAL_SESSION al cargar la página si hay una sesión,
    // o si no la hay. También se dispara con SIGNED_IN, SIGNED_OUT, etc.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`useAuthService: onAuthStateChange - Event received: ${event}`);
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
