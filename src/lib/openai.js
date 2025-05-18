
import OpenAI from 'openai';

// Configuración de OpenAI con la clave API desde las variables de entorno
//const openai = new OpenAI({
//  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
//  dangerouslyAllowBrowser: true
//});

export async function analyzeCVWithGPT(text) {
  try {
    const response = await fetch('/api/openai/analyzeCv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error desconocido en el servidor');
    }

    const parsedResponse = await response.json();
    return parsedResponse;
  } catch (error) {
    console.error('Error al analizar CV con GPT:', error);
    throw error;
  }
}
