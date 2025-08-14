import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { send } from 'micro';

// Inicializar Supabase para el entorno de backend
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar la Service Role Key para el backend
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

export default async (req, res) => {
  if (req.method === 'GET') {
    const { code, error, state } = req.query; // 'state' puede contener el userId u otra información

    if (error) {
      console.error('Google OAuth error:', error);
      // Redirigir al frontend con un mensaje de error
      return send(res, 302, null, { Location: `/dashboard/calendario?googleAuth=error&message=${encodeURIComponent(error)}` });
    }

    if (code) {
      // Este es el callback de Google con el código de autorización
      try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log('Tokens received from Google:', tokens);

        const userId = state; // Asumiendo que el userId se pasa en el 'state'

        if (userId) {
          const upsertData = {
            user_id: userId,
            access_token: tokens.access_token,
            expiry_date: new Date(tokens.expiry_date).toISOString(),
            token_type: tokens.token_type,
            scope: tokens.scope,
          };

          if (tokens.refresh_token) {
            upsertData.refresh_token = tokens.refresh_token;
          }

          console.log('Attempting to upsert data to Supabase:', upsertData);
          const { data, error: supabaseError } = await supabase
            .from('user_google_tokens')
            .upsert(upsertData, { onConflict: 'user_id' });

          if (supabaseError) {
            console.error('Error storing tokens in Supabase:', supabaseError);
            return send(res, 302, null, { Location: `/dashboard/calendario?googleAuth=error&message=${encodeURIComponent(supabaseError.message)}` });
          }
          console.log('Tokens successfully stored in Supabase:', data);
        } else {
          console.warn('No userId found in state. Tokens not stored in Supabase.');
        }

        // Redirigir al frontend después de la autenticación exitosa
        return send(res, 302, null, { Location: '/dashboard/calendario?googleAuth=success' });

      } catch (tokenExchangeError) {
        console.error('Error during token exchange or Supabase storage:', tokenExchangeError);
        return send(res, 302, null, { Location: `/dashboard/calendario?googleAuth=error&message=${encodeURIComponent(tokenExchangeError.message)}` });
      }
    } else {
      // Si no hay código, es la solicitud inicial para iniciar el flujo de autenticación
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ];

      console.log('Generating Google authorization URL...');
      const authorizationUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes.join(' '),
        prompt: 'consent',
        state: state, // Asegurarse de que el estado se pase a Google
      });
      console.log('Generated authorizationUrl:', authorizationUrl);

      // Devolver la URL de autorización al frontend
      return send(res, 200, { authorizationUrl });
    }
  } else {
    // Métodos no permitidos
    send(res, 405, { error: 'Method Not Allowed' });
  }
};