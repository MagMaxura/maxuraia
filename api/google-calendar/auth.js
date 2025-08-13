import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { send } from 'micro';

// Inicializar Supabase para el entorno de backend
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

// Quitar la barra al final de la URI si existe
const redirectUriCleaned = GOOGLE_REDIRECT_URI.replace(/\/$/, '');
console.log('Backend Google Redirect URI (cleaned):', redirectUriCleaned);

// CORRECCIÓN: Se eliminó encodeURIComponent
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  redirectUriCleaned
);

export default async (req, res) => {
  if (req.method === 'POST') {
    // Manejar el intercambio de código por tokens
    try {
      const { code, userId } = req.body;

      console.log('Auth Request Body:', { code: code ? 'present' : 'missing', userId });
      console.log('Received code:', code);
      console.log('Google Client ID:', GOOGLE_CLIENT_ID ? 'present' : 'missing');
      console.log('Google Client Secret:', GOOGLE_CLIENT_SECRET ? 'present' : 'missing');
      console.log('Google Redirect URI:', GOOGLE_REDIRECT_URI ? 'present' : 'missing');

      if (!code || !userId) {
        return send(res, 400, { error: 'Code and userId are required.' });
      }

      // Este es el paso clave donde ocurre el intercambio de token
      const { tokens } = await oauth2Client.getToken(code);
      console.log('Google Tokens received:', tokens);

      // Preparar datos para upsert, incluyendo refresh_token solo si está presente
      const upsertData = {
        user_id: userId,
        access_token: tokens.access_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type,
        scope: tokens.scope,
      };

      // Solo añadir refresh_token si existe (se devuelve solo en la primera autorización)
      if (tokens.refresh_token) {
        upsertData.refresh_token = tokens.refresh_token;
      }

      // Almacenar tokens de refresco de forma segura en Supabase
      const { data, error } = await supabase
        .from('user_google_tokens')
        .upsert(upsertData, { onConflict: 'user_id' });

      if (error) {
        console.error('Error storing tokens:', error);
        return send(res, 500, { error: 'Failed to store tokens.' });
      }

      // Devolver el access_token y el userId al frontend
      send(res, 200, { access_token: tokens.access_token, expiry_date: tokens.expiry_date, userId: userId });

    } catch (error) {
      console.error('Error during token exchange (full error object):', error);
      send(res, 500, { error: 'Failed to exchange code for tokens.', details: error.message });
    }
  } else if (req.method === 'GET') {
    // Iniciar el flujo de autenticación de Google
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
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