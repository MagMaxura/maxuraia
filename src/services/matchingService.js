import { supabase } from '../lib/supabase'; // Asegúrate de que la ruta a tu cliente Supabase sea correcta
// La importación de compareCvWithJobOpenAI se elimina, ya que ahora se llamará a una API.

/**
 * Procesa y guarda las coincidencias entre candidatos seleccionados (o todos) y un puesto de trabajo específico,
 * llamando a una API de backend para la comparación con OpenAI.
 *
 * @param {string} jobId El UUID del puesto de trabajo a procesar.
 * @param {string[]} [candidateIds] Un array opcional de UUIDs de candidatos a procesar. Si no se provee, se procesarán todos los candidatos.
 * @returns {Promise<Array<object>>} Una promesa que resuelve a un array de los resultados (nuevos o existentes) de la tabla 'matches'.
 * @throws {Error} Si el puesto de trabajo no se encuentra o si ocurren errores durante el proceso.
 */
export async function processJobMatches(jobId, candidateIds = []) {
  if (!jobId) {
    console.error("Error: Se requiere un ID de puesto de trabajo (jobId).");
    throw new Error("Se requiere un ID de puesto de trabajo (jobId).");
  }

  if (candidateIds && !Array.isArray(candidateIds)) {
    console.error("Error: candidateIds debe ser un array.");
    throw new Error("candidateIds debe ser un array.");
  }

  // 1. Obtener los detalles del puesto de trabajo
  const { data: jobData, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, description, requirements, keywords')
    .eq('id', jobId)
    .single();

  if (jobError || !jobData) {
    console.error(`Error al obtener el puesto de trabajo ${jobId}:`, jobError);
    throw new Error(`Puesto de trabajo con ID ${jobId} no encontrado o error al obtenerlo.`);
  }

  // 2. Obtener los candidatos a procesar.
  let candidatesQuery = supabase
    .from('candidatos')
    .select(`
      id,
      name,
      title,
      summary,
      skills,
      experience,
      cvs (
        content,
        file_name,
        created_at
      )
    `);

  if (candidateIds && candidateIds.length > 0) {
    candidatesQuery = candidatesQuery.in('id', candidateIds);
  }
  // Podrías añadir filtros aquí, ej. .eq('status', 'activo')
  // También, si un candidato puede tener múltiples CVs, decidir cuál usar.
  // Por ejemplo, ordenar por 'created_at' y tomar el más reciente de 'cvs'.
  // .order('created_at', { foreignTable: 'cvs', ascending: false })

  const { data: candidates, error: candidatesError } = await candidatesQuery;

  if (candidatesError) {
    console.error("Error al obtener candidatos:", candidatesError);
    throw new Error("Error al obtener la lista de candidatos.");
  }

  if (!candidates || candidates.length === 0) {
    console.log("No se encontraron candidatos para procesar con los IDs proporcionados o no hay candidatos.");
    return [];
  }

  const allResults = [];

  for (const candidate of candidates) {
    // 2.1 Verificar si ya existe un match para este candidato y puesto
    const { data: existingMatch, error: existingMatchError } = await supabase
      .from('matches')
      .select('*')
      .eq('job_id', jobId)
      .eq('candidato_id', candidate.id)
      .maybeSingle(); // Usamos maybeSingle para no tener error si no existe

    if (existingMatchError) {
      console.error(`Error al verificar match existente para candidato ${candidate.id} y job ${jobId}:`, existingMatchError);
      // Considerar si continuar o no. Por ahora, se intentará procesar.
    }

    if (existingMatch) {
      console.log(`Match ya existente para candidato ${candidate.id} y job ${jobId}. Score: ${existingMatch.match_score}. Omitiendo re-análisis.`);
      // Extraer la recomendación del texto de análisis si es necesario para la UI
      const recommendation = existingMatch.analysis && existingMatch.analysis.toLowerCase().includes("recomendación: sí");
      allResults.push({ ...existingMatch, recommendation, alreadyExisted: true, error: false });
      continue; // Saltar al siguiente candidato
    }

    // Preparar cvData
    let cvTextContent = 'No disponible';
    if (candidate.cvs && candidate.cvs.length > 0) {
      // Lógica para seleccionar el CV correcto y extraer texto.
      // Asumimos que el primer CV es el relevante y que 'content' puede ser un objeto.
      // Si 'content' es JSONB con una estructura como { "text_content": "..." }
      // cvTextContent = candidate.cvs[0].content?.text_content || JSON.stringify(candidate.cvs[0].content);
      // Por ahora, si es un objeto, lo pasamos como string para que el prompt lo maneje.
      // Si es texto plano, se pasa directamente.
      const rawCvContent = candidate.cvs[0].content;
      if (typeof rawCvContent === 'object' && rawCvContent !== null) {
        cvTextContent = JSON.stringify(rawCvContent); // Simplificación, idealmente extraer texto relevante
      } else if (typeof rawCvContent === 'string') {
        cvTextContent = rawCvContent;
      }
    }

    const cvDataForAPI = {
      name: candidate.name,
      title: candidate.title,
      summary: candidate.summary,
      skills: candidate.skills,
      experience: candidate.experience,
      cv_content: cvTextContent,
    };

    const jobDataForAPI = {
      title: jobData.title,
      description: jobData.description,
      requirements: jobData.requirements,
      keywords: jobData.keywords,
    };

    console.log(`Comparando CV de ${candidate.name} (${candidate.id}) con el puesto ${jobData.title} (${jobId})...`);

    // 3. Llamar a la API de backend para la comparación con OpenAI
    let comparisonResult;
    try {
      // Volver a llamar a la API de backend. La ruta ahora es /api/openai/compareCv (desde la raíz)
      const response = await fetch('/api/openai/compareCv', { // Ruta relativa a la raíz del dominio
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cvData: cvDataForAPI, jobData: jobDataForAPI }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // Si la respuesta no es JSON (ej. HTML de error 500 sin JSON)
          errorData = { error: `Error del servidor: ${response.status} - ${response.statusText}`, details: await response.text() };
        }
        console.error("Error data from API:", errorData);
        throw new Error(errorData.error || errorData.details || `Error del servidor: ${response.status}`);
      }
      comparisonResult = await response.json();
      console.log(`[matchingService] comparisonResult desde API para candidato ${candidate.id}:`, comparisonResult);


    } catch (fetchOrApiError) {
      console.error(`Error al llamar a la API /api/openai/compareCv o procesar su respuesta para candidato ${candidate.id}:`, fetchOrApiError);
      allResults.push({
        job_id: jobId,
        candidato_id: candidate.id,
        match_score: 0,
        analysis: `Error en la comunicación con el servicio de comparación: ${fetchError.message}`,
        recommendation: false,
        error: true,
      });
      continue;
    }
    
    // El objeto comparisonResult ahora debería tener { score, summary, recommendation }
    // y no debería tener una propiedad 'error' si la llamada fue exitosa.
    // Si la API devuelve un error en su JSON, se manejaría arriba.

    // 4. Guardar el resultado en la tabla 'matches'
    const analysisText = `Recomendación: ${comparisonResult.recommendation ? 'Sí' : 'No'}. Resumen: ${comparisonResult.summary}`;

    const { data: savedMatch, error: saveError } = await supabase
      .from('matches')
      .insert({
        job_id: jobId,
        candidato_id: candidate.id,
        match_score: comparisonResult.score,
        analysis: analysisText,
      })
      .select()
      .single();

    if (saveError) {
      console.error(`Error al guardar el match para candidato ${candidate.id} y job ${jobId}:`, saveError);
      allResults.push({
        job_id: jobId,
        candidato_id: candidate.id,
        match_score: comparisonResult.score,
        analysis: analysisText,
        recommendation: comparisonResult.recommendation,
        error: true,
        saveError: saveError.message,
      });
    } else {
      console.log(`Match guardado para candidato ${candidate.id} y job ${jobId}. Score: ${comparisonResult.score}`);
      // Asegurarse de que el objeto 'savedMatch' (que viene de .select() después del insert)
      // se combine con los campos textuales y el booleano para consistencia en 'allResults'.
      // 'savedMatch' contendrá lo que está en la DB (id, job_id, candidato_id, match_score, analysis, created_at).
      allResults.push({
        ...savedMatch,
        summary: comparisonResult.summary, // Añadir para consistencia si se usa antes de recargar
        recommendation_reasoning: comparisonResult.recommendation_reasoning,
        recommendation_decision: comparisonResult.recommendation_decision,
        recommendation: comparisonResult.recommendation, // El booleano
        error: false,
        alreadyExisted: false
      });
    }
  }

  console.log(`Proceso de matching completado para el puesto ${jobId}.`);
  // Ordenar los resultados por 'match_score' descendente antes de devolverlos
  allResults.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  return allResults;
}

// Ejemplo de cómo se podría llamar a esta función:
/*
async function runMatching() {
  const exampleJobId = 'uuid-del-puesto-de-trabajo'; // Reemplazar con un ID de job real de tu DB
  try {
    // Ejemplo con IDs de candidatos específicos:
    // const specificCandidateIds = ['uuid-candidato-1', 'uuid-candidato-2'];
    // const results = await processJobMatches(exampleJobId, specificCandidateIds);

    const results = await processJobMatches(exampleJobId); // Procesa todos o los especificados
    console.log("Resultados finales del matching (ordenados por score):", results);

    results.forEach(result => {
      if (result.error) {
        console.warn(`Hubo un problema con el candidato ${result.candidato_id}: ${result.saveError || result.analysis}`);
      } else if (result.alreadyExisted) {
        console.log(`Candidato: ${result.candidato_id}, Score: ${result.match_score} (ya existía), Recomendado: ${result.recommendation}`);
      }
      else {
        console.log(`Candidato: ${result.candidato_id}, Score: ${result.match_score} (nuevo análisis), Recomendado: ${result.recommendation}`);
      }
    });
  } catch (error) {
    console.error("Error general en el proceso de matching:", error.message);
  }
}

// runMatching(); // Descomentar para probar (asegúrate de tener un jobId válido y la DB configurada)
*/