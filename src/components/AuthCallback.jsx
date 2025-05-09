import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button'; // Asegurarse que Button esté importado si se usa en el JSX de error

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("Procesando autenticación...");

  useEffect(() => {
    const handleCallback = async () => {
      console.log("AuthCallback: [LOG] handleCallback started.");
      try {
        const code = searchParams.get('code');
        const type = searchParams.get('type'); // Para flujo de recuperación de contraseña

        if (type === 'recovery') {
          console.log("AuthCallback: [LOG] Password recovery flow detected.");
          toast({
            title: "Restablece tu contraseña",
            description: "Por favor ingresa tu nueva contraseña.",
          });
          navigate('/reset-password'); // Asumiendo que tienes esta ruta
          return;
        }
        
        if (!code) {
          console.error('AuthCallback: [LOG] No code found in URL.');
          setError('Código de autenticación no encontrado en la URL.');
          return;
        }

        console.log("AuthCallback: [LOG] Attempting to exchange code for session...");
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

        if (sessionError) {
          console.error('AuthCallback: [LOG] Error exchanging code for session:', sessionError);
          setError(sessionError.message || "No se pudo completar el proceso de autenticación.");
          toast({
            title: "Error de autenticación",
            description: sessionError.message || "No se pudo completar el proceso de autenticación.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        // Si llegamos aquí, exchangeCodeForSession fue exitoso y la sesión está establecida.
        // onAuthStateChange en useAuthService se encargará de actualizar el estado global del usuario.
        console.log("AuthCallback: [LOG] Session established successfully via code exchange.");
        
        toast({
          title: "¡Email verificado!",
          description: "Tu cuenta ha sido activada. Por favor, inicia sesión para continuar.",
          variant: "default",
          duration: 5000,
        });
        
        // Redirigir a login. La página de login se encargará de
        // verificar el perfil (y crearlo si es necesario) y luego redirigir.
        navigate('/login');

      } catch (err) {
        // Este catch manejará cualquier error inesperado dentro del bloque try.
        console.error('AuthCallback: [LOG] Unexpected error during callback processing:', err);
        setError(err.message || "Ocurrió un error desconocido durante la autenticación.");
        toast({
          title: "Error Inesperado",
          description: "Ocurrió un error inesperado durante el proceso de autenticación.",
          variant: "destructive",
        });
        navigate('/login');
      }
    };

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, searchParams, toast]); // Dependencias del useEffect

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
        <p className="mt-2 text-gray-600">Por favor espera un momento.</p>
      </div>
    </div>
  );
}
