import { supabase } from '../lib/supabase';
import { calculateEffectivePlan } from '../config/plans'; // Importar la función para calcular límites

/**
 * Procesa y guarda las coincidencias entre candidatos seleccionados (o todos) y un puesto de trabajo específico,
 * llamando a una API de backend para la comparación con OpenAI.
 *
 * @param {string} jobId El UUID del puesto de trabajo a procesar.
 * @param {string} recruiterId El UUID del reclutador que inicia el proceso.
 * @param {string[]} [candidateIds] Un array opcional de UUIDs de candidatos a procesar. Si no se provee, se procesarán todos los candidatos.
 * @returns {Promise<Array<object>>} Una promesa que resuelve a un array de los resultados (nuevos o existentes) de la tabla 'matches'.
 * @throws {Error} Si el puesto de trabajo no se encuentra, si el reclutador no tiene suscripción activa o si se excede el límite de macheos.
 */
export async function processJobMatches(jobId, recruiterId, candidateIds = []) {
  if (!jobId) {
    console.error("Error: Se requiere un ID de puesto de trabajo (jobId).");
    throw new Error("Se requiere un ID de puesto de trabajo (jobId).");
  }

  if (!recruiterId) {
    console.error("Error: Se requiere un ID de reclutador (recruiterId).");
    throw new Error("Se requiere un ID de reclutador (recruiterId).");
  }

  if (candidateIds && !Array.isArray(candidateIds)) {
    console.error("Error: candidateIds debe ser un array.");
    throw new Error("candidateIds debe ser un array.");
  }

  // 1. Obtener la suscripción del reclutador
  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from('suscripciones')
    .select('*')
    .eq('recruiter_id', recruiterId)
    .single();

  if (subscriptionError || !subscriptionData) {
    console.error(`Error al obtener la suscripción para el reclutador ${recruiterId}:`, subscriptionError);
    // Lanzar un error más específico si es posible, o el error original de Supabase
    throw new Error(`No se pudo obtener la información de la suscripción del usuario. Detalles: ${subscriptionError?.message || JSON.stringify(subscriptionError)}`);
  }

  const effectiveLimits = calculateEffectivePlan(subscriptionData);

  if (!effectiveLimits.isSubscriptionActive) {
    throw new Error("Su suscripción no está activa. Por favor, active su plan para realizar macheos.");
  }

  const currentMatchCount = subscriptionData.mach_analizados_este_periodo || 0;
  const matchLimit = effectiveLimits.matchLimit;

  if (matchLimit !== Infinity && currentMatchCount >= matchLimit) {
    throw new Error(`Ha alcanzado su límite de ${matchLimit} macheos para este período. Por favor, actualice su plan.`);
  }

  // 2. Obtener los detalles del puesto de trabajo
  const { data: jobData, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, description, requirements, keywords')
    .eq('id', jobId)
    .single();

  if (jobError || !jobData) {
    console.error(`Error al obtener el puesto de trabajo ${jobId}:`, jobError);
    throw new Error(`Puesto de trabajo con ID ${jobId} no encontrado o error al obtenerlo.`);
  }

  // 3. Obtener los candidatos a procesar.
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
  let matchesProcessedInThisRun = 0;

  for (const candidate of candidates) {
    // Verificar si ya existe un match para este candidato y puesto
    const { data: existingMatch, error: existingMatchError } = await supabase
      .from('matches')
      .select('*')
      .eq('job_id', jobId)
      .eq('candidato_id', candidate.id)
      .maybeSingle();

    if (existingMatchError) {
      console.error(`Error al verificar match existente para candidato ${candidate.id} y job ${jobId}:`, existingMatchError);
    }

    if (existingMatch) {
      console.log(`Match ya existente para candidato ${candidate.id} y job ${jobId}. Score: ${existingMatch.match_score}. Omitiendo re-análisis.`);
      const recommendation = existingMatch.analysis && existingMatch.analysis.toLowerCase().includes("recomendación: sí");
      allResults.push({ ...existingMatch, recommendation, alreadyExisted: true, error: false });
      continue;
    }

    // Verificar límite antes de procesar un nuevo macheo
    if (matchLimit !== Infinity && (currentMatchCount + matchesProcessedInThisRun) >= matchLimit) {
      console.warn(`Límite de macheos alcanzado para el reclutador ${recruiterId}. Se detiene el procesamiento.`);
      allResults.push({
        job_id: jobId,
        candidato_id: candidate.id,
        match_score: 0,
        analysis: `Límite de macheos alcanzado para este período.`,
        recommendation: false,
        error: true,
        limitReached: true,
      });
      continue; // Saltar al siguiente candidato si el límite ha sido alcanzado
    }

    let cvTextContent = 'No disponible';
    if (candidate.cvs && candidate.cvs.length > 0) {
      const rawCvContent = candidate.cvs[0].content;
      if (typeof rawCvContent === 'object' && rawCvContent !== null) {
        cvTextContent = JSON.stringify(rawCvContent);
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

    let comparisonResult;
    try {
      const response = await fetch('/api/openai/compareCv', {
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
        analysis: `Error en la comunicación con el servicio de comparación: ${fetchOrApiError.message}`,
        recommendation: false,
        error: true,
      });
      continue;
    }
    
    let decision_text_part = `Decisión de Recomendación: ${comparisonResult.recommendation_decision || 'N/A'}`;
    let reasoning_text_part = comparisonResult.recommendation_reasoning ? `Razonamiento: ${comparisonResult.recommendation_reasoning}` : '';
    let summary_text_part = comparisonResult.summary ? `Resumen General: ${comparisonResult.summary}` : '';

    let parts = [decision_text_part];
    if (reasoning_text_part) parts.push(reasoning_text_part);
    if (summary_text_part) parts.push(summary_text_part);

    let analysisText = parts.reduce((acc, part, index) => {
      if (index === 0) return part;
      if (acc.match(/[.!?]$/)) return `${acc} ${part}`;
      return `${acc}. ${part}`;
    }, '');
    
    if (analysisText && !analysisText.match(/[.!?]$/)) {
        analysisText += '.';
    }

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
      allResults.push({
        ...savedMatch,
        summary: comparisonResult.summary,
        recommendation_reasoning: comparisonResult.recommendation_reasoning,
        recommendation_decision: comparisonResult.recommendation_decision,
        recommendation: comparisonResult.recommendation,
        error: false,
        alreadyExisted: false
      });
      matchesProcessedInThisRun++; // Incrementar el contador solo para nuevos macheos
    }
  }

  // Actualizar el contador de macheos en la suscripción del usuario
  if (matchesProcessedInThisRun > 0) {
    const { error: updateSubscriptionError } = await supabase
      .from('suscripciones')
      .update({ mach_analizados_este_periodo: currentMatchCount + matchesProcessedInThisRun })
      .eq('recruiter_id', recruiterId);

    if (updateSubscriptionError) {
      console.error(`Error al actualizar el contador de macheos para el reclutador ${recruiterId}:`, updateSubscriptionError);
      // No lanzar error fatal aquí, ya que los macheos ya se guardaron.
    } else {
      console.log(`Contador de macheos actualizado para el reclutador ${recruiterId}. Nuevos macheos: ${matchesProcessedInThisRun}. Total: ${currentMatchCount + matchesProcessedInThisRun}`);
    }
  }

  console.log(`Proceso de matching completado para el puesto ${jobId}.`);
  allResults.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  return allResults;
}