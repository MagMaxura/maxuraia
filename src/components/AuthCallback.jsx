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
        console.log("AuthCallback: [LOG] Attempting to get current session...");
        const { data: { session: currentSession }, error: getSessionError } = await supabase.auth.getSession();

        if (getSessionError || !currentSession) {
          console.error('AuthCallback: [LOG] Error getting session or no session found.', getSessionError);
          setError("No se pudo obtener la sesión de usuario después de la verificación.");
          navigate('/login');
          return;
        // La sesión ha sido establecida por exchangeCodeForSession.
        // El usuario está ahora autenticado.
        console.log("AuthCallback: [LOG] Session established via code exchange.");
        
        toast({
          title: "¡Email verificado!",
          description: "Tu cuenta ha sido activada. Por favor, inicia sesión.",
          variant: "default",
        });
        // Redirigir a login. La página de login ahora se encargará de
        // verificar el perfil y redirigir a /complete-profile o /dashboard.
        navigate('/login');
        
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
