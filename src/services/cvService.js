import { supabase } from '@/lib/supabase'; // Asegurarse de que supabase esté importado

export const cvService = {
  // NOTA: Las implementaciones de las otras funciones (getCVsByRecruiterId, uploadCV, etc.)
  // deben ser completadas si aún son placeholders.

  async getCVsByRecruiterId(recruiterId) {
    if (!recruiterId) {
      console.error("cvService.getCVsByRecruiterId: recruiterId es requerido.");
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('cvs') // Asumiendo que la tabla se llama 'cvs'
        .select(`
          *,
          candidatos (
            *
          )
        `)
        .eq('recruiter_id', recruiterId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching CVs by recruiter ID:", error);
      throw error;
    }
  },

  async uploadCV(file, recruiterId, analysisData /*, ...otros campos del candidato */) {
    // Esta función es compleja: implica subir archivo a Storage,
    // insertar en 'candidatos', luego en 'cvs' con el analysis_result.
    // Debería estar implementada con más detalle.
    console.warn("cvService.uploadCV: Implementación placeholder. Necesita desarrollo completo.");
    // Ejemplo básico (incompleto):
    // const { data: fileData, error: fileError } = await supabase.storage.from('cvs').upload(...);
    // const { data: candidate, error: candidateError } = await supabase.from('candidatos').insert(...).select().single();
    // const { data: cv, error: cvError } = await supabase.from('cvs').insert({..., candidate_id: candidate.id, analysis_result: analysisData}).select().single();
    return { cv: { id: 'temp-cv-id', file_name: file.name }, candidate: { id: 'temp-candidate-id' } };
  },

  async updateCandidate(candidateId, candidateData) {
    console.warn("cvService.updateCandidate: Implementación placeholder.");
    // const { data, error } = await supabase.from('candidatos').update(candidateData).eq('id', candidateId).select().single();
    // if (error) throw error;
    // return data;
    return candidateData; // Placeholder
  },
  
  async deleteCV(cvDatabaseId) {
    console.warn("cvService.deleteCV: Implementación placeholder.");
    // Lógica para eliminar de Storage y de la tabla 'cvs' (y 'candidatos' por cascada o explícitamente)
    // const { data: cvData, error: fetchCvError } = await supabase.from('cvs').select('file_path, candidate_id').eq('id', cvDatabaseId).single();
    // await supabase.storage.from('cvs').remove([cvData.file_path]);
    // await supabase.from('cvs').delete().eq('id', cvDatabaseId);
    // await supabase.from('candidatos').delete().eq('id', cvData.candidate_id); // Si no hay cascada
    return { success: true };
  },

  async createJobPost(jobData) {
    console.log("cvService.createJobPost: Creando puesto con datos:", jobData);
    if (!jobData || !jobData.recruiter_id || !jobData.title || !jobData.description) {
      console.error("cvService.createJobPost: Faltan datos requeridos (recruiter_id, title, description).");
      throw new Error("Faltan datos requeridos para crear el puesto.");
    }
    try {
      const { data, error } = await supabase
        .from('jobs') // Asumiendo que la tabla se llama 'jobs'
        .insert([jobData])
        .select() // Para obtener el registro insertado de vuelta
        .single(); // Asumiendo que se inserta un solo registro

      if (error) {
        console.error("Error creando puesto de trabajo:", error);
        throw error;
      }
      console.log("Puesto de trabajo creado exitosamente:", data);
      return data; // Devolver el objeto del puesto creado
    } catch (error) {
      console.error("Excepción en cvService.createJobPost:", error);
      throw error;
    }
  },

  async getJobsByRecruiterId(recruiterId) {
    if (!recruiterId) {
      console.error("cvService.getJobsByRecruiterId: recruiterId es requerido.");
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('jobs') // Asumiendo que la tabla se llama 'jobs'
        .select('*')
        .eq('recruiter_id', recruiterId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log("cvService.getJobsByRecruiterId: Puestos obtenidos:", data);
      return data || [];
    } catch (error) {
      console.error("Error fetching jobs by recruiter ID:", error);
      throw error;
    }
  },

  // Nueva función para incrementar el contador de análisis de CVs
  async incrementCvAnalysisCount(suscripcionId) {
    if (!suscripcionId) {
      console.error("cvService.incrementCvAnalysisCount: suscripcionId es requerido.");
      throw new Error("ID de suscripción no proporcionado.");
    }
    try {
      // Obtener el valor actual primero podría ser más seguro si hay concurrencia,
      // pero para un solo usuario, un incremento directo suele ser suficiente.
      // Supabase no tiene un operador de incremento atómico directo en el cliente JS para RPC o update.
      // La forma más segura es usar una RPC function en Supabase.
      // Alternativa más simple (menos robusta ante concurrencia extrema, pero ok para este caso):
      
      const { data: currentSubscription, error: fetchError } = await supabase
        .from('suscripciones')
        .select('cvs_analizados_este_periodo')
        .eq('id', suscripcionId)
        .single();

      if (fetchError) {
        console.error("Error fetching current CV analysis count:", fetchError);
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
        console.error("Error incrementing CV analysis count:", error);
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
