// Este archivo contenía anteriormente la lógica para llamar a OpenAI desde el cliente
// para la comparación de CVs.
// Esta lógica ha sido movida a una función de backend segura en /api/openai/compareCv.js
// para proteger la clave API de OpenAI.
//
// El contenido original ha sido comentado para evitar su uso accidental.
// Si necesitas referenciar el código anterior, revisa el historial de versiones.

/*
import OpenAI from 'openai';

// Asegúrate de que la variable de entorno para la API key de OpenAI esté configurada en Vercel
// con el nombre VITO_OPENAI_API_KEY (sin el prefijo VITE_ para uso en backend).
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("API Key de OpenAI no encontrada. Asegúrate de que la variable de entorno OPENAI_API_KEY esté configurada correctamente en Vercel para el entorno de backend y que el despliegue esté actualizado.");
  console.log("Variables de entorno disponibles (solo para depuración, eliminar después):", Object.keys(process.env)); // Log para depuración
}

const openai = new OpenAI({
  apiKey: apiKey,
});

export async function compareCvWithJobOpenAI(cvData, jobData) {
  // TODO: Validar que cvData y jobData no estén vacíos y tengan la estructura esperada.

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

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // O el modelo que prefieras y tengas acceso
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3, // Ajusta la temperatura para controlar la creatividad vs determinismo
      // response_format: { type: "json_object" }, // Habilitar si usas modelos que lo soporten (ej. gpt-3.5-turbo-1106+)
    });

    const responseContent = completion.choices[0].message.content;
    // TODO: Implementar un parseo más robusto y manejo de errores si la respuesta no es JSON válido.
    const parsedResponse = JSON.parse(responseContent);

    return {
      score: parseInt(parsedResponse.score, 10),
      summary: parsedResponse.summary,
      // Convertir la recomendación de texto a booleano
      recommendation: parsedResponse.recommendation_text ? parsedResponse.recommendation_text.toLowerCase() === 'sí' : false,
    };

  } catch (error) {
    console.error("Error al llamar a la API de OpenAI:", error);
    // Considera cómo manejar el error: relanzarlo, devolver un valor por defecto, etc.
    // Por ahora, devolvemos un objeto indicando el fallo.
    return {
      score: 0,
      summary: "Error al procesar la comparación con OpenAI.",
      recommendation: false,
      error: error.message,
    };
  }
}
*/