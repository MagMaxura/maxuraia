import { google } from 'googleapis';
import { send } from 'micro';
import { getAndRefreshGoogleAccessToken } from '../_lib/googleAuthUtils.js';

export default async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { userId, eventData } = req.body;

      if (!userId || !eventData) {
        return send(res, 400, { error: 'User ID and event data are required.' });
      }

      const accessToken = await getAndRefreshGoogleAccessToken(userId);

      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const event = {
        summary: eventData.title,
        description: eventData.description,
        start: eventData.start,
        end: eventData.end,
        // Puedes añadir más propiedades del evento aquí, como attendees, location, etc.
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });

      send(res, 200, { event: response.data });

    } catch (error) {
      console.error('Error creating calendar event:', error);
      send(res, 500, { error: 'Failed to create calendar event.', details: error.message });
    }
  } else {
    send(res, 405, { error: 'Method Not Allowed' });
  }
};