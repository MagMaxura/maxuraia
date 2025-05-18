import OpenAI from 'openai';

// Configuración de OpenAI (asumiendo que ya está configurado en tu proyecto)
// Si no, necesitarás inicializarlo como en openai.js
//const openai = new OpenAI({
//  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
//  dangerouslyAllowBrowser: true, // Considera implicaciones de seguridad si es para el frontend
//});

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

  try {
    const response = await fetch('/api/openai/generate-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recruiterPrompt }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error desconocido en el servidor');
    }

    const generatedJob = await response.json();
    return generatedJob;
  } catch (error) {
    console.error("Error al generar oferta con IA:", error);
    throw new Error(`Error al comunicarse con la IA: ${error.message}`);
  }
}
