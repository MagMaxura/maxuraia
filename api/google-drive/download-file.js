import { google } from 'googleapis';
import { getAndRefreshGoogleAccessToken } from '../_lib/googleAuthUtils';
import { getAuthUser } from '../_lib/authUtils'; // Asumiendo que tienes una función para obtener el usuario autenticado

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { fileId } = req.query;

  // Obtener el ID del usuario autenticado
  const { user, error: authError } = await getAuthUser(req);
  if (authError || !user) {
    return res.status(401).json({ message: 'Unauthorized', error: authError?.message });
  }

  if (!fileId) {
    return res.status(400).json({ message: 'File ID is required.' });
  }

  try {
    // Obtener el access_token (y refrescarlo si es necesario)
    const accessToken = await getAndRefreshGoogleAccessToken(user.id);

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
