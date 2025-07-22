import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // The user will handle providing the necessary environment variables for Google API access.
  // These typically include GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.
  // For Vercel deployment, these will be set as environment variables.

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Assuming the access token is passed in the request body or headers for simplicity.
  // In a real application, this would come from a secure user session after OAuth flow.
  const { accessToken } = req.query; // Or req.headers.authorization

  if (!accessToken) {
    return res.status(400).json({ message: 'Access token is required.' });
  }

  oauth2Client.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const response = await drive.files.list({
      q: "mimeType='application/pdf' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document'",
      fields: 'files(id, name, mimeType, webContentLink)',
      pageSize: 100, // Adjust as needed
    });

    const files = response.data.files;
    if (!files || files.length === 0) {
      return res.status(200).json({ message: 'No CV files found in Google Drive.', files: [] });
    }

    res.status(200).json({ files });
  } catch (error) {
    console.error('Error listing Google Drive files:', error.message);
    res.status(500).json({ message: 'Failed to list Google Drive files.', error: error.message });
  }
}
