import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/use-toast";
import { auth } from "../lib/auth";
import { supabase } from "../lib/supabase";

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
    console.log("useAuthService: Mount effect for session check and listener setup.");

    const checkInitialSession = async () => {
      console.log("useAuthService: Checking initial session...");
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("useAuthService: Error getting initial session:", error);
          await handleAuthChange('INITIAL_SESSION_ERROR', null);
        } else {
          await handleAuthChange('INITIAL_SESSION_LOADED', session);
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

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`useAuthService: onAuthStateChange event: ${event}, session present: ${!!session}`);
      await handleAuthChange(event, session);
    });

    return () => {
      console.log("useAuthService: Unsubscribing from auth listener (mount effect cleanup).");
      if (authListener && authListener.subscription && typeof authListener.subscription.unsubscribe === 'function') {
        authListener.subscription.unsubscribe();
      } else {
        console.warn("useAuthService: Could not unsubscribe from auth listener on cleanup.");
      }
    };
  }, [handleAuthChange]); // Added handleAuthChange to dependencies since it's used in the effect

  const register = async (formData) => {
    console.log("useAuthService.js: register function called with data:", formData);
    setLoading(true);
    try {
      console.log("useAuthService.js: Calling auth.register");
      const success = await auth.register(formData);
      console.log("useAuthService.js: auth.register result:", success);
      
      if (success) {
        console.log("useAuthService.js: Registration successful, showing toast");
        toast({
          title: "¡Registro casi listo!",
          description: "Hemos enviado un email de confirmación a tu correo.",
        });
        console.log("useAuthService.js: Navigating to confirmation page");
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
         console.error("useAuthService.js: Registration failed without throwing error");
         throw new Error("El registro falló por una razón desconocida.");
      }
    } catch (error) {
      console.error("useAuthService.js: Registration error:", error);
      toast({
        title: "Error en el registro",
        description: error.message || "Hubo un problema al procesar tu registro.",
        variant: "destructive",
      });
      return false;
    } finally {
      console.log("useAuthService.js: Registration process completed");
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      const success = await auth.login(credentials);
      if (success) {
         toast({
           title: "¡Bienvenido!",
           description: "Has iniciado sesión correctamente.",
         });
         return true;
      } else {
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
      auth.clearAuthUser();
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
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
       setLoading(false);
    }
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

  return {
    user,
    loading: loading || !authChecked,
    authChecked,
    login,
    logout,
    register,
    resetPassword,
    isAuthenticated: !!user,
  };
}
