
import OpenAI from 'openai';

// Configuración de OpenAI con la clave API desde las variables de entorno
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function analyzeCVWithGPT(text) {
  try {
    const prompt = `Analiza el siguiente CV y extrae la información solicitada. Es muy importante que sigas estas instrucciones específicas:

1. Para el resumen:
   - Genera un resumen ejecutivo profesional enfocado para el reclutador (3-4 líneas)
   - Destaca los puntos más relevantes del candidato
   - Menciona logros principales y valor diferencial
   - NO uses emojis ni símbolos especiales
   - Escribe en tercera persona

2. Para la experiencia:
   - Extrae TODA la información relevante del CV
   - Mantén el formato original del texto
   - Incluye fechas, empresas, cargos, responsabilidades y logros
   - Conserva TODOS los detalles técnicos y específicos
   - Mantén las palabras clave y tecnologías mencionadas
   - La experiencia debe ser lo más detallada posible
   - Devuelve la experiencia como texto plano, manteniendo saltos de línea
   - NO estructures la experiencia como objeto JSON

Devuelve la información en el siguiente formato JSON:
{
  "nombre": "Nombre completo",
  "edad": "Número de edad (solo dígitos)",
  "localidad": "Ciudad o ubicación",
  "email": "Correo electrónico",
  "telefono": "Número de teléfono",
  "habilidades": ["Array", "de", "habilidades", "principales"],
  "resumen": "Resumen ejecutivo para el reclutador",
  "experiencia": "Experiencia laboral completa en formato texto"
}

CV a analizar:
${text}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      max_tokens: 2500
    });

    const response = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(response);

    // Asegurar que la experiencia sea texto
    if (typeof parsedResponse.experiencia === 'object') {
      parsedResponse.experiencia = JSON.stringify(parsedResponse.experiencia, null, 2);
    }

    return parsedResponse;
  } catch (error) {
    console.error('Error al analizar CV con GPT:', error);
    throw error;
  }
}
