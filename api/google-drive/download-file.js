import { google } from 'googleapis';
import { Readable } from 'stream';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { fileId, accessToken } = req.query;

  if (!fileId || !accessToken) {
    return res.status(400).json({ message: 'File ID and access token are required.' });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: 'name, mimeType',
    });

    const fileName = fileMetadata.data.name;
    const mimeType = fileMetadata.data.mimeType;

    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeType);

    // Pipe the Google Drive file stream directly to the response
    response.data
      .on('end', () => {
        console.log('File download complete.');
      })
      .on('error', (err) => {
        console.error('Error during file download:', err);
        res.status(500).json({ message: 'Failed to download file.', error: err.message });
      })
      .pipe(res);

  } catch (error) {
    console.error('Error downloading Google Drive file:', error.message);
    res.status(500).json({ message: 'Failed to download Google Drive file.', error: error.message });
  }
}
