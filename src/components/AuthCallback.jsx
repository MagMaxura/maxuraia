import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from './ui/use-toast';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState(null);

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

        // For email verification flow
        toast({
          title: "¡Email verificado!",
          description: "Tu cuenta ha sido verificada correctamente.",
        });
        navigate('/login');
      } catch (err) {
        console.error('Error in auth callback:', err);
        setError(err.message);
        toast({
          title: "Error",
          description: "Ocurrió un error durante el proceso de autenticación.",
          variant: "destructive",
        });
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate, searchParams, toast]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error de autenticación</h1>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Procesando autenticación...</h1>
        <p className="mt-2 text-gray-600">Por favor espera un momento.</p>
      </div>
    </div>
  );
}
