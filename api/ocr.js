// /api/ocr.js
import formidable from 'formidable';
import fs from 'fs';
import { Storage } from '@google-cloud/storage';
import vision from '@google-cloud/vision';
import path from 'path';

// Configurar formidable para manejar archivos
export const config = {
  api: {
    bodyParser: false,
  },
};

const bucketName = 'orc-emplñoysmart'; 

// Inicializar Google Storage y Vision con las credenciales del env
function getGCloudClients() {
  const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  const storage = new Storage({ credentials });
  const visionClient = new vision.v1.ImageAnnotatorClient({ credentials });
  return { storage, visionClient };
}

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Error en upload' });

    const file = files.file;
    if (!file) return res.status(400).json({ error: 'Archivo no enviado' });

    const filePath = file.filepath || file.path;
    const filename = path.basename(file.originalFilename || file.name);

    const { storage, visionClient } = getGCloudClients();

    try {
      // Subir el archivo PDF a GCS
      await storage.bucket(bucketName).upload(filePath, {
        destination: filename,
        resumable: false,
        metadata: { contentType: file.mimetype }
      });

      const gcsUri = `gs://${bucketName}/${filename}`;
      // Pedir OCR a Google Vision (DOCUMENT_TEXT_DETECTION)
      const [operation] = await visionClient.asyncBatchAnnotateFiles({
        requests: [
          {
            inputConfig: {
              gcsSource: { uri: gcsUri },
              mimeType: 'application/pdf',
            },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
            outputConfig: {
              gcsDestination: { uri: `gs://${bucketName}/ocr_results/` }
            }
          }
        ]
      });

      // Esperar a que termine el procesamiento
      await operation.promise();

      // Descargar el resultado de OCR desde el bucket
      // Buscamos el archivo .json generado en /ocr_results/
      const [files] = await storage.bucket(bucketName).getFiles({ prefix: 'ocr_results/' });
      let resultText = '';

      for (const resultFile of files) {
        if (resultFile.name.endsWith('.json')) {
          const data = await resultFile.download();
          const json = JSON.parse(data.toString());
          // El texto extraído está en fullTextAnnotation.text
          if (
            json.responses &&
            json.responses[0] &&
            json.responses[0].fullTextAnnotation &&
            json.responses[0].fullTextAnnotation.text
          ) {
            resultText += json.responses[0].fullTextAnnotation.text + '\n';
          }
        }
      }

      // Limpiar: eliminar archivo PDF y JSON de OCR del bucket
      await storage.bucket(bucketName).file(filename).delete();
      for (const resultFile of files) {
        await resultFile.delete();
      }

      res.status(200).json({ text: resultText });
    } catch (e) {
      res.status(500).json({ error: e.message });
    } finally {
      // Limpiar archivo local temporal
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });
}
