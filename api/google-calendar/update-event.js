import { google } from 'googleapis';
import { send } from 'micro';
import { getAndRefreshGoogleAccessToken } from '../_lib/googleAuthUtils.js';

export default async (req, res) => {
  if (req.method === 'PUT') { // Usar PUT para actualizaciones
    try {
      const { userId, eventId, updatedEventData } = req.body;

      if (!userId || !eventId || !updatedEventData) {
        return send(res, 400, { error: 'User ID, event ID, and updated event data are required.' });
      }

      const accessToken = await getAndRefreshGoogleAccessToken(userId);

      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const event = {
        summary: updatedEventData.title,
        description: updatedEventData.description,
        start: {
          dateTime: updatedEventData.start,
          timeZone: updatedEventData.timeZone || 'America/Buenos_Aires',
        },
        end: {
          dateTime: updatedEventData.end,
          timeZone: updatedEventData.timeZone || 'America/Buenos_Aires',
        },
        // Asegúrate de incluir otras propiedades que quieras actualizar
      };

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event,
      });

      send(res, 200, { event: response.data });

    } catch (error) {
      console.error('Error updating calendar event:', error);
      send(res, 500, { error: 'Failed to update calendar event.', details: error.message });
    }
  } else {
    send(res, 405, { error: 'Method Not Allowed' });
  }
};