import { supabase } from '@/lib/supabase'; // Asegurarse de que supabase esté importado

export const cvService = {
  // NOTA: Las implementaciones de las otras funciones (getCVsByRecruiterId, uploadCV, etc.)
  // deben ser completadas si aún son placeholders.

  async getCandidatosConCVsByRecruiterId(recruiterId) { // Renombrado y lógica ajustada
    if (!recruiterId) {
      console.error("cvService.getCandidatosConCVsByRecruiterId: recruiterId es requerido.");
      return [];
    }
    try {
      console.log(`cvService.getCandidatosConCVsByRecruiterId: Querying Supabase candidatos for recruiterId: ${recruiterId}`);
      // Consultar candidatos y traer el CV más reciente asociado (si existe)
      // Esto asume que 'cvs' tiene una columna 'candidate_id' que referencia 'candidatos.id'
      // y que quieres el CV más reciente si hay múltiples.
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
        // Si quieres ordenar los candidatos:
        .order('created_at', { ascending: false });
        // Si quieres ordenar los cvs anidados (Supabase podría no soportar order en anidado directamente en select string así):
        // .order('created_at', { foreignTable: 'cvs', ascending: false }) -> esto es sintaxis inventada
        // La forma de ordenar anidados es más compleja o se hace post-fetch.
        // Por ahora, obtendremos todos los cvs y el frontend puede tomar el más reciente si es necesario.

      if (error) {
        console.error(`cvService.getCandidatosConCVsByRecruiterId: Supabase query error for recruiterId ${recruiterId}:`, JSON.stringify(error, null, 2));
        return [];
      }
      console.log(`cvService.getCandidatosConCVsByRecruiterId: Supabase query successful for recruiterId ${recruiterId}. Data received:`, data);
      if (!data) {
        console.warn(`cvService.getCandidatosConCVsByRecruiterId: Supabase returned null data for recruiterId ${recruiterId}, returning empty array.`);
        return [];
      }
      // Si la relación cvs devuelve un array de cvs por candidato, puede que necesites procesarlo.
      // Por ahora, devolvemos los datos tal cual para que useDashboardData los maneje.
      return data;
    } catch (e) {
      console.error(`cvService.getCandidatosConCVsByRecruiterId: Exception for recruiterId ${recruiterId}:`, e);
      return [];
    }
  },

  async saveCvAndCandidate(analysisData, recruiterId, existingCvId = null, existingCandidateId = null, fileName = 'N/A') {
    console.log("cvService.saveCvAndCandidate: Guardando CV y Candidato. RecruiterId:", recruiterId, "ExistingCvId:", existingCvId, "ExistingCandidateId:", existingCandidateId);
    console.log("Analysis Data:", analysisData);

    if (!recruiterId) {
      throw new Error("Recruiter ID es requerido para guardar CV y candidato.");
    }
    if (!analysisData) {
      throw new Error("AnalysisData es requerida.");
    }

    let candidateId = existingCandidateId;
    let candidateResult = null;

    // Datos del candidato a partir de analysisData
    // Asegúrate de que los nombres de campo coincidan con tu tabla 'candidatos'
    const candidatePayload = {
      recruiter_id: recruiterId, // Asumiendo que candidatos también tiene recruiter_id
      name: analysisData.nombre || analysisData.name,
      email: analysisData.email,
      phone: analysisData.telefono || analysisData.phone,
      location: analysisData.localidad || analysisData.location,
      title: analysisData.tituloActual || analysisData.title || (analysisData.summary ? analysisData.summary.split('.')[0].trim() : null), // Intenta extraer del summary si no hay título
      summary: analysisData.resumen || analysisData.summary,
      // skills: analysisData.habilidades?.tecnicas?.join(', ') + (analysisData.habilidades?.blandas?.length ? ', ' + analysisData.habilidades.blandas.join(', ') : ''), // Ejemplo de cómo podrías guardar skills como texto
      // skills: analysisData.habilidades, // Comentado para reemplazar con la lógica de array
      experience: analysisData.experiencia || analysisData.experience,
      // age: analysisData.edad, // Si tienes un campo 'age'
      // score: analysisData.scoreGeneral, // Si quieres guardar un score general en el candidato
    };

    // Procesamiento para el campo 'skills'
    let skillsArray = [];
    if (analysisData.habilidades && typeof analysisData.habilidades === 'object' && !Array.isArray(analysisData.habilidades)) {
      // Si es un objeto (y no un array directamente), iterar sobre sus valores
      Object.values(analysisData.habilidades).forEach(categoryValue => {
        if (Array.isArray(categoryValue)) {
          // Concatenar solo si los elementos son strings
          skillsArray = skillsArray.concat(categoryValue.filter(skill => typeof skill === 'string'));
        }
      });
    } else if (Array.isArray(analysisData.habilidades)) {
      // Si analysisData.habilidades ya es un array (p.ej. de strings), usarlo directamente
      // Filtrar para asegurar que solo sean strings si esa es la expectativa
      skillsArray = analysisData.habilidades.filter(skill => typeof skill === 'string');
    }
    candidatePayload.skills = skillsArray; // Asignar el array procesado

    // Filtrar propiedades undefined para no enviar nulls innecesarios a Supabase
    for (const key in candidatePayload) {
      if (candidatePayload[key] === undefined) {
        delete candidatePayload[key];
      }
    }
    
    console.log("Payload del candidato (antes de DB op):", JSON.stringify(candidatePayload, null, 2)); // Log detallado

    if (candidateId) {
      console.log(`Actualizando candidato existente ID: ${candidateId}`);
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
      console.log("Candidato actualizado:", candidateResult);
    } else {
      console.log("Creando nuevo candidato...");
      // Asegurarse de que el title se está intentando guardar
      console.log(`Intentando guardar title para nuevo candidato: ${candidatePayload.title}`);
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
      console.log("Nuevo candidato creado:", candidateResult);
    }

    if (!candidateId) {
      throw new Error("No se pudo obtener el ID del candidato después de la operación de inserción/actualización.");
    }

    // Guardar/Actualizar CV
    let cvResult = null;
    const cvPayload = {
      recruiter_id: recruiterId,
      analysis_result: analysisData, // Guardar el objeto de análisis completo
      file_name: fileName,
      content: analysisData.textoCompleto || null, // El texto extraído del CV
      // file_path: filePathFromStorage, // Si se sube a Storage
      // file_url: fileUrlFromStorage,   // Si se sube a Storage
    };

    // Eliminar candidate_id si no existe
    // if (candidateId) {
    //   cvPayload.candidate_id = candidateId;
    // }

    // Filtrar propiedades undefined
    for (const key in cvPayload) {
      if (cvPayload[key] === undefined) {
        delete cvPayload[key];
      }
    }
    console.log("Payload del CV:", cvPayload);

    if (existingCvId) {
      console.log(`Actualizando CV existente ID: ${existingCvId}`);
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
      console.log("CV actualizado:", cvResult);
    } else {
      console.log("Creando nuevo CV...");
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
      console.log("Nuevo CV creado:", cvResult);
    }

    // Actualizar el candidato con el cv_id
    if (cvResult && candidateResult) {
      const { data: updatedCandidate, error: updateError } = await supabase
        .from('candidatos')
        .update({ cv_id: cvResult.id })
        .eq('id', candidateResult.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error al actualizar el candidato con cv_id:", JSON.stringify(updateError, null, 2));
        // Considerar si lanzar el error o continuar
      } else {
        console.log("Candidato actualizado con cv_id:", updatedCandidate);
      }
    }
    
    return { cv: cvResult, candidate: candidateResult };
  },

  // uploadCV ahora puede usar saveCvAndCandidate después de la subida del archivo (si se implementa)
  async uploadCV(file, recruiterId, analysisData, userSubscription) { // Añadir userSubscription
    console.log("cvService.uploadCV: Procesando subida de nuevo CV para recruiterId:", recruiterId, "File:", file.name);
    // Paso 1: Subir archivo a Supabase Storage (Placeholder por ahora)
    // const filePath = `${recruiterId}/${Date.now()}-${file.name}`;
    // const { data: storageData, error: storageError } = await supabase.storage
    //   .from('cv-files') // Nombre de tu bucket de storage
    //   .upload(filePath, file);
    // if (storageError) {
    //   console.error("Error subiendo archivo a Storage:", storageError);
    //   throw storageError;
    // }
    // const fileUrl = supabase.storage.from('cv-files').getPublicUrl(filePath).data.publicUrl;
    // console.log("Archivo subido a Storage:", fileUrl);

    // Por ahora, como la subida a Storage es placeholder, no tenemos file_path ni file_url.
    // Llamamos a saveCvAndCandidate sin existingCvId y sin existingCandidateId.
    try {
      const result = await this.saveCvAndCandidate(analysisData, recruiterId, null, null, file.name);
      console.log("cvService.uploadCV: CV y Candidato guardados en DB:", result);

      // Incrementar el contador de CVs analizados si la suscripción existe
      if (userSubscription?.id) {
        console.log(`cvService.uploadCV: Incrementando contador de CVs para suscripción ID: ${userSubscription.id}`);
        await this.incrementCvAnalysisCount(userSubscription.id);
      }

      return result; // Devuelve { cv: {...}, candidate: {...} }
    } catch (error) {
      console.error("cvService.uploadCV: Error llamando a saveCvAndCandidate:", error);
      // Devolver un objeto de error consistente si es necesario para el frontend
      return {
        error: true,
        message: "Error al guardar CV/Candidato en la base de datos: " + error.message,
        cv: { id: 'temp-cv-id-error', file_name: file.name }, // Placeholder en caso de error
        candidate: { id: 'temp-candidate-id-error' }
      };
    }
  },
  async updateCandidate(candidateId, candidateDataToUpdate, recruiterId) {
    console.log(`cvService.updateCandidate: Actualizando candidato ID: ${candidateId}`);
    if (!candidateId || !candidateDataToUpdate) {
      throw new Error("ID del candidato y datos son requeridos para actualizar.");
    }
    // Asegurar que recruiter_id esté presente si es necesario para la política RLS
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
    console.log("Candidato actualizado en updateCandidate:", data);
    return data;
  },
  
  async deleteCV(cvDatabaseId, candidateDatabaseId) {
    console.log(`cvService.deleteCV: Intentando eliminar. CV ID: ${cvDatabaseId}, Candidato ID: ${candidateDatabaseId}`);
    
    let finalCandidateIdToDelete = candidateDatabaseId;
    let finalCvIdToDelete = cvDatabaseId;

    try {
      // Si no tenemos un cvDatabaseId pero sí un candidateDatabaseId, intentamos obtener el cv_id del candidato
      if (!finalCvIdToDelete && finalCandidateIdToDelete) {
        console.log(`Buscando cv_id para candidato ID: ${finalCandidateIdToDelete}`);
        const { data: candidatoData, error: fetchCandidatoError } = await supabase
          .from('candidatos')
          .select('cv_id')
          .eq('id', finalCandidateIdToDelete)
          .single();

        if (fetchCandidatoError) {
          console.error("Error obteniendo cv_id del candidato:", JSON.stringify(fetchCandidatoError, null, 2));
          // No lanzar error aquí, ya que podríamos proceder solo con la eliminación del candidato
        } else if (candidatoData?.cv_id) {
          finalCvIdToDelete = candidatoData.cv_id;
          console.log(`cv_id encontrado para candidato ${finalCandidateIdToDelete}: ${finalCvIdToDelete}`);
        }
      }

      // Eliminar el CV de la tabla 'cvs' si tenemos un cv_id
      if (finalCvIdToDelete) {
        console.log(`Eliminando CV de la tabla 'cvs' con ID: ${finalCvIdToDelete}`);
        const { error: cvDeleteError } = await supabase
          .from('cvs')
          .delete()
          .eq('id', finalCvIdToDelete);

        if (cvDeleteError) {
          console.error("Error eliminando CV de la base de datos:", JSON.stringify(cvDeleteError, null, 2));
          throw cvDeleteError;
        }
        console.log("CV eliminado exitosamente, ID:", finalCvIdToDelete);
      } else {
        console.warn("No se encontró un CV ID válido para eliminar de la tabla 'cvs'.");
      }

      // Eliminar el candidato de la tabla 'candidatos' si tenemos un candidate_id
      if (finalCandidateIdToDelete) {
        console.log(`Eliminando candidato de la tabla 'candidatos' con ID: ${finalCandidateIdToDelete}`);
        const { error: candidateDeleteError } = await supabase
          .from('candidatos')
          .delete()
          .eq('id', finalCandidateIdToDelete);

        if (candidateDeleteError) {
          console.error("Error eliminando candidato asociado:", JSON.stringify(candidateDeleteError, null, 2));
          throw candidateDeleteError;
        }
        console.log("Candidato asociado eliminado exitosamente, ID:", finalCandidateIdToDelete);
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
    console.log("cvService.createJobPost: Creando puesto con datos:", jobData);
    // Validar que recruiter_id, title y description estén presentes
    if (!jobData || !jobData.recruiter_id || !jobData.title || !jobData.description) {
      console.error("cvService.createJobPost: Faltan datos requeridos (recruiter_id, title, description).");
      throw new Error("Faltan datos requeridos para crear el puesto (título y descripción).");
    }
    // Eliminar ai_generated_description si existe antes de insertar
    const { ai_generated_description, ...dataToInsert } = jobData;
    // No es necesario serializar requirements o keywords si la BD los acepta directamente como JSONB y TEXT[]
    // La validación de formato se hará en Supabase.

    try {
      console.log("cvService.createJobPost: Data to insert into 'jobs' table:", dataToInsert); // Nuevo log
      const { data, error } = await supabase
        .from('jobs') // Asumiendo que la tabla se llama 'jobs'
        .insert([dataToInsert])
        .select() // Para obtener el registro insertado de vuelta
        .single(); // Asumiendo que se inserta un solo registro

      if (error) {
        console.error("Error creando puesto de trabajo en Supabase:", JSON.stringify(error, null, 2));
        // Asegurarse de lanzar un Error con un mensaje útil
        throw new Error(`Supabase error al crear puesto: ${error.message || JSON.stringify(error)}`);
      }
      console.log("Puesto de trabajo creado exitosamente:", data);
      return data; // Devolver el objeto del puesto creado
    } catch (error) {
      console.error("Excepción general en cvService.createJobPost:", error);
      // Asegurarse de lanzar un Error con un mensaje útil
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
        // No lanzar el error, devolver array vacío
        return [];
      }
      console.log("cvService.getJobsByRecruiterId: Puestos obtenidos:", data);
      return data || []; // data puede ser null si no hay resultados, así que || [] asegura un array
    } catch (error) { // Capturar cualquier otra excepción
      console.error("Exception fetching jobs by recruiter ID:", error);
      return []; // Devolver array vacío en caso de excepción
    }
  },

  async updateJobPost(jobId, jobData) {
    console.log(`cvService.updateJobPost: Actualizando puesto ID: ${jobId} con datos:`, jobData);
    if (!jobId || !jobData) {
      console.error("cvService.updateJobPost: jobId y jobData son requeridos.");
      throw new Error("Faltan datos para actualizar el puesto.");
    }
    // Preparar datos para actualizar, asegurando que requirements y keywords sean objetos/arrays vacíos si son nulos/undefined
    // Excluir campos que no deberían ser actualizados directamente o que maneja la BD
    const { recruiter_id, id, created_at, updated_at, ai_generated_description, ...restOfJobData } = jobData;
    
    const dataToUpdate = {
        title: restOfJobData.title,
        description: restOfJobData.description,
        requirements: restOfJobData.requirements || {}, // Asegurar objeto vacío si es nulo/undefined
        keywords: restOfJobData.keywords || [], // Asegurar array vacío si es nulo/undefined
        // Incluir otros campos si los hay en restOfJobData
        ...restOfJobData
    };
    // Limpiar campos que no deben actualizarse si se incluyeron accidentalmente
     delete dataToUpdate.recruiter_id;
     delete dataToUpdate.id;
     delete dataToUpdate.created_at;
     delete dataToUpdate.updated_at;
     delete dataToUpdate.ai_generated_description; // Asegurar exclusión

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
      console.log("Puesto de trabajo actualizado exitosamente:", data);
      return data;
    } catch (error) {
      console.error("Excepción en cvService.updateJobPost:", error);
      throw error;
    }
  },

  async deleteJobPost(jobId) {
    console.log(`cvService.deleteJobPost: Eliminando puesto ID: ${jobId}`);
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
      console.log("Puesto de trabajo eliminado exitosamente, ID:", jobId);
      return { success: true, id: jobId }; // Devolver el ID para facilitar la actualización del estado en el frontend
    } catch (error) {
      console.error("Excepción en cvService.deleteJobPost:", error);
      throw error;
    }
  },

  // Nueva función para reiniciar los contadores de planes de pago único
  async resetOneTimePlanCounters(suscripcionId) {
    if (!suscripcionId) {
      console.error("cvService.resetOneTimePlanCounters: suscripcionId es requerido.");
      throw new Error("ID de suscripción no proporcionado para reiniciar contadores.");
    }
    try {
      console.log(`cvService.resetOneTimePlanCounters: Reiniciando contadores para suscripción ID: ${suscripcionId}`);
      const { data, error } = await supabase
        .from('suscripciones')
        .update({
          cvs_analizados_este_periodo: 0,
          mach_analizados_este_periodo: 0,
          // También podrías actualizar current_period_end para el próximo mes si es un plan recurrente
          // Pero para "pago único" se asume que el período se define por el uso o un bono.
          // Si el "mes" es un concepto fijo, necesitarías una lógica para calcular el próximo period_end.
          // Por ahora, solo reiniciamos los contadores.
        })
        .eq('id', suscripcionId)
        .select()
        .single();

      if (error) {
        console.error("Error al reiniciar contadores de suscripción:", JSON.stringify(error, null, 2));
        throw error;
      }
      console.log("Contadores de suscripción reiniciados exitosamente:", data);
      return data;
    } catch (e) {
      console.error("Excepción en cvService.resetOneTimePlanCounters:", e);
      throw e;
    }
  },

  // Función para incrementar el contador de análisis de CVs (existente)
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
        .select('cvs_analizados_este_periodo') // Devolver el nuevo contador
        .single();

      if (error) {
        console.error("Error incrementing CV analysis count:", JSON.stringify(error, null, 2));
        throw error;
      }
      console.log("CV analysis count incremented. New count:", data?.cvs_analizados_este_periodo);
      return data; // Devuelve { cvs_analizados_este_periodo: nuevo_valor }
    } catch (error) {
      console.error("Exception in incrementCvAnalysisCount:", error);
      throw error;
    }
  }
};

// Si tienes funciones individuales exportadas en lugar de un objeto:
// export async function incrementCvAnalysisCount(suscripcionId) { ... }
// Asegúrate de importar supabase correctamente al inicio del archivo.
// Ejemplo de importación si no está:
// import { supabase } from '../lib/supabase';