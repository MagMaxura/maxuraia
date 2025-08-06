import { supabase } from './supabase'; // Asumiendo que supabase está configurado aquí

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'; // Ajusta esto si tu API tiene una URL base diferente

export const exchangeCodeForTokens = async (code, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/google-calendar/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to exchange code for tokens');
    }

    const data = await response.json();
    return data.access_token; // Devolvemos solo el access_token al frontend
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
};

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

export const refreshGoogleAccessToken = async (userId) => {
  try {
    // En un escenario real, este endpoint de backend usaría el refresh_token
    // almacenado en Supabase para obtener un nuevo access_token de Google.
    // Por simplicidad, aquí se asume que el backend maneja la lógica de refresco
    // y devuelve un nuevo access_token si es necesario.
    const { data, error } = await supabase
      .from('user_google_tokens')
      .select('access_token, expiry_date')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new Error('No tokens found for user or error fetching tokens.');
    }

    // Aquí deberías tener una lógica en el backend para usar el refresh_token
    // y obtener un nuevo access_token si el actual ha expirado.
    // Por ahora, solo devolvemos el access_token existente.
    // En un entorno de producción, el backend debería hacer la llamada a Google.
    if (new Date(data.expiry_date) < new Date()) {
        // Lógica para refrescar el token en el backend
        // Por ejemplo, llamar a otro endpoint de tu API que maneje el refresco
        // const refreshResponse = await fetch(`${API_BASE_URL}/google-calendar/refresh-token`, { method: 'POST', body: JSON.stringify({ userId }) });
        // const refreshedData = await refreshResponse.json();
        // return refreshedData.access_token;
        console.warn("Access token expired, but refresh logic is not fully implemented on backend for this frontend call.");
        throw new Error("Access token expired, please re-authenticate.");
    }

    return data.access_token;

  } catch (error) {
    console.error('Error refreshing Google access token:', error);
    throw error;
  }
};