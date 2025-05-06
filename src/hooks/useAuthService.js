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
        const recruiterData = await auth.getRecruiterByEmail(currentUser.email);
        if (recruiterData) {
          const fullUserData = { ...currentUser, ...recruiterData };
          auth.user = fullUserData;
          localStorage.setItem('auth_user', JSON.stringify(fullUserData));
          setUser(fullUserData);
          console.log("User loaded on auth change:", fullUserData);
          if (event === 'SIGNED_IN') {
             navigate("/dashboard", { replace: true });
          }
        } else {
          console.error("Recruiter data not found for authenticated user:", currentUser.email);
          setUser(null);
          toast({
            title: "Error de cuenta",
            description: "No se encontraron los datos asociados a tu cuenta. Por favor, contacta soporte o regístrate de nuevo.",
            variant: "destructive",
          });
          if (window.location.pathname !== '/login') {
             navigate("/login", { replace: true });
          }
        }
      } catch (error) {
        console.error("Error fetching recruiter data:", error);
        auth.clearAuthUser();
        setUser(null);
        toast({
          title: "Error",
          description: "Ocurrió un error al verificar tu sesión.",
          variant: "destructive",
        });
         if (window.location.pathname !== '/login') {
             navigate("/login", { replace: true });
          }
      } finally {
        setAuthChecked(true);
      }
    } else {
      console.log("No user session found or user logged out.");
      auth.clearAuthUser();
      setUser(null);
      setAuthChecked(true);
      if (event === 'SIGNED_OUT' && window.location.pathname !== '/login') {
         navigate("/login", { replace: true });
      }
    }
  }, [navigate, toast]);

  useEffect(() => {
    let mounted = true;
    console.log("useAuthService: Mount effect running");

    const checkInitialSession = async () => {
      if (!mounted) return;
      console.log("useAuthService: Checking initial session...");
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error) {
          console.error("useAuthService: Error getting initial session:", error);
          await handleAuthChange('INITIAL_SESSION_ERROR', null);
        } else {
          await handleAuthChange('INITIAL_SESSION_LOADED', session);
        }
      } catch (e) {
        if (!mounted) return;
        console.error("useAuthService: Critical error during initial session check:", e);
        auth.clearAuthUser();
        setUser(null);
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
      if (!mounted) return;
      console.log(`useAuthService: onAuthStateChange event: ${event}, session present: ${!!session}`);
      await handleAuthChange(event, session);
    });

    return () => {
      mounted = false;
      console.log("useAuthService: Cleanup - unsubscribing auth listener");
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [handleAuthChange, toast]);

  const register = useCallback(async (formData) => {
    console.log("useAuthService: register function called with data:", formData);
    setLoading(true);
    try {
      console.log("useAuthService: Calling auth.register");
      const success = await auth.register(formData);
      console.log("useAuthService: auth.register result:", success);
      
      if (success) {
        console.log("useAuthService: Registration successful");
        toast({
          title: "¡Registro casi listo!",
          description: "Hemos enviado un email de confirmación a tu correo.",
        });
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
         console.error("useAuthService: Registration failed without throwing error");
         throw new Error("El registro falló por una razón desconocida.");
      }
    } catch (error) {
      console.error("useAuthService: Registration error:", error);
      toast({
        title: "Error en el registro",
        description: error.message || "Hubo un problema al procesar tu registro.",
        variant: "destructive",
      });
      return false;
    } finally {
      console.log("useAuthService: Registration process completed");
      setLoading(false);
    }
  }, [navigate, toast]);

  const login = useCallback(async (credentials) => {
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
  }, [toast]);

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
