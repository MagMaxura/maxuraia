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
      return send(res, 302, null, { Location: `/dashboard/calendar?googleAuth=error&message=${encodeURIComponent(error)}` });
    }

    if (code) {
      // Este es el callback de Google con el código de autorización
      try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log('Tokens received from Google:', tokens);

        // Aquí, 'state' debería contener el userId para asociar los tokens
        // Si 'state' no se usó, necesitaríamos otra forma de obtener el userId,
        // o el frontend tendría que iniciar este flujo con el userId ya conocido.
        // Por ahora, asumiré que el userId se pasa en el 'state' o se obtiene de alguna otra manera.
        // Para simplificar, si el userId no está en el state, no lo guardaremos en Supabase por ahora.
        // En un escenario real, el 'state' debería ser un JWT o un ID de sesión para seguridad y para pasar el userId.

        // Asumiendo que el userId se puede obtener del 'state' o de alguna otra forma segura.
        // Por ahora, lo dejaré como un placeholder.
        const userId = state; // Esto es un placeholder, debería ser un valor real y seguro.

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
            return send(res, 302, null, { Location: `/dashboard/calendar?googleAuth=error&message=${encodeURIComponent(supabaseError.message)}` });
          }
          console.log('Tokens successfully stored in Supabase:', data);
        } else {
          console.warn('No userId found in state. Tokens not stored in Supabase.');
        }

        // Redirigir al frontend después de la autenticación exitosa
        return send(res, 302, null, { Location: '/dashboard/calendar?googleAuth=success' });

      } catch (tokenExchangeError) {
        console.error('Error during token exchange or Supabase storage:', tokenExchangeError);
        return send(res, 302, null, { Location: `/dashboard/calendar?googleAuth=error&message=${encodeURIComponent(tokenExchangeError.message)}` });
      }
    } else {
      // Si no hay código, es la solicitud inicial para iniciar el flujo de autenticación
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ];

      // El 'state' puede usarse para pasar información como el userId de forma segura
      // Por ejemplo: const state = JSON.stringify({ userId: 'current_user_id' });
      // Asegúrate de que el frontend pase este 'state' al iniciar la autenticación.
      console.log('Generating Google authorization URL...');
      const authorizationUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes.join(' '),
        prompt: 'consent',
        state: state, // Asegurarse de que el estado se pase a Google
      });
      console.log('Generated authorizationUrl:', authorizationUrl);
  
      // Redirigir al usuario a la URL de autorización de Google
      return send(res, 302, null, { Location: authorizationUrl });
    }
  } else {
    // Métodos no permitidos
    send(res, 405, { error: 'Method Not Allowed' });
  }
};