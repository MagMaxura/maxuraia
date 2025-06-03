import { useState, useEffect, useCallback, useMemo, useRef } from "react"; // Importar useRef
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/use-toast";
import { auth } from "../lib/auth";
import { supabase } from "../lib/supabase";

export function useAuthService() {
  console.log("useAuthService: Hook initialization");

  // Inicializar el estado user con el usuario de la sesión actual si existe
  const initialUser = supabase.auth.currentUser;
  const [user, setUser] = useState(initialUser);
  const [session, setSession] = useState(supabase.auth.session); // Inicializar sesión también
  const [loading, setLoading] = useState(!initialUser); // Iniciar en true solo si no hay usuario inicial
  const [authChecked, setAuthChecked] = useState(!!initialUser); // Marcar como checked si hay usuario inicial
  const { toast } = useToast();
  const lastFetchedUserId = useRef(initialUser?.id || null); // Inicializar ref con ID inicial si existe

  const handleAuthChange = useCallback(async (event, newSession) => {
    console.log(`useAuthService: handleAuthChange - Event: ${event}, New Session User ID:`, newSession?.user?.id);

    // No establecer loading a true inmediatamente aquí si el evento es INITIAL_SESSION y ya tenemos un usuario.
    // El estado de carga inicial se maneja en useState.
    if (event !== 'INITIAL_SESSION' || !user) {
       setLoading(true);
    }

    setSession(newSession);
    const supabaseAuthUser = newSession?.user || null;

    if (supabaseAuthUser) {
      // Determine if we need to fetch the full profile:
      // 1. If the user ID has changed (new user or login)
      // 2. If it's the first auth check (INITIAL_SESSION) and user state is null
      // 3. If the user ID is the same, but the current user state doesn't seem to have the full profile data (e.g., missing company/phone)
      const needsProfileFetch = lastFetchedUserId.current !== supabaseAuthUser.id ||
                                (event === 'INITIAL_SESSION' && !user) ||
                                (user && user.id === supabaseAuthUser.id && (!user.company || !user.phone)); // Check for profile completeness

      if (needsProfileFetch) {
        console.log(`useAuthService: Needs profile fetch. Reason: ID changed (${lastFetchedUserId.current !== supabaseAuthUser.id}), Initial session & no user (${event === 'INITIAL_SESSION' && !user}), or Inconsistent user state (${user && user.id === supabaseAuthUser.id && (!user.company || !user.phone)}). Attempting to fetch full profile for user ID: ${supabaseAuthUser.id}`);
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
        console.log("useAuthService: Profile fetch skipped. User ID matches last fetched ID and user state seems consistent.");
        // User ID is the same and user state seems consistent.
        // Ensure the auth.user reference is up-to-date.
        if (user && user.id === supabaseAuthUser.id) {
             console.log("useAuthService: User state is synced. Ensuring auth.user reference is current.");
             auth.user = user; // Ensure auth.user points to the current user state object
        } else {
             // This case should ideally not happen with the updated needsProfileFetch logic.
             // If it does, it's a deeper issue. Log a warning.
             console.warn("useAuthService: Unexpected state: User ID matches last fetched ID, but hook's user state is inconsistent after needsProfileFetch check.");
        }
      }
    } else { // No active session
      console.log("useAuthService: No active session, clearing user state.");
      setUser(null);
      auth.clearAuthUser();
      lastFetchedUserId.current = null; // Reset ref on logout
    }

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
    isProfileComplete: !!(user && user.id && user.company && user.phone), // Determinar si el perfil está completo (ejemplo: basado en campos requeridos)
    refreshUser: () => handleAuthChange("REFRESH", session), // Añadir la función refreshUser
  };
}
