import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from './ui/use-toast';
import { useAuth } from '../contexts/AuthContext'; // Importar useAuth
import { Button } from './ui/button'; // Importar Button

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  // Obtener las funciones necesarias de useAuth
  // Necesitamos saveRecruiterProfile (que hace INSERT) y getRecruiterProfile
  const { saveRecruiterProfile, getRecruiterProfile } = useAuth();
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("Procesando autenticación...");


  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the auth code from the URL
        const code = searchParams.get('code');
        
        if (!code) {
          setError('No code found in URL');
          return;
        }

        // Exchange the code for a session
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

        if (sessionError) {
          console.error('Error exchanging code for session:', sessionError);
          setError(sessionError.message);
          toast({
            title: "Error de autenticación",
            description: "No se pudo completar el proceso de autenticación.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        // Check if this is a password reset flow
        const type = searchParams.get('type');
        if (type === 'recovery') {
          navigate('/reset-password');
          toast({
            title: "Restablece tu contraseña",
            description: "Por favor ingresa tu nueva contraseña.",
          });
          return;
        }

        // For email verification flow (not a password recovery)
        
        // 1. Obtener la sesión actual para asegurarnos de que el usuario está autenticado
        const { data: { session: currentSession }, error: getSessionError } = await supabase.auth.getSession();

        if (getSessionError || !currentSession) {
          console.error('AuthCallback: Error getting session after code exchange or no session found.', getSessionError);
          setError("No se pudo obtener la sesión de usuario después de la verificación.");
          navigate('/login');
          return;
        }

        const userId = currentSession.user.id;
        console.log("AuthCallback: Session established for user ID:", userId);
        setMessage("Verificando perfil...");

        // 2. Verificar si el usuario ya tiene un perfil en 'reclutadores'
        try {
          console.log("AuthCallback: Checking for existing profile for user ID:", userId);
          const existingProfile = await getRecruiterProfile(userId);

          if (existingProfile) {
            // El usuario ya tiene perfil, redirigir al dashboard
            console.log("AuthCallback: User already has a profile. Redirecting to dashboard.");
            toast({
              title: "¡Bienvenido de nuevo!",
              description: "Tu cuenta ya está configurada.",
              variant: "default",
            });
            navigate('/dashboard');
          } else {
            // El usuario NO tiene perfil. Intentar crear uno básico.
            console.log("AuthCallback: User does not have a profile. Attempting to create basic profile...");
            setMessage("Creando perfil inicial...");
            try {
              const basicProfileData = {
                id: userId,
                email: currentSession.user.email, // Tomar email de la sesión
                // Otros campos se insertarán como NULL o sus defaults de DB
              };
              await saveRecruiterProfile(basicProfileData); // saveRecruiterProfile hace INSERT
              
              console.log("AuthCallback: Basic profile created successfully. Redirecting to complete profile.");
              toast({
                title: "¡Email verificado!",
                description: "Ahora completa tu perfil para continuar.",
                variant: "default",
              });
              navigate('/complete-profile');

            } catch (insertError) {
               console.error('AuthCallback: Error creating basic profile:', insertError);
               // Si falla la inserción (ej: RLS de INSERT incorrecta), mostrar error y redirigir a login
               setError("Error al inicializar tu perfil. Por favor, contacta a soporte.");
               toast({
                 title: "Error de Configuración",
                 description: "No se pudo crear tu perfil inicial.",
                 variant: "destructive",
               });
               // Considerar desloguear al usuario aquí si la creación del perfil es obligatoria
               // await supabase.auth.signOut();
               navigate('/login');
            }
          }
        } catch (profileCheckError) {
          // Error al intentar verificar si el perfil existe (ej: RLS de SELECT incorrecta)
          console.error('AuthCallback: Error checking for existing profile:', profileCheckError);
          setError("Error al verificar tu perfil. Por favor, intenta iniciar sesión.");
           toast({
             title: "Error de Verificación",
             description: "No se pudo verificar tu perfil existente.",
             variant: "destructive",
           });
          navigate('/login');
        }
        
      } catch (err) {
        console.error('AuthCallback: Error during callback processing:', err);
        setError(err.message || "Ocurrió un error desconocido durante la autenticación.");
        toast({
          title: "Error",
          description: "Ocurrió un error durante el proceso de autenticación.",
          variant: "destructive",
        });
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate, searchParams, toast, saveRecruiterProfile]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white shadow-lg rounded-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error de Autenticación</h1>
          <p className="mt-2 text-gray-700">{error}</p>
          <Button onClick={() => navigate('/login')} className="mt-6">
            Ir a Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-gray-700">{message}</h1>
        {/* Puedes agregar un spinner aquí */}
        <p className="mt-2 text-gray-600">Por favor espera un momento.</p>
      </div>
    </div>
  );
}
