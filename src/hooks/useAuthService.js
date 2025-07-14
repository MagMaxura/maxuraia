import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/use-toast";
import { auth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { APP_PLANS } from "../config/plans";

export function useAuthService() {
  // console.log("useAuthService: Hook initialization");

  // Inicializar el estado user con el usuario de la sesión actual si existe
  const initialUser = supabase.auth.currentUser;
  const [user, setUser] = useState(initialUser);
  const [session, setSession] = useState(supabase.auth.session); // Inicializar sesión también
  const [loading, setLoading] = useState(!initialUser); // Iniciar en true solo si no hay usuario inicial
  const [authChecked, setAuthChecked] = useState(!!initialUser); // Marcar como checked si hay usuario inicial
  const { toast } = useToast();
  const lastFetchedUserId = useRef(initialUser?.id || null); // Inicializar ref con ID inicial si existe

  const handleAuthChange = useCallback(async (event, newSession) => {
    console.debug(`[DEBUG] useAuthService: handleAuthChange - Event: ${event}, New Session User ID:`, newSession?.user?.id);

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
      // Si el evento es REFRESH, siempre intentar obtener el perfil completo para asegurar la actualización de datos como cvs_analizados_este_periodo.
      // Para otros eventos, si el ID de usuario no ha cambiado y el perfil ya fue fetchado, podemos saltar la obtención.
      if (event !== 'REFRESH' && user && user.id === supabaseAuthUser.id && lastFetchedUserId.current === supabaseAuthUser.id) {
        console.debug(`[DEBUG] useAuthService: handleAuthChange - User ID ${supabaseAuthUser.id} is the same and profile already fetched (non-REFRESH event), skipping profile fetch.`);
        setAuthChecked(true);
        setLoading(false);
        return;
      }

      console.debug(`[DEBUG] useAuthService: Authenticated user found. Attempting to fetch full profile for user ID: ${supabaseAuthUser.id}`);
      try {
        const fullUserProfile = await auth.getRecruiterProfile(supabaseAuthUser.id);

        let userToSet = fullUserProfile;

        if (!fullUserProfile) {
          console.warn("[DEBUG] useAuthService: Recruiter profile not found for authenticated user. Setting user state to basic Supabase Auth user.");
          userToSet = supabaseAuthUser;
          auth.user = supabaseAuthUser;
          lastFetchedUserId.current = supabaseAuthUser.id;
        } else {
          console.debug("[DEBUG] useAuthService: Full user profile fetched successfully.");
          auth.user = fullUserProfile;
          lastFetchedUserId.current = supabaseAuthUser.id;
        }

        // Lógica para asegurar que el usuario tenga una suscripción de prueba si no tiene ninguna activa
        if (userToSet && (!userToSet.suscripcion || (userToSet.suscripcion.status !== 'active' && userToSet.suscripcion.status !== 'trialing'))) {
          console.debug("[DEBUG] useAuthService: User has profile but no active monthly/one-time subscription. Attempting to create trial subscription.");
          try {
            const defaultPlanId = 'trial';
            const trialDays = 7;
            const trialEnds = new Date();
            trialEnds.setDate(trialEnds.getDate() + trialDays);

            // Obtener los límites del plan trial desde APP_PLANS
            const trialPlanDetails = APP_PLANS[defaultPlanId];
            const trialCvLimit = trialPlanDetails?.cvLimit || 0;
            const trialJobLimit = trialPlanDetails?.jobLimit || 0;

            const defaultSubscription = {
              recruiter_id: userToSet.id,
              plan_id: defaultPlanId,
              status: 'trialing',
              trial_ends_at: trialEnds.toISOString(),
            };

            const { data: newSubscription, error: subError } = await supabase
              .from('suscripciones')
              .upsert({
                recruiter_id: userToSet.id,
                plan_id: defaultPlanId,
                status: 'trialing',
                trial_ends_at: trialEnds.toISOString(),
                current_period_start: new Date().toISOString(),
                current_period_end: trialEnds.toISOString(),
                cvs_analizados_este_periodo: 0,
                CV_Max_plan: trialCvLimit,
                Jobs_Max_plan: trialJobLimit,
                one_time_cv_bonus: 0,
                one_time_job_bonus: 0,
              }, { onConflict: 'recruiter_id' })
              .select()
              .single();

            if (subError) {
              console.error("[DEBUG] useAuthService: Error creating trial subscription:", subError);
            } else if (!newSubscription) {
              console.warn("[DEBUG] useAuthService: Trial subscription UPSERT returned no data, but no error. Check RLS or table configuration.");
            } else {
              console.debug("[DEBUG] useAuthService: Trial subscription created/updated successfully:", newSubscription);
              // Asegurarse de que userToSet.suscripcion contenga todas las propiedades de newSubscription
              userToSet.suscripcion = {
                ...newSubscription, // Copiar todas las propiedades de la nueva suscripción
                current_plan_details: APP_PLANS[newSubscription.plan_id], // Añadir detalles del plan
                one_time_plan_details: null, // Asegurar que no haya detalles de plan de un solo uso si es trial
              };
            }
          } catch (subCreationError) {
            console.error("[DEBUG] useAuthService: Exception during trial subscription creation:", subCreationError);
          }
        }
        setUser(userToSet);
      } catch (error) {
        console.error("[DEBUG] useAuthService: Error fetching full user profile or creating subscription:", error);
        setUser(supabaseAuthUser);
        auth.user = supabaseAuthUser;
        lastFetchedUserId.current = supabaseAuthUser.id;
      }
    } else {
      console.debug("[DEBUG] useAuthService: No active session, clearing user state.");
      setUser(null);
      auth.clearAuthUser();
      lastFetchedUserId.current = null;
    }

    setAuthChecked(true);
    setLoading(false); // Set loading false at the very end of processing the event
 
   }, [setUser, setAuthChecked, setLoading, auth.getRecruiterProfile, auth.user, auth.clearAuthUser, lastFetchedUserId, APP_PLANS]); // Dependencias optimizadas
 
   useEffect(() => {
     console.debug("[DEBUG] useAuthService: useEffect - Setting up onAuthStateChange listener.");

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.debug(`[DEBUG] useAuthService: onAuthStateChange - Event received: ${event}`);
      handleAuthChange(event, session);
    });

    return () => {
      console.debug("[DEBUG] useAuthService: Cleanup - unsubscribing auth listener");
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [handleAuthChange]);

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
    console.debug("[DEBUG] useAuthService: register wrapper called");
    setLoading(true);
    try {
      const result = await auth.register(formData);
      return result;
    } catch (error) {
      console.error("[DEBUG] useAuthService: Registration error in wrapper:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    console.debug("[DEBUG] useAuthService: login wrapper called");
    setLoading(true);
    try {
      const result = await auth.login(credentials);
      return result;
    } catch (error) {
      console.error("[DEBUG] useAuthService: Login error in wrapper:", error);
      return { success: false, error: error.message || "Error inesperado en login wrapper." };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    console.debug("[DEBUG] useAuthService: logout wrapper called");
    setLoading(true);
    try {
      await auth.logout();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });
    } catch (error) {
      console.error("[DEBUG] useAuthService: Logout error in wrapper:", error);
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
    console.debug("[DEBUG] useAuthService: resetPassword wrapper called");
    setLoading(true);
    try {
      const result = await auth.resetPassword(email);
      toast({
        title: "Email enviado",
        description: "Revisa tu correo para restablecer tu contraseña.",
      });
      return result;
    } catch (error) {
      console.error("[DEBUG] useAuthService: Reset password error in wrapper:", error);
      toast({
        title: "Error al enviar email",
        description: error.message || "No se pudo enviar el email de recuperación.",
        variant: "destructive",
      });
      throw error;
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
    isProfileComplete: !!(user && user.id && user.company && user.phone),
    refreshUser: useCallback(async () => {
      console.debug("[DEBUG] useAuthService: refreshUser called.");
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      handleAuthChange("REFRESH", currentSession);
    }, [handleAuthChange]),
  };
}
