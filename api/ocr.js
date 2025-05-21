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
    console.log("OCR API: Google Cloud clients initialized.");

    try {
      // Subir el archivo PDF a GCS
      console.log("OCR API: Uploading file to GCS bucket:", bucketName, " - Filename:", filename);
      const uploadResponse = await storage.bucket(bucketName).upload(filePath, {
        destination: filename,
        resumable: false,
        metadata: { contentType: file.mimetype }
      });
      console.log("OCR API: File uploaded to GCS successfully. Upload response:", uploadResponse);

      const gcsUri = `gs://${bucketName}/${filename}`;
      console.log("OCR API: GCS URI:", gcsUri);
      // Pedir OCR a Google Vision (DOCUMENT_TEXT_DETECTION)
      console.log("OCR API: Calling Google Vision API for OCR.");
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
      console.log("OCR API: Google Vision API call initiated. Operation name:", operation.name);

      // Esperar a que termine el procesamiento
      console.log("OCR API: Waiting for OCR processing to complete.");
      await operation.promise();
      console.log("OCR API: OCR processing completed successfully.");

      // Descargar el resultado de OCR desde el bucket
      console.log("OCR API: Downloading OCR results from GCS bucket:", bucketName);
      // Buscamos el archivo .json generado en /ocr_results/
      const [files] = await storage.bucket(bucketName).getFiles({ prefix: 'ocr_results/' });
      console.log("OCR API: Files found in GCS bucket:", files.map(f => f.name));
      let resultText = '';

      for (const resultFile of files) {
        if (resultFile.name.endsWith('.json')) {
          console.log("OCR API: Processing result file:", resultFile.name);
          try {
            const data = await resultFile.download();
            console.log("OCR API: Result file downloaded successfully.");
            const json = JSON.parse(data.toString());
            console.log("OCR API: Result file parsed as JSON successfully.");
            // El texto extraído está en fullTextAnnotation.text
            if (
              json.responses &&
              json.responses[0] &&
              json.responses[0].fullTextAnnotation &&
              json.responses[0].fullTextAnnotation.text
            ) {
              resultText += json.responses[0].fullTextAnnotation.text + '\n';
            }
          } catch (downloadError) {
            console.error("OCR API: Error downloading or parsing result file:", resultFile.name, downloadError);
          }
        }
      }
      console.log("OCR API: OCR results downloaded and processed. Result text (first 300 chars):", resultText.substring(0, 300));

      // Limpiar: eliminar archivo PDF y JSON de OCR del bucket
      console.log("OCR API: Cleaning up GCS bucket. Deleting PDF and JSON files.");
      await storage.bucket(bucketName).file(filename).delete();
      for (const resultFile of files) {
        await resultFile.delete();
      }
      console.log("OCR API: GCS bucket cleanup completed.");

      res.status(200).json({ text: resultText });
    } catch (e) {
      console.error("OCR API: General error during OCR processing:", e);
      res.status(500).json({ error: e.message });
    } finally {
      // Limpiar archivo local temporal
      console.log("OCR API: Cleaning up local temporary file.");
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      console.log("OCR API: Local temporary file cleanup completed.");
    }
  });
}
