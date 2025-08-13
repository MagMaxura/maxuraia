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

const redirectUriCleaned = GOOGLE_REDIRECT_URI.replace(/\/$/, '');
console.log('Backend Google Redirect URI (cleaned):', redirectUriCleaned);
console.log('Backend Google Client ID:', GOOGLE_CLIENT_ID); // Nuevo log
console.log('Backend Google Client Secret:', GOOGLE_CLIENT_SECRET ? 'present' : 'missing'); // Nuevo log

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  redirectUriCleaned
);

export default async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { code, userId } = req.body;
      if (!code || !userId) {
        return send(res, 400, { error: 'Code and userId are required.' });
      }

      console.log('Auth Request Body:', { code: code ? 'present' : 'missing', userId });
      
      // Log de la URL de intercambio de tokens que se está construyendo
      console.log('Token exchange URL being built...');
      // Note: La biblioteca de Google construye la URL final internamente. Este log es para verificar los componentes clave.
      
      const { tokens } = await oauth2Client.getToken(code);
      console.log('Google Tokens received:', tokens);

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
      console.error('Error during token exchange (full error object):', error);
      send(res, 500, { error: 'Failed to exchange code for tokens.', details: error.message });
    }
  } else if (req.method === 'GET') {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes.join(' '),
      prompt: 'consent',
    });
    
    // Log de la URL de autorización que se genera para el frontend
    console.log('Authorization URL sent to frontend:', authorizationUrl);

    send(res, 302, null, { Location: authorizationUrl });
  } else {
    send(res, 405, { error: 'Method Not Allowed' });
  }
};