import { supabase } from './supabase'; // Asumiendo que supabase está configurado aquí

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Inicia el flujo de autenticación de Google Calendar.
 * Redirige al usuario a la Vercel Function que a su vez redirige a Google.
 * @param {string} userId - El ID del usuario actual para pasarlo en el estado de OAuth.
 */
export const initiateGoogleAuth = (userId) => {
  // Codificar el userId en el parámetro 'state' para seguridad y para recuperarlo en el callback
  const state = encodeURIComponent(userId);
  window.location.href = `${API_BASE_URL}/google-calendar/auth?state=${state}`;
};

/**
 * Obtiene los eventos del calendario de Google para el usuario autenticado.
 * @param {string} accessToken - El token de acceso de Google.
 * @returns {Promise<Array>} Una promesa que resuelve con una lista de eventos formateados.
 */
export const getCalendarEvents = async (accessToken) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
      let errorDetails = 'Failed to fetch calendar events';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error?.message || JSON.stringify(errorData);
      } catch (parseError) {
        const responseText = await response.text();
        errorDetails = `Failed to parse error response: ${parseError.message}. Response text: ${responseText}`;
      }
      throw new Error(errorDetails);
    }

    const data = await response.json();
    console.log('Raw Google Calendar API response data:', data);

    // Formatear eventos para react-big-calendar
    const formattedEvents = data.items.map(event => ({
      title: event.summary,
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date),
      allDay: !event.start.dateTime,
      resource: event, // Guarda el objeto original del evento si es necesario
    }));
    return formattedEvents;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
};

/**
 * Obtiene el token de acceso de Google del usuario desde Supabase.
 * Esto es para que el frontend pueda usar el token para llamadas directas a la API de Google.
 * En un escenario real, el refresco de tokens debería ser manejado por el backend.
 * @param {string} userId - El ID del usuario.
 * @returns {Promise<string|null>} El token de acceso o null si no se encuentra.
 */
export const getGoogleAccessTokenFromSupabase = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_google_tokens')
      .select('access_token, expiry_date')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.warn('No Google tokens found for user:', userId, error);
      return null;
    }

    // Opcional: Aquí podrías añadir una lógica para llamar a un endpoint de backend
    // que refresque el token si está expirado, antes de devolverlo.
    // Por ahora, solo devolvemos el token existente.
    if (new Date(data.expiry_date) < new Date()) {
      console.warn("Access token expired. Frontend should prompt re-authentication or backend should handle refresh.");
      // Podrías lanzar un error o devolver null para indicar que se necesita re-autenticar
      return null;
    }

    return data.access_token;
  } catch (error) {
    console.error('Error getting Google access token from Supabase:', error);
    return null;
  }
};