import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { accessToken } = req.query;

  if (!accessToken) {
    return res.status(400).json({ message: 'Access token is required.' });
  }

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: 'v3', auth });

    // List files, filtering for PDF and DOCX MIME types
    const response = await drive.files.list({
      q: "mimeType='application/pdf' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType='application/msword'",
      fields: 'files(id, name, mimeType)',
      pageSize: 100, // Adjust as needed
    });

    res.status(200).json({ files: response.data.files });
  } catch (error) {
    console.error('Error listing Google Drive files:', error.message);
    res.status(500).json({ message: 'Failed to list files from Google Drive.', error: error.message });
  }
}
