
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export function useAuthService() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start true for initial check
  const [authChecked, setAuthChecked] = useState(false); // Track if initial check completed
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAuthChange = useCallback(async (event, session) => {
    console.log("Auth state changed:", event, session);
    setLoading(true); // Set loading during processing
    const currentUser = session?.user;

    if (currentUser) {
      try {
        // Attempt to load recruiter data associated with the auth user
        const recruiterData = await auth.getRecruiterByEmail(currentUser.email);
        if (recruiterData) {
          const fullUserData = { ...currentUser, ...recruiterData };
          auth.user = fullUserData; // Update auth lib user cache
          localStorage.setItem('auth_user', JSON.stringify(fullUserData));
          setUser(fullUserData);
          console.log("User loaded on auth change:", fullUserData);
          // If the event is SIGNED_IN and we are not already on dashboard, navigate
          // Avoid navigation on INITIAL_SESSION if already on a protected route
          if (event === 'SIGNED_IN') {
             navigate("/dashboard", { replace: true });
          }
        } else {
          console.error("Recruiter data not found for authenticated user:", currentUser.email);
          // User exists in Supabase Auth but not in 'reclutadores'. Log them out.
          // await auth.logout(); // TEMPORARILY COMMENTED OUT TO BREAK POTENTIAL LOOP
          setUser(null); // Explicitly set user null here too
          toast({
            title: "Error de cuenta",
            description: "No se encontraron los datos asociados a tu cuenta. Por favor, contacta soporte o regístrate de nuevo.",
            variant: "destructive",
          });
          // Navigate to login only if not already there (logout might trigger this)
          if (window.location.pathname !== '/login') {
             navigate("/login", { replace: true }); // Navigate to Login page
          }
        }
      } catch (error) {
        console.error("Error fetching recruiter data or logging out on auth change:", error);
        auth.clearAuthUser();
        setUser(null);
        toast({
          title: "Error",
          description: "Ocurrió un error al verificar tu sesión.",
          variant: "destructive",
        });
         if (window.location.pathname !== '/login') {
             navigate("/login", { replace: true }); // Navigate to Login page on error
          }
      } finally {
        // Only set loading false and authChecked true *after* processing
        setLoading(false);
        setAuthChecked(true);
      }
    } else { // No session or SIGNED_OUT event
      console.log("No user session found or user logged out.");
      auth.clearAuthUser();
      setUser(null);
      setLoading(false);
      setAuthChecked(true);
      // If user was explicitly logged out, navigate to login
      if (event === 'SIGNED_OUT' && window.location.pathname !== '/login') {
         navigate("/login", { replace: true }); // Navigate to Login page
      }
    }
  }, [navigate, toast]);

  // Effect for initial session check and auth state listener
  useEffect(() => {
    console.log("useAuthService: Simplified auth effect running (should be once on mount).");
    // setLoading(true); // Temporarily disable direct state sets here to isolate loop
    // setAuthChecked(false);

    // TEMPORARILY COMMENT OUT INITIAL SESSION CHECK TO ISOLATE LOOP
    /*
    const checkInitialSession = async () => {
      console.log("useAuthService: Checking initial session...");
      setLoading(true); // Set loading true when check starts
      setAuthChecked(false);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("useAuthService: Error getting initial session:", error);
          await handleAuthChange('INITIAL_SESSION', null);
        } else {
          await handleAuthChange('INITIAL_SESSION', session);
        }
      } catch (e) {
        console.error("useAuthService: Critical error during initial session check:", e);
        auth.clearAuthUser();
        setUser(null);
        setLoading(false);
        setAuthChecked(true);
        toast({
          title: "Error Crítico de Sesión",
          description: "No se pudo verificar el estado de autenticación inicial.",
          variant: "destructive",
        });
      }
    };
    checkInitialSession();
    */

    // We still need to set initial state if not checking session immediately
    // This will be handled by handleAuthChange if it's called by listener with no session
    // For now, let's assume initial state is no user, not loading after a brief moment
    // This is a debug step, not final logic
    const initialLoadTimeout = setTimeout(() => {
        if (loading) setLoading(false); // If still loading after a bit, set to false
        if (!authChecked) setAuthChecked(true); // If not checked, mark as checked
    }, 500);


    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`useAuthService: onAuthStateChange event: ${event}, session:`, session);
      await handleAuthChange(event, session); // handleAuthChange will manage setLoading/setAuthChecked
    });

    return () => {
      clearTimeout(initialLoadTimeout);
      if (authListener && typeof authListener.subscription?.unsubscribe === 'function') {
        console.log("useAuthService: Unsubscribing from auth listener (simplified effect).");
        authListener.subscription.unsubscribe();
      } else {
        console.warn("useAuthService: Could not unsubscribe from auth listener (simplified effect).");
      }
    };
  }, []); // RUNS ONCE ON MOUNT AND UNMOUNT

  const register = async (formData) => {
console.log("useAuthService.js: register - Función llamada con datos:", formData); // DEBUG LOG
    setLoading(true);
    try {
      const success = await auth.register(formData);
      if (success) {
        toast({
          title: "¡Registro casi listo!",
          description: "Hemos enviado un email de confirmación a tu correo.",
        });
        // Navigate to confirmation page, passing user details if needed
        navigate('/register-confirmation', {
          state: {
            userData: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              company: formData.company
            }
          }
        });
        return true;
      } else {
         // If auth.register returns false without throwing, handle it
         throw new Error("El registro falló por una razón desconocida.");
      }
    } catch (error) {
      toast({
        title: "Error en el registro",
        description: error.message || "Hubo un problema al procesar tu registro.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      const success = await auth.login(credentials);
      if (success) {
         // The onAuthStateChange listener will handle user state update and navigation
         toast({
           title: "¡Bienvenido!",
           description: "Has iniciado sesión correctamente.",
         });
         // No need to navigate here, listener does it.
         return true;
      } else {
         // Should not happen if auth.login throws errors correctly
         throw new Error("Inicio de sesión fallido.");
      }
    } catch (error) {
      let description = "Ocurrió un error inesperado.";
      if (error.message === 'Email no registrado') {
        description = 'El email proporcionado no se encuentra registrado.';
      } else if (error.message === 'Credenciales inválidas') {
        description = 'El email o la contraseña son incorrectos.';
      } else {
         console.error("Login error caught in service:", error);
      }
      
      toast({
        title: "Error de autenticación",
        description: description,
        variant: "destructive",
      });
      auth.clearAuthUser(); // Ensure user state is cleared on failed login
      setUser(null); // Update local state immediately too
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true); // Set loading true before calling auth.logout
    try {
      await auth.logout();
      // The onAuthStateChange listener (event SIGNED_OUT) will handle state update and navigation
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });
      // No need to navigate here, listener does it.
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión. Inténtalo de nuevo.",
        variant: "destructive",
      });
       console.error("Logout error:", error);
       setLoading(false); // Ensure loading is false if logout itself fails
    }
    // setLoading(false) will be handled by the auth state change listener
  };

  const resetPassword = async (email) => {
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
  };

  // Return the state and methods
  return {
    user,
    // Loading is true if the internal loading flag is true OR the initial check hasn't finished
    loading: loading || !authChecked,
    authChecked, // Expose this if needed elsewhere
    login,
    logout,
    register,
    resetPassword,
    isAuthenticated: !!user, // Derived state
  };
}
