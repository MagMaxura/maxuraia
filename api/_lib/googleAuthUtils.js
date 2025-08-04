import { google } from 'googleapis';
import { supabase } from '../../src/lib/supabase'; // Asegúrate de que esta ruta sea correcta para el entorno de Vercel

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

export async function getAndRefreshGoogleAccessToken(userId) {
  if (!userId) {
    throw new Error('User ID is required to get Google access token.');
  }

  // 1. Obtener tokens del usuario desde Supabase
  const { data, error } = await supabase
    .from('user_google_tokens')
    .select('access_token, refresh_token, expiry_date')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('No Google tokens found for this user.');
  }

  let { access_token, refresh_token, expiry_date } = data;

  // 2. Verificar si el access_token ha expirado
  if (new Date(expiry_date) < new Date()) {
    // 3. Si ha expirado, usar el refresh_token para obtener uno nuevo
    if (!refresh_token) {
      throw new Error('Refresh token not found. User needs to re-authenticate with Google.');
    }

    oauth2Client.setCredentials({ refresh_token });

    try {
      const { tokens } = await oauth2Client.refreshAccessToken();
      access_token = tokens.access_token;
      expiry_date = tokens.expiry_date; // Actualizar la fecha de expiración

      // 4. Actualizar el nuevo access_token y expiry_date en Supabase
      const { error: updateError } = await supabase
        .from('user_google_tokens')
        .update({
          access_token: access_token,
          expiry_date: expiry_date,
          // No actualizamos refresh_token aquí, ya que Google solo lo devuelve la primera vez
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating Google tokens in Supabase:', updateError);
        // No lanzamos un error fatal aquí, ya que el access_token es válido
      }

    } catch (refreshError) {
      console.error('Error refreshing Google access token:', refreshError);
      throw new Error('Failed to refresh Google access token. User may need to re-authenticate.');
    }
  }

  return access_token;
}