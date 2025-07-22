import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { fileId, accessToken } = req.query;

  if (!fileId || !accessToken) {
    return res.status(400).json({ message: 'File ID and access token are required.' });
  }

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: 'v3', auth });

    // Get file metadata to determine mimeType
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: 'mimeType,name',
    });
    const mimeType = fileMetadata.data.mimeType;
    const fileName = fileMetadata.data.name;

    // Download the file
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media',
    }, { responseType: 'stream' });

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    response.data.pipe(res);
  } catch (error) {
    console.error('Error downloading Google Drive file:', error.message);
    res.status(500).json({ message: 'Failed to download file from Google Drive.', error: error.message });
  }
}
