import OpenAI from 'openai';

// Configuración de OpenAI (asumiendo que ya está configurado en tu proyecto)
// Si no, necesitarás inicializarlo como en openai.js
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Considera implicaciones de seguridad si es para el frontend
});

/**
 * @typedef {Object} GeneratedJob
 * @property {string} title - El título del puesto de trabajo.
 * @property {string} description - La descripción detallada del puesto.
 * @property {Record<string, string[]>} requirements - Requisitos estructurados como JSON.
 *                                                  Ej: { "educacion": ["Grado en CS"], "experiencia": ["3+ años en React"] }
 * @property {string[]} keywords - Un array de palabras clave.
 */

/**
 * Genera una publicación de empleo a partir de una descripción libre usando IA.
 * @param {string} recruiterPrompt - La descripción libre del puesto o perfil deseado.
 * @returns {Promise<GeneratedJob>} El objeto del puesto de trabajo generado.
 */
export async function generateJobFromPrompt(recruiterPrompt) {
  if (!recruiterPrompt || recruiterPrompt.trim() === "") {
    throw new Error("La descripción del reclutador no puede estar vacía.");
  }

  const systemPrompt = `Eres un experto en redacción de ofertas laborales. A partir de una descripción libre del reclutador, genera una publicación de empleo profesional. Debes devolver un objeto JSON con la siguiente estructura y tipos de datos:
{
  "title": "string", // Título claro y conciso para el puesto.
  "description": "string", // Descripción atractiva y detallada del puesto, responsabilidades y qué se ofrece.
  "requirements": {}, // Objeto JSON. Las claves son categorías de requisitos (ej: "Educación", "Experiencia Requerida", "Habilidades Técnicas", "Habilidades Blandas") y los valores son arrays de strings con cada requisito. Ej: { "Educación": ["Grado en Ingeniería Informática"], "Experiencia Requerida": ["5+ años con JavaScript", "Experiencia en gestión de equipos"] }
  "keywords": [] // Array de strings con palabras clave relevantes para búsqueda, separadas individualmente.
}
Asegúrate de que el campo 'requirements' sea un objeto JSON válido y que 'keywords' sea un array de strings.
La descripción del puesto debe ser profesional y atractiva para los candidatos.
Los requisitos deben estar bien estructurados y ser específicos.
Las palabras clave deben ser relevantes para el puesto y facilitar su búsqueda.`;

  console.log("generateJobFromPrompt: Enviando a OpenAI con prompt del reclutador:", recruiterPrompt);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125", // Usamos un modelo disponible y eficiente. GPT-4 es más costoso.
      // model: "gpt-4-turbo-preview", // Si tienes acceso y presupuesto para GPT-4
      response_format: { type: "json_object" }, // Pedir respuesta en formato JSON
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: recruiterPrompt },
      ],
      temperature: 0.5, // Un poco de creatividad pero manteniendo la relevancia
      max_tokens: 1500, // Ajustar según necesidad
    });

    const responseContent = completion.choices[0].message.content;
    console.log("generateJobFromPrompt: Respuesta cruda de OpenAI:", responseContent);

    if (!responseContent) {
      throw new Error("La respuesta de OpenAI está vacía.");
    }

    const generatedJob = JSON.parse(responseContent);

    // Validaciones básicas del formato esperado
    if (typeof generatedJob.title !== 'string' ||
        typeof generatedJob.description !== 'string' ||
        typeof generatedJob.requirements !== 'object' ||
        !Array.isArray(generatedJob.keywords)) {
      console.error("generateJobFromPrompt: La estructura de la respuesta de OpenAI no es la esperada.", generatedJob);
      throw new Error("La IA devolvió un formato de datos inesperado para la oferta de trabajo.");
    }
    
    // Asegurar que keywords sea un array de strings
    generatedJob.keywords = generatedJob.keywords.map(kw => String(kw));

    console.log("generateJobFromPrompt: Puesto generado parseado:", generatedJob);
    return generatedJob;

  } catch (error) {
    console.error("Error al generar la oferta de trabajo con IA:", error);
    // Podrías lanzar un error más específico o con más contexto
    if (error.response && error.response.data) {
      console.error("Error data from OpenAI:", error.response.data);
    }
    throw new Error(`Error al comunicarse con la IA: ${error.message}`);
  }
}