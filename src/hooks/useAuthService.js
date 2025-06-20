import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
      // If the user ID hasn't changed and we already have a user with a fetched profile,
      // we can potentially skip fetching the profile again to avoid unnecessary re-renders.
      // We check lastFetchedUserId.current to ensure the profile was successfully fetched previously.
      if (user && user.id === supabaseAuthUser.id && lastFetchedUserId.current === supabaseAuthUser.id) {
        console.log(`useAuthService: handleAuthChange - User ID ${supabaseAuthUser.id} is the same and profile already fetched, skipping profile fetch.`);
        // User state is already correct, just ensure loading is false and authChecked is true.
        setAuthChecked(true);
        setLoading(false);
        return; // Exit the function early as no further state updates are needed for this user.
      }

      console.log(`useAuthService: Authenticated user found. Attempting to fetch full profile for user ID: ${supabaseAuthUser.id}`);
      try {
        // Attempt to fetch the full profile. This is necessary if it's a new session,
        // a different user, or if the previous profile fetch failed.
        const fullUserProfile = await auth.getRecruiterProfile(supabaseAuthUser.id);

        let userToSet = fullUserProfile;

        if (!fullUserProfile) {
          // Profile not found in 'reclutadores', but user is authenticated.
          console.warn("useAuthService: Recruiter profile not found for authenticated user. Setting user state to basic Supabase Auth user.");
          userToSet = supabaseAuthUser; // Use basic user as fallback
          auth.user = supabaseAuthUser;
          lastFetchedUserId.current = supabaseAuthUser.id; // Mark ID as processed even if profile not found
        } else {
          console.log("useAuthService: Full user profile fetched successfully.");
          auth.user = fullUserProfile; // Update auth object reference
          lastFetchedUserId.current = supabaseAuthUser.id; // Mark this user ID as having its profile fetched
        }

        // Lógica para asegurar que el usuario tenga una suscripción de prueba
        if (userToSet && !userToSet.suscripcion) {
          console.log("useAuthService: User has profile but no active subscription. Attempting to create trial subscription.");
          try {
            const defaultPlanId = 'trial';
            const trialDays = 7;
            const trialEnds = new Date();
            trialEnds.setDate(trialEnds.getDate() + trialDays);

            const defaultSubscription = {
              recruiter_id: userToSet.id,
              plan_id: defaultPlanId,
              status: 'trialing',
              trial_ends_at: trialEnds.toISOString(),
            };

            const { data: newSubscription, error: subError } = await supabase
              .from('suscripciones')
              .insert([defaultSubscription])
              .select()
              .single();

            if (subError) {
              console.error("useAuthService: Error creating trial subscription:", subError);
            } else if (!newSubscription) {
              console.warn("useAuthService: Trial subscription INSERT returned no data, but no error. Check RLS or table configuration.");
            } else {
              console.log("useAuthService: Trial subscription created successfully:", newSubscription);
              userToSet.suscripcion = newSubscription; // Añadir la suscripción al objeto de usuario
            }
          } catch (subCreationError) {
            console.error("useAuthService: Exception during trial subscription creation:", subCreationError);
          }
        }
        setUser(userToSet); // Set state with the (potentially updated) user profile
      } catch (error) {
        console.error("useAuthService: Error fetching full user profile or creating subscription:", error);
        // On error fetching profile, use basic user as fallback and mark ID as processed
        setUser(supabaseAuthUser);
        auth.user = supabaseAuthUser;
        lastFetchedUserId.current = supabaseAuthUser.id; // Mark ID as processed even on error
      }
    } else { // No active session
      console.log("useAuthService: No active session, clearing user state.");
      setUser(null);
      auth.clearAuthUser();
      lastFetchedUserId.current = null; // Reset ref on logout
    }

    setAuthChecked(true);
    setLoading(false); // Set loading false at the very end of processing the event

  }, [user]); // Depende de 'user' para re-ejecutar si el usuario cambia (ej. después de un login)

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
    refreshUser: useCallback(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      handleAuthChange("REFRESH", currentSession);
    }, [handleAuthChange]), // Depende de handleAuthChange, que ya es estable
  };
}
