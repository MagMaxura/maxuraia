// /api/generate-job.js  (o /api/openia/generate-job.js)

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  let recruiterPrompt;
  // Vercel a veces parsea el body, a veces no
  if (typeof req.body === 'string') {
    try {
      recruiterPrompt = JSON.parse(req.body).recruiterPrompt;
    } catch (e) {
      return res.status(400).json({ error: 'Error de parseo en el body.' });
    }
  } else {
    recruiterPrompt = req.body.recruiterPrompt;
  }

  if (!recruiterPrompt || typeof recruiterPrompt !== 'string' || recruiterPrompt.trim() === "") {
    return res.status(400).json({ error: "La descripción del reclutador no puede estar vacía." });
  }

  const systemPrompt = `Eres un experto en redacción de ofertas laborales. A partir de una descripción libre del reclutador, genera una publicación de empleo profesional. Debes devolver un objeto JSON con la siguiente estructura y tipos de datos:
{
  "title": "string", 
  "description": "string", 
  "requirements": {}, 
  "keywords": []
}
Asegúrate de que el campo 'requirements' sea un objeto JSON válido y que 'keywords' sea un array de strings.
La descripción debe ser profesional y atractiva para los candidatos. Los requisitos bien estructurados y específicos. Palabras clave relevantes y útiles para búsquedas.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: recruiterPrompt },
      ],
      temperature: 0.5,
      max_tokens: 3500,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return res.status(500).json({ error: "La respuesta de OpenAI está vacía." });
    }

    const generatedJob = JSON.parse(responseContent);

    if (
      typeof generatedJob.title !== 'string' ||
      typeof generatedJob.description !== 'string' ||
      typeof generatedJob.requirements !== 'object' ||
      !Array.isArray(generatedJob.keywords)
    ) {
      return res.status(500).json({ error: "La IA devolvió un formato inesperado." });
    }

    generatedJob.keywords = generatedJob.keywords.map((kw) => String(kw));

    return res.status(200).json(generatedJob);
  } catch (error) {
    console.error("Error al generar la oferta de trabajo con IA:", error);
    return res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
};
