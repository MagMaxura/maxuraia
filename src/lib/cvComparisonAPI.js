import OpenAI from 'openai';

// Asegúrate de que la variable de entorno para la API key de OpenAI esté configurada.
// Por ejemplo, en un archivo .env: VITO_OPENIA_API_KEY=tu_api_key
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

/**
 * Compara un CV con la descripción de un puesto de trabajo utilizando OpenAI.
 * @param {object} cvData - Datos del CV (ej. contenido del CV, resumen, habilidades).
 * @param {object} jobData - Datos del puesto de trabajo (ej. descripción, requisitos).
 * @returns {Promise<object>} Un objeto con:
 *                            - score: Puntaje de compatibilidad (0-100).
 *                            - summary: Resumen explicativo del análisis.
 *                            - recommendation: Booleano (true si se recomienda, false si no).
 */
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

// Ejemplo de uso (esto sería llamado desde el servicio de matching):
/*
async function testComparison() {
  const cvDataExample = {
    name: "Ana Pérez",
    title: "Desarrolladora Frontend Senior",
    summary: "Desarrolladora con 5 años de experiencia en React, Angular y Vue.js. Apasionada por crear interfaces intuitivas y accesibles.",
    skills: ["React", "JavaScript", "HTML", "CSS", "Angular", "Vue.js", "Node.js"],
    experience: "5 años desarrollando aplicaciones web complejas. Liderazgo técnico en proyectos.",
    cv_content: "Contenido completo del CV de Ana Pérez..." // Opcional si el resumen y habilidades son suficientes
  };

  const jobDataExample = {
    title: "Desarrollador Fullstack",
    description: "Buscamos un desarrollador Fullstack con experiencia en tecnologías modernas para unirse a nuestro equipo innovador.",
    requirements: "Mínimo 3 años de experiencia con React y Node.js. Conocimiento de bases de datos SQL y NoSQL. Experiencia con metodologías ágiles.",
    keywords: ["React", "Node.js", "Fullstack", "SQL", "MongoDB"]
  };

  const result = await compareCvWithJobOpenAI(cvDataExample, jobDataExample);
  console.log("Resultado de la comparación:", result);
}

// testComparison(); // Descomentar para probar localmente si tienes la API key configurada
*/