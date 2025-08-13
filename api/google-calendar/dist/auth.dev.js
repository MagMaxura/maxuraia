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

// --- INICIO DE LA MODIFICACIÓN ---
// Imprimimos la URI para depuración antes de usarla
console.log(`[BACKEND-DEBUG] URI de redirección usada por el backend: "${GOOGLE_REDIRECT_URI}"`);

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI // Asegúrate que la variable se usa aquí
);
// --- FIN DE LA MODIFICACIÓN ---

export default async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { code, userId } = req.body;

      if (!code || !userId) {
        return send(res, 400, { error: 'Code and userId are required.' });
      }

      const { tokens } = await oauth2Client.getToken(code);

      const upsertData = {
        user_id: userId,
        access_token: tokens.access_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type,
        scope: tokens.scope,
      };

      if (tokens.refresh_token) {
        upsertData.refresh_token = tokens.refresh_token;
      }

      const { data, error } = await supabase
        .from('user_google_tokens')
        .upsert(upsertData, { onConflict: 'user_id' });

      if (error) {
        console.error('Error storing tokens:', error);
        return send(res, 500, { error: 'Failed to store tokens.' });
      }

      send(res, 200, { access_token: tokens.access_token, expiry_date: tokens.expiry_date, userId: userId });

    } catch (error) {
      console.error('Error during token exchange:', error);
      send(res, 500, { error: 'Failed to exchange code for tokens.', details: error.message });
    }
  } else if (req.method === 'GET') {
    // Este bloque GET no se modifica
    const scopes = [
      'openid',
      'profile',
      'email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];
    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes.join(' '),
      prompt: 'consent',
    });
    send(res, 302, null, { Location: authorizationUrl });
  } else {
    send(res, 405, { error: 'Method Not Allowed' });
  }
};