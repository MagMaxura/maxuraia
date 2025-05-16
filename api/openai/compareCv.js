import OpenAI from 'openai';

// Esta función se ejecutará en el backend (entorno Node.js en Vercel)
// La API Key debe estar configurada en Vercel como OPENAI_API_KEY (sin prefijo VITE_)
const apiKey = process.env.OPENAI_API_KEY;

let openai;
let apiKeyError = null;

if (!apiKey) {
  apiKeyError = "API Key de OpenAI (OPENAI_API_KEY) no encontrada en el entorno de backend. Asegúrate de que esté configurada en Vercel.";
  console.error(apiKeyError);
} else {
  openai = new OpenAI({ apiKey });
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
    Analiza la siguiente información de un candidato y un puesto de trabajo. Basándote en esta información, proporciona estrictamente un objeto JSON con la siguiente estructura y campos:
    1.  "score": Un número entero de compatibilidad del candidato con el puesto, de 0 a 100.
    2.  "summary": Un resumen explicativo conciso del análisis, destacando fortalezas y debilidades generales del candidato para el puesto. Sé muy crítico, porque de esto dependerá si tomamos buenas o malas decisiones futuras.
    3.  "recommendation_reasoning": Una breve explicación textual o los puntos clave de por qué se recomienda o no entrevistar al candidato.
    4.  "recommendation_decision": Indica únicamente con la palabra "sí" o la palabra "no" si se debería entrevistar al candidato.

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

    Respuesta esperada (estructura JSON exacta):
    {
      "score": <número entre 0 y 100>,
      "summary": "<resumen general de fortalezas y debilidades>",
      "recommendation_reasoning": "<breve explicación de por qué sí/no recomendar>",
      "recommendation_decision": "<'sí' o 'no' (únicamente una de estas dos palabras)>"
    }
  `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Modelo actualizado
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" }, // Asegurar respuesta JSON
    });

    const responseContent = completion.choices[0].message.content;
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (parseError) {
      console.error("Error al parsear respuesta de OpenAI como JSON:", parseError);
      console.error("Respuesta cruda de OpenAI que falló el parseo:", responseContent);
      throw new Error("La respuesta de OpenAI no pudo ser interpretada como JSON válido.");
    }

    // Validar que los campos esperados existan en la respuesta parseada
    if (typeof parsedResponse.score === 'undefined' || 
        typeof parsedResponse.summary === 'undefined' || 
        typeof parsedResponse.recommendation_reasoning === 'undefined' || 
        typeof parsedResponse.recommendation_decision === 'undefined') {
      console.error("Respuesta de OpenAI no contiene todos los campos esperados:", parsedResponse);
      throw new Error("La respuesta de OpenAI no contiene todos los campos esperados (score, summary, recommendation_reasoning, recommendation_decision).");
    }

    const result = {
      score: parseInt(parsedResponse.score, 10),
      summary: parsedResponse.summary,
      recommendation_reasoning: parsedResponse.recommendation_reasoning,
      recommendation_decision: parsedResponse.recommendation_decision,
      recommendation: parsedResponse.recommendation_decision ? parsedResponse.recommendation_decision.toLowerCase() === 'sí' : false,
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error("Error al llamar a la API de OpenAI desde el backend (api/openai/compareCv.js):", error);
    let errorMessage = "Error al procesar la comparación con OpenAI en el servidor.";
    if (error.message) {
      errorMessage = error.message;
    }
    return res.status(500).json({ 
      error: "Error interno del servidor al procesar la comparación.",
      details: errorMessage 
    });
  }
}