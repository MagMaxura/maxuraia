import { google } from 'googleapis';
import { supabase } from '../../src/lib/supabase'; // Asumiendo que supabase está configurado aquí
import { send } from 'micro';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

export default async (req, res) => {
  if (req.method === 'POST') {
    // Manejar el intercambio de código por tokens
    try {
      const { code, userId } = req.body;

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

      // Devolver solo el access_token al frontend
      send(res, 200, { access_token: tokens.access_token, expiry_date: tokens.expiry_date });

    } catch (error) {
      console.error('Error during token exchange:', error);
      send(res, 500, { error: 'Failed to exchange code for tokens.', details: error.message });
    }
  } else if (req.method === 'GET') {
    // Manejar el refresco de tokens o la obtención de eventos
    // Esto es un placeholder, la lógica real de eventos se manejará en otro endpoint
    // o se expandirá aquí. Por ahora, solo se enfoca en la autenticación.
    send(res, 405, { error: 'Method Not Allowed' });
  } else {
    send(res, 405, { error: 'Method Not Allowed' });
  }
};