import OpenAI from 'openai';

// Esta función se ejecutará en el backend (entorno Node.js en Vercel)
// Aquí SÍ se debe usar process.env y la variable en Vercel NO debe tener el prefijo VITE_
// Asegúrate de que en Vercel esté configurada OPENAI_API_KEY o VITO_OPENAI_API_KEY
const apiKey = process.env.OPENAI_API_KEY || process.env.VITO_OPENAI_API_KEY;

let openai;
let apiKeyError = null;

if (!apiKey) {
  apiKeyError = "API Key de OpenAI no encontrada en el backend. Asegúrate de que OPENAI_API_KEY o VITO_OPENAI_API_KEY esté configurada en Vercel para el entorno de backend (sin prefijo VITE_).";
  console.error(apiKeyError);
} else {
  //openai = new OpenAI({ apiKey });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (apiKeyError || !openai) {
    return res.status(500).json({ error: "Error de configuración del servidor de OpenAI: " + (apiKeyError || "Cliente no inicializado.") });
  }

  const { cvData, jobData } = req.body;

  if (!cvData || !jobData) {
    return res.status(400).json({ error: 'Faltan datos del CV (cvData) o del puesto (jobData).' });
  }

  try {
    const prompt = `
    Analiza la siguiente información de un candidato y un puesto de trabajo. Basándote en esta información, proporciona:
    1. Un score de compatibilidad del candidato con el puesto, de 0 a 100.
    2. Un resumen explicativo conciso del análisis, destacando fortalezas y debilidades del candidato para el puesto.
    3. Una recomendación clara sobre si se debería entrevistar al candidato para este puesto (responde únicamente "sí" o "no").

    Información del Candidato:
    ---
    Nombre: ${cvData.name || 'No especificado'}
    Título/Puesto Actual: ${cvData.title || 'No especificado'}
    Resumen del Perfil:
    ${cvData.summary || 'No especificado'}
    Habilidades:
    ${cvData.skills ? (Array.isArray(cvData.skills) ? cvData.skills.join(', ') : cvData.skills) : 'No especificadas'}
    Experiencia:
    ${cvData.experience || 'No especificada'}
    Contenido del CV (si está disponible):
    ${cvData.cv_content || 'No disponible'}
    ---

    Información del Puesto de Trabajo:
    ---
    Título del Puesto: ${jobData.title || 'No especificado'}
    Descripción del Puesto:
    ${jobData.description || 'No especificada'}
    Requisitos del Puesto:
    ${jobData.requirements || 'No especificados'}
    Palabras Clave del Puesto:
    ${jobData.keywords ? (Array.isArray(jobData.keywords) ? jobData.keywords.join(', ') : jobData.keywords) : 'No especificadas'}
    ---

    Respuesta esperada (estructura JSON):
    {
      "score": <número entre 0 y 100>,
      "summary": "<resumen explicativo>",
      "recommendation_text": "<'sí' o 'no'>"
    }
  `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      // response_format: { type: "json_object" }, // Considerar para modelos más nuevos
    });

    const responseContent = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(responseContent); // Asumir que la respuesta es JSON válido

    const result = {
      score: parseInt(parsedResponse.score, 10),
      summary: parsedResponse.summary,
      recommendation: parsedResponse.recommendation_text ? parsedResponse.recommendation_text.toLowerCase() === 'sí' : false,
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error("Error al llamar a la API de OpenAI desde el backend:", error);
    let errorMessage = "Error al procesar la comparación con OpenAI en el servidor.";
    if (error.response) {
      console.error("Detalles del error de OpenAI:", error.response.data);
      errorMessage = error.response.data.error?.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return res.status(500).json({ 
      error: errorMessage,
      details: error.message // Para más contexto en el cliente si es necesario
    });
  }
}