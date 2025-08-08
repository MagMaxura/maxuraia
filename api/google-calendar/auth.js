import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js'; // Importar createClient
import { send } from 'micro';

// Inicializar Supabase para el entorno de backend
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // O SUPABASE_SERVICE_ROLE_KEY si necesitas privilegios elevados
const supabase = createClient(supabaseUrl, supabaseKey);

const { VITE_GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, VITE_GOOGLE_REDIRECT_URI } = process.env;

console.log('DEBUG - VITE_GOOGLE_CLIENT_ID:', VITE_GOOGLE_CLIENT_ID);
console.log('DEBUG - GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? 'present' : 'missing'); // No loguear el secreto directamente
console.log('DEBUG - VITE_GOOGLE_REDIRECT_URI:', VITE_GOOGLE_REDIRECT_URI);

const oauth2Client = new google.auth.OAuth2(
  VITE_GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  VITE_GOOGLE_REDIRECT_URI
);

export default async (req, res) => {
  if (req.method === 'POST') {
    // Manejar el intercambio de código por tokens
    try {
      const { code, userId } = req.body;

      console.log('Auth Request Body:', { code: code ? 'present' : 'missing', userId });
      console.log('Google Client ID:', VITE_GOOGLE_CLIENT_ID ? 'present' : 'missing');
      console.log('Google Client Secret:', GOOGLE_CLIENT_SECRET ? 'present' : 'missing');
      console.log('Google Redirect URI:', VITE_GOOGLE_REDIRECT_URI ? 'present' : 'missing');


      if (!code || !userId) {
        return send(res, 400, { error: 'Code and userId are required.' });
      }

      const { tokens } = await oauth2Client.getToken(code);

      // Almacenar tokens de refresco de forma segura en Supabase
      const { data, error } = await supabase
        .from('user_google_tokens') // Tabla para almacenar tokens de Google por usuario
        .upsert({
          user_id: userId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token, // Solo se devuelve la primera vez
          expiry_date: tokens.expiry_date,
          token_type: tokens.token_type,
          scope: tokens.scope,
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error storing tokens:', error);
        return send(res, 500, { error: 'Failed to store tokens.' });
      }

      // Devolver el access_token y el userId al frontend
      send(res, 200, { access_token: tokens.access_token, expiry_date: tokens.expiry_date, userId: userId });

    } catch (error) {
      console.error('Error during token exchange:', error);
      send(res, 500, { error: 'Failed to exchange code for tokens.', details: error.message });
    }
  } else if (req.method === 'GET') {
    // Iniciar el flujo de autenticación de Google
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/drive.file', // O 'https://www.googleapis.com/auth/drive' para acceso completo
      'https://www.googleapis.com/auth/userinfo.email', // Para obtener el email del usuario
      'https://www.googleapis.com/auth/userinfo.profile' // Para obtener el perfil del usuario
    ];

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Esto asegura que obtengamos un refresh_token
      scope: scopes.join(' '),
      prompt: 'consent', // Solicita el consentimiento cada vez para asegurar el refresh_token
    });

    send(res, 302, null, { Location: authorizationUrl }); // Redirigir al usuario a la URL de autorización
  } else {
    send(res, 405, { error: 'Method Not Allowed' });
  }
};