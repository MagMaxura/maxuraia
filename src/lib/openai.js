
import OpenAI from 'openai';

// Configuración de OpenAI con la clave API desde las variables de entorno
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function analyzeCVWithGPT(text) {
  try {
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

    // Usar un modelo que soporte bien el modo JSON y sea eficiente.
    // gpt-3.5-turbo-0125 o gpt-4-turbo-preview son buenas opciones si están disponibles.
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      response_format: { type: "json_object" }, // Solicitar respuesta en formato JSON
      messages: [
        // Podríamos añadir un system prompt si quisiéramos refinar el rol de la IA,
        // pero el prompt del usuario ya es bastante directivo.
        // { role: "system", content: "Eres un asistente experto en extracción de datos de CVs." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2, // Más bajo para mayor consistencia en la extracción estructurada
      max_tokens: 2800 // Aumentar un poco por si los nuevos campos añaden longitud
    });

    const response = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(response);

    // Asegurar que la experiencia sea texto
    if (parsedResponse.experiencia && typeof parsedResponse.experiencia === 'object') {
      // Si por error devuelve un objeto para experiencia, intentar convertirlo a un string legible.
      // Esto no debería pasar con el prompt actual, pero es una salvaguarda.
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


    return parsedResponse;
  } catch (error) {
    console.error('Error al analizar CV con GPT:', error);
    throw error;
  }
}
