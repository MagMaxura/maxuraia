import { google } from 'googleapis';
import { send } from 'micro';
import { getAndRefreshGoogleAccessToken } from '../_lib/googleAuthUtils.js';

export default async (req, res) => {
  if (req.method === 'DELETE') { // Usar DELETE para eliminaciones
    try {
      const { userId, eventId } = req.body; // O req.query si se pasa como parámetro de URL

      if (!userId || !eventId) {
        return send(res, 400, { error: 'User ID and event ID are required.' });
      }

      const accessToken = await getAndRefreshGoogleAccessToken(userId);

      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });

      send(res, 200, { message: 'Event deleted successfully.' });

    } catch (error) {
      console.error('Error deleting calendar event:', error);
      send(res, 500, { error: 'Failed to delete calendar event.', details: error.message });
    }
  } else {
    send(res, 405, { error: 'Method Not Allowed' });
  }
};