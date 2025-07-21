import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || process.env.VITO_OPENAI_API_KEY;

let openai;
let apiKeyError = null;

if (!apiKey) {
  apiKeyError = "API Key de OpenAI no encontrada en el backend. Asegúrate de que OPENAI_API_KEY o VITO_OPENAI_API_KEY esté configurada en Vercel para el entorno de backend (sin prefijo VITE_).";
  console.error(apiKeyError);
} else {
  openai = new OpenAI({ apiKey });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  if (apiKeyError || !openai) {
    return res.status(500).json({ error: "Error de configuración del servidor de OpenAI: " + (apiKeyError || "Cliente no inicializado.") });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Falta el texto del CV (text).' });
  }

  try {
    console.log("analyzeCv API: Recibido texto del CV:", text.substring(0, 300));
    const prompt = `Analiza el siguiente CV y extrae la información solicitada. Es muy importante que sigas estas instrucciones específicas y devuelvas un objeto JSON válido con la siguiente estructura:

1.  **nombre**: (string) Nombre completo del candidato.
2.  **edad**: (string) Edad del candidato en años (solo el número). Si no se encuentra, intenta calcularla a partir de la fecha de nacimiento. Si no es posible, devuelve null.
3.  **localidad**: (string) Ciudad y provincia/estado de residencia.
4.  **email**: (string) Correo electrónico principal.
5.  **telefono**: (string) Número de teléfono principal.
6.  **nivel_escolarizacion**: (string) El título o nivel de escolarización más alto alcanzado (ej: "Secundaria Completa", "Técnico en Electrónica", "Licenciado en Administración", "Ingeniero en Sistemas", "Magíster en IA", "Doctorado en Física"). Sé específico.
7.  **habilidades**: (object) Un objeto con dos propiedades:
    *   **tecnicas**: (string[]) Array de strings con las habilidades técnicas o duras (herramientas, software, lenguajes de programación, certificaciones técnicas, etc.).
    *   **blandas**: (string[]) Array de strings con las habilidades blandas o interpersonales (comunicación, liderazgo, trabajo en equipo, resolución de problemas, etc.).
    Si no se encuentran habilidades de un tipo, devuelve un array vacío para esa categoría.
8.  **resumen**: (string) Un resumen ejecutivo profesional de 3-4 líneas enfocado para el reclutador, destacando puntos relevantes, logros y valor diferencial. Escribe en tercera persona y sin emojis.
9.  **experiencia**: (string) TODA la experiencia laboral relevante, manteniendo el formato original del CV tanto como sea posible, incluyendo fechas, empresas, cargos, responsabilidades y logros. Conserva detalles técnicos y palabras clave. Debe ser texto plano con saltos de línea.

Asegúrate de que la respuesta sea únicamente el objeto JSON solicitado.

CV a analizar:
${text}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 2800
    });

    const responseContent = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(responseContent);

    // Asegurar que la experiencia sea texto
    if (parsedResponse.experiencia && typeof parsedResponse.experiencia === 'object') {
      parsedResponse.experiencia = Object.entries(parsedResponse.experiencia)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('\n');
    }

    // Asegurar que las habilidades sean arrays de strings
    if (!parsedResponse.habilidades || typeof parsedResponse.habilidades !== 'object') {
        parsedResponse.habilidades = { tecnicas: [], blandas: [] };
    } else {
        parsedResponse.habilidades.tecnicas = Array.isArray(parsedResponse.habilidades.tecnicas)
            ? parsedResponse.habilidades.tecnicas.map(String)
            : [];
        parsedResponse.habilidades.blandas = Array.isArray(parsedResponse.habilidades.blandas)
            ? parsedResponse.habilidades.blandas.map(String)
            : [];
    }

    // Asegurar que nivel_escolarizacion sea un string
    if (typeof parsedResponse.nivel_escolarizacion !== 'string') {
        parsedResponse.nivel_escolarizacion = parsedResponse.nivel_escolarizacion ? String(parsedResponse.nivel_escolarizacion) : "No especificado";
    }

    return res.status(200).json(parsedResponse);

  } catch (error) {
    console.error("Error al llamar a la API de OpenAI desde el backend:", error);
    let errorMessage = "Error al procesar la comparación con OpenAI en el servidor.";

    if (error instanceof OpenAI.APIError) {
      console.error("Error de la API de OpenAI:", error.status, error.message, error.code);
      errorMessage = `Error de OpenAI: ${error.message} (Code: ${error.code || 'N/A'}, Status: ${error.status})`;
      return res.status(500).json({ error: errorMessage, details: error.message, code: error.code, status: error.status });
    } else if (error instanceof SyntaxError) {
      console.error("Error al parsear la respuesta JSON de OpenAI:", error);
      errorMessage = "Error al procesar la respuesta de OpenAI (JSON inválido).";
      return res.status(500).json({ error: errorMessage, details: error.message });
    }
    
    if (error.response) {
      console.error("Detalles del error de OpenAI:", error.response.data);
      errorMessage = error.response.data.error?.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return res.status(500).json({
      error: errorMessage,
      details: error.message
    });
  }
}
