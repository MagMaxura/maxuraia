import { google } from 'googleapis';
import { send } from 'micro';
import { getAndRefreshGoogleAccessToken } from '../_lib/googleAuthUtils';

export default async (req, res) => {
  if (req.method === 'GET') {
    try {
      const { userId } = req.query;

      if (!userId) {
        return send(res, 400, { error: 'User ID is required.' });
      }

      const accessToken = await getAndRefreshGoogleAccessToken(userId);

      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const now = new Date();
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(now.getMonth() + 1);

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: oneMonthLater.toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items;
      send(res, 200, { events });

    } catch (error) {
      console.error('Error listing calendar events:', error);
      send(res, 500, { error: 'Failed to list calendar events.', details: error.message });
    }
  } else {
    send(res, 405, { error: 'Method Not Allowed' });
  }
};