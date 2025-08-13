import { supabase } from '../lib/supabase'; // Asegurarse de que supabase esté importado
import { sha256 } from '../lib/utils'; // Importar la función de hashing

export const cvService = {
  async getCandidatosConCVsByRecruiterId(recruiterId) {
    if (!recruiterId) {
      console.error("cvService.getCandidatosConCVsByRecruiterId: recruiterId es requerido.");
      return [];
    }
    try {
      console.log(`[cvService] getCandidatosConCVsByRecruiterId: Intentando obtener candidatos para recruiterId: ${recruiterId}`);
      const { data, error } = await supabase
        .from('candidatos')
        .select(`
          *,
          cvs (
            id,
            file_name,
            analysis_result,
            created_at,
            content
          )
        `)
        .eq('recruiter_id', recruiterId)
        .order('created_at', { ascending: false });
      console.log(`[cvService] getCandidatosConCVsByRecruiterId: Resultado de Supabase - Error: ${error ? JSON.stringify(error) : 'null'}, Data length: ${data ? data.length : 'null'}`);

      if (error) {
        console.error(`cvService.getCandidatosConCVsByRecruiterId: Supabase query error for recruiterId ${recruiterId}:`, JSON.stringify(error, null, 2));
        return [];
      }
      if (!data) {
        console.warn(`cvService.getCandidatosConCVsByRecruiterId: Supabase returned null data for recruiterId ${recruiterId}, returning empty array.`);
        return [];
      }
      return data;
    } catch (e) {
      console.error(`cvService.getCandidatosConCVsByRecruiterId: Exception for recruiterId ${recruiterId}:`, e);
      return [];
    }
  },

  async saveCvAndCandidate(analysisData, recruiterId, existingCvId = null, existingCandidateId = null, fileName = 'N/A', contentHash = null) {

    if (!recruiterId) {
      throw new Error("Recruiter ID es requerido para guardar CV y candidato.");
    }
    if (!analysisData) {
      throw new Error("AnalysisData es requerida.");
    }

    let candidateId = existingCandidateId;
    let candidateResult = null;

    const candidatePayload = {
      recruiter_id: recruiterId,
      name: analysisData.nombre || analysisData.name,
      email: analysisData.email,
      phone: analysisData.telefono || analysisData.phone,
      location: analysisData.localidad || analysisData.location,
      title: analysisData.nivel_escolarizacion || analysisData.tituloActual || analysisData.title || (analysisData.summary ? analysisData.summary.split('.')[0].trim() : null),
      summary: analysisData.resumen || analysisData.summary,
      experience: analysisData.experiencia || analysisData.experience,
      notas: analysisData.notas || "", // Asegurar que las notas se inicialicen al crear un candidato
    };

    let skillsArray = [];
    if (analysisData.habilidades && typeof analysisData.habilidades === 'object' && !Array.isArray(analysisData.habilidades)) {
      Object.values(analysisData.habilidades).forEach(categoryValue => {
        if (Array.isArray(categoryValue)) {
          skillsArray = skillsArray.concat(categoryValue.filter(skill => typeof skill === 'string'));
        }
      });
    } else if (Array.isArray(analysisData.habilidades)) {
      skillsArray = analysisData.habilidades.filter(skill => typeof skill === 'string');
    }
    candidatePayload.skills = skillsArray;

    for (const key in candidatePayload) {
      if (candidatePayload[key] === undefined) {
        delete candidatePayload[key];
      }
    }
    

    if (candidateId) {
      const { data, error } = await supabase
        .from('candidatos')
        .update(candidatePayload)
        .eq('id', candidateId)
        .select()
        .single();
      if (error) {
        console.error("Error actualizando candidato:", JSON.stringify(error, null, 2));
        throw error;
      }
      candidateResult = data;
    } else {
      const { data, error } = await supabase
        .from('candidatos')
        .insert(candidatePayload)
        .select()
        .single();
      if (error) {
        console.error("Error creando candidato:", JSON.stringify(error, null, 2));
        throw error;
      }
      candidateResult = data;
      candidateId = candidateResult.id;
    }

    if (!candidateId) {
      throw new Error("No se pudo obtener el ID del candidato después de la operación de inserción/actualización.");
    }

    let cvResult = null;
    const cvPayload = {
      recruiter_id: recruiterId,
      analysis_result: analysisData,
      file_name: fileName,
      content: analysisData.textoCompleto || null,
      content_hash: contentHash, // Añadir el hash del contenido
    };

    for (const key in cvPayload) {
      if (cvPayload[key] === undefined) {
        delete cvPayload[key];
      }
    }
 
     if (existingCvId) {
       const { data, error } = await supabase
         .from('cvs')
         .update(cvPayload)
        .eq('id', existingCvId)
        .select()
        .single();
      if (error) {
        console.error("Error actualizando CV:", JSON.stringify(error, null, 2));
        throw error;
      }
      cvResult = data;
    } else {
      const { data, error } = await supabase
        .from('cvs')
        .insert(cvPayload)
        .select()
        .single();
      if (error) {
        console.error("Error creando CV:", JSON.stringify(error, null, 2));
        throw error;
      }
      cvResult = data;
    }

    if (cvResult && candidateResult) {
      const { data: updatedCandidate, error: updateError } = await supabase
        .from('candidatos')
        .update({ cv_id: cvResult.id })
        .eq('id', candidateResult.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error al actualizar el candidato con cv_id:", JSON.stringify(updateError, null, 2));
      } else {
      }
    }
    
    return { cv: cvResult, candidate: candidateResult };
  },

  async uploadCV(file, recruiterId, analysisData, userSubscription) {
    try {
      const cvContentHash = await sha256(analysisData.textoCompleto || '');

      // 1. Check for existing CV with the same content hash for this recruiter
      const { data: existingCvs, error: cvFetchError } = await supabase
        .from('cvs')
        .select('id, candidate_id')
        .eq('recruiter_id', recruiterId)
        .eq('content_hash', cvContentHash);

      if (cvFetchError) {
        console.error("Error checking for existing CV by hash:", JSON.stringify(cvFetchError, null, 2));
        throw cvFetchError;
      }

      if (existingCvs && existingCvs.length > 0) {
        // Duplicate CV found
        console.log(`Duplicate CV detected for recruiter ${recruiterId} with hash ${cvContentHash}. Returning existing CV.`);
        // Optionally, fetch the full candidate data for the existing CV
        const { data: existingCandidate, error: candidateFetchError } = await supabase
          .from('candidatos')
          .select('*')
          .eq('id', existingCvs[0].candidate_id)
          .single();

        if (candidateFetchError) {
          console.error("Error fetching existing candidate for duplicate CV:", JSON.stringify(candidateFetchError, null, 2));
          // Proceed without candidate data if there's an error fetching it
          return {
            cv: existingCvs[0],
            candidate: null, // Or handle this error more gracefully
            isDuplicate: true,
            message: "CV duplicado detectado."
          };
        }

        return {
          cv: existingCvs[0],
          candidate: existingCandidate,
          isDuplicate: true,
          message: "CV duplicado detectado."
        };
      }

      // If no duplicate CV, proceed to check for existing candidate by email
      let existingCandidate = null;
      if (analysisData.email) {
        const { data: candidates, error: candidateFetchError } = await supabase
          .from('candidatos')
          .select('id')
          .eq('recruiter_id', recruiterId)
          .eq('email', analysisData.email);

        if (candidateFetchError) {
          console.error("Error checking for existing candidate by email:", JSON.stringify(candidateFetchError, null, 2));
          // Do not throw, proceed as if no candidate found
        } else if (candidates && candidates.length > 0) {
          existingCandidate = candidates[0];
        }
      }

      const result = await this.saveCvAndCandidate(
        analysisData,
        recruiterId,
        null, // existingCvId is null as we didn't find a duplicate CV
        existingCandidate ? existingCandidate.id : null, // Pass existing candidate ID if found
        file.name,
        cvContentHash // Pass the content hash to saveCvAndCandidate
      );

      if (userSubscription?.id) {
        await this.incrementCvAnalysisCount(userSubscription.id);
      }

      return result;
    } catch (error) {
      console.error("cvService.uploadCV: Error llamando a saveCvAndCandidate o durante la verificación de duplicados:", error);
      return {
        error: true,
        message: "Error al guardar CV/Candidato en la base de datos: " + error.message,
        cv: { id: 'temp-cv-id-error', file_name: file.name },
        candidate: { id: 'temp-candidate-id-error' }
      };
    }
  },
  async updateCandidate(candidateId, candidateDataToUpdate, recruiterId) {
    if (!candidateId || !candidateDataToUpdate) {
      throw new Error("ID del candidato y datos son requeridos para actualizar.");
    }
    const payload = { ...candidateDataToUpdate };
    if (recruiterId && !payload.recruiter_id) {
        payload.recruiter_id = recruiterId;
    }

    const { data, error } = await supabase
      .from('candidatos')
      .update(payload)
      .eq('id', candidateId)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando candidato en updateCandidate:", JSON.stringify(error, null, 2));
      throw error;
    }
    return data;
  },

  async updateCandidateNotes(candidateId, notes, recruiterId) {
    if (!candidateId || notes === undefined || !recruiterId) {
      throw new Error("ID del candidato, notas y ID del reclutador son requeridos para actualizar las notas.");
    }
    try {
      const { data, error } = await supabase
        .from('candidatos')
        .update({ notas: notes })
        .eq('id', candidateId)
        .eq('recruiter_id', recruiterId) // Asegurar que solo el reclutador propietario pueda actualizar
        .select()
        .single();

      if (error) {
        console.error("Error actualizando notas del candidato en Supabase:", JSON.stringify(error, null, 2));
        throw error;
      }
      console.log("Notas del candidato actualizadas exitosamente:", data); // Log de éxito
      return data;
    } catch (error) {
      console.error("Excepción en cvService.updateCandidateNotes:", error);
      throw error;
    }
  },
  
  async deleteCV(cvDatabaseId, candidateDatabaseId) {
    
    let finalCandidateIdToDelete = candidateDatabaseId;
    let finalCvIdToDelete = cvDatabaseId;

    try {
      if (!finalCvIdToDelete && finalCandidateIdToDelete) {
        const { data: candidatoData, error: fetchCandidatoError } = await supabase
          .from('candidatos')
          .select('cv_id')
          .eq('id', finalCandidateIdToDelete)
          .single();

        if (fetchCandidatoError) {
          console.error("Error obteniendo cv_id del candidato:", JSON.stringify(fetchCandidatoError, null, 2));
        } else if (candidatoData?.cv_id) {
          finalCvIdToDelete = candidatoData.cv_id;
          
        }
      }

      if (finalCvIdToDelete) {
        const { error: cvDeleteError } = await supabase
          .from('cvs')
          .delete()
          .eq('id', finalCvIdToDelete);

        if (cvDeleteError) {
          console.error("Error eliminando CV de la base de datos:", JSON.stringify(cvDeleteError, null, 2));
          throw cvDeleteError;
        }
      } else {
        console.warn("No se encontró un CV ID válido para eliminar de la tabla 'cvs'.");
      }

      if (finalCandidateIdToDelete) {
        const { error: candidateDeleteError } = await supabase
          .from('candidatos')
          .delete()
          .eq('id', finalCandidateIdToDelete);

        if (candidateDeleteError) {
          console.error("Error eliminando candidato asociado:", JSON.stringify(candidateDeleteError, null, 2));
          throw candidateDeleteError;
        }
      } else {
        console.warn("No se encontró un Candidato ID válido para eliminar de la tabla 'candidatos'.");
      }
      
      if (!finalCvIdToDelete && !finalCandidateIdToDelete) {
        throw new Error("No se proporcionó ningún ID válido (CV o Candidato) para eliminar.");
      }

      return { success: true, cvId: finalCvIdToDelete, candidateId: finalCandidateIdToDelete };
    } catch (error) {
      console.error("Excepción en cvService.deleteCV:", error);
      throw error;
    }
  },
  async createJobPost(jobData) {
    if (!jobData || !jobData.recruiter_id || !jobData.title || !jobData.description) {
      console.error("cvService.createJobPost: Faltan datos requeridos (recruiter_id, title, description).");
      throw new Error("Faltan datos requeridos para crear el puesto (título y descripción).");
    }
    const { ai_generated_description, ...dataToInsert } = jobData;
 
     try {
       const { data, error } = await supabase
         .from('jobs')
         .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        console.error("Error creando puesto de trabajo en Supabase:", JSON.stringify(error, null, 2));
        throw new Error(`Supabase error al crear puesto: ${error.message || JSON.stringify(error)}`);
      }
      return data;
    } catch (error) {
      console.error("Excepción general en cvService.createJobPost:", error);
      throw new Error(`Error inesperado al crear puesto: ${error.message || JSON.stringify(error)}`);
    }
  },

  async getJobsByRecruiterId(recruiterId) {
    if (!recruiterId) {
      console.error("cvService.getJobsByRecruiterId: recruiterId es requerido.");
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('recruiter_id', recruiterId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching jobs by recruiter ID:", error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error("Exception fetching jobs by recruiter ID:", error);
      return [];
    }
  },

  async updateJobPost(jobId, jobData) {
    if (!jobId || !jobData) {
      console.error("cvService.updateJobPost: jobId y jobData son requeridos.");
      throw new Error("Faltan datos para actualizar el puesto.");
    }
    const { recruiter_id, id, created_at, updated_at, ai_generated_description, ...restOfJobData } = jobData;
    
    const dataToUpdate = {
        title: restOfJobData.title,
        description: restOfJobData.description,
        requirements: restOfJobData.requirements || {},
        keywords: restOfJobData.keywords || [],
        ...restOfJobData
    };
     delete dataToUpdate.recruiter_id;
     delete dataToUpdate.id;
     delete dataToUpdate.created_at;
     delete dataToUpdate.updated_at;
     delete dataToUpdate.ai_generated_description;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .update(dataToUpdate)
        .eq('id', jobId)
        .select()
        .single();

      if (error) {
        console.error("Error actualizando puesto de trabajo:", JSON.stringify(error, null, 2));
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Excepción en cvService.updateJobPost:", error);
      throw error;
    }
  },

  async deleteJobPost(jobId) {
    if (!jobId) {
      console.error("cvService.deleteJobPost: jobId es requerido.");
      throw new Error("ID del puesto no proporcionado para eliminar.");
    }
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) {
        console.error("Error eliminando puesto de trabajo:", JSON.stringify(error, null, 2));
        throw error;
      }
      return { success: true, id: jobId };
    } catch (error) {
      console.error("Excepción en cvService.deleteJobPost:", error);
      throw error;
    }
  },

  async resetOneTimePlanCounters(suscripcionId) {
    if (!suscripcionId) {
      console.error("cvService.resetOneTimePlanCounters: suscripcionId es requerido.");
      throw new Error("ID de suscripción no proporcionado para reiniciar contadores.");
    }
    try {
      const { data, error } = await supabase
        .from('suscripciones')
        .update({
          cvs_analizados_este_periodo: 0,
          mach_analizados_este_periodo: 0,
        })
        .eq('id', suscripcionId)
        .select()
        .single();

      if (error) {
        console.error("Error al reiniciar contadores de suscripción:", JSON.stringify(error, null, 2));
        throw error;
      }
      return data;
    } catch (e) {
      console.error("Excepción en cvService.resetOneTimePlanCounters:", e);
      throw e;
    }
  },

  async incrementCvAnalysisCount(suscripcionId) {
    if (!suscripcionId) {
      console.error("cvService.incrementCvAnalysisCount: suscripcionId es requerido.");
      throw new Error("ID de suscripción no proporcionado.");
    }
    try {
      const { data: currentSubscription, error: fetchError } = await supabase
        .from('suscripciones')
        .select('cvs_analizados_este_periodo')
        .eq('id', suscripcionId)
        .single();

      if (fetchError) {
        console.error("Error fetching current CV analysis count:", JSON.stringify(fetchError, null, 2));
        throw fetchError;
      }

      if (!currentSubscription) {
        throw new Error("Suscripción no encontrada para incrementar contador.");
      }

      const newCount = (currentSubscription.cvs_analizados_este_periodo || 0) + 1;

      const { data, error } = await supabase
        .from('suscripciones')
        .update({ cvs_analizados_este_periodo: newCount })
        .eq('id', suscripcionId)
        .select('cvs_analizados_este_periodo')
        .single();

      if (error) {
        console.error("Error incrementing CV analysis count:", JSON.stringify(error, null, 2));
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Exception in incrementCvAnalysisCount:", error);
      throw error;
    }
  }
};
