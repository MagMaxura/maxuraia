import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from './ui/use-toast';
import { useAuth } from '../contexts/AuthContext'; // Importar useAuth

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveRecruiterProfile } = useAuth(); // Obtener saveRecruiterProfile de useAuth
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
        // Attempt to save pending user profile
        const pendingProfileString = localStorage.getItem('pendingUserProfile');
        if (pendingProfileString) {
          setMessage("Guardando información del perfil...");
          try {
            const pendingProfile = JSON.parse(pendingProfileString);
            console.log("AuthCallback: Found pending profile, attempting to save:", pendingProfile);
            
            // Ensure the user from the new session matches the pending profile ID
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession && currentSession.user.id === pendingProfile.id) {
              await saveRecruiterProfile(pendingProfile); // Esta función está en useAuth
              localStorage.removeItem('pendingUserProfile');
              toast({
                title: "¡Cuenta activada y perfil guardado!",
                description: "Tu registro se ha completado exitosamente.",
                variant: "default", // o 'success'
              });
              navigate('/dashboard'); // O a donde quieras redirigir después del registro completo
            } else {
              console.error("AuthCallback: Session user ID does not match pending profile ID.");
              localStorage.removeItem('pendingUserProfile'); // Limpiar para evitar problemas
              throw new Error("Error de consistencia de datos durante el registro.");
            }
          } catch (profileError) {
            console.error('AuthCallback: Error saving pending profile:', profileError);
            toast({
              title: "Error al guardar perfil",
              description: profileError.message || "No se pudo guardar la información de tu perfil. Por favor, contacta a soporte.",
              variant: "destructive",
            });
            // Decide a dónde redirigir en caso de error al guardar perfil,
            // el usuario está autenticado pero su perfil no se guardó.
            // Podría ser a una página para reintentar o a /login.
            navigate('/login');
          }
        } else {
          // No pending profile, just a normal login or email verification without profile step
          toast({
            title: "¡Email verificado!",
            description: "Tu cuenta ha sido verificada correctamente.",
            variant: "default",
          });
          navigate('/dashboard'); // O a donde quieras redirigir después de un login/verificación normal
        }
      } catch (err) {
        console.error('Error in auth callback:', err);
        setError(err.message || "Ocurrió un error desconocido.");
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
