// Asumiendo que cvService.js ya tiene la importación de supabase
// import { supabase } from '@/lib/supabase'; // Asegúrate de que esto esté o adáptalo

export const cvService = {
  // ... (otras funciones existentes como getCVsByRecruiterId, createJobPost, etc.) ...

  async getCVsByRecruiterId(recruiterId) {
    // ... (código existente) ...
  },

  async uploadCV(file, recruiterId, analysisData) {
    // ... (código existente) ...
  },

  async updateCandidate(candidateId, candidateData) {
    // ... (código existente) ...
  },
  
  async deleteCV(cvDatabaseId) {
    // ... (código existente) ...
  },

  async createJobPost(jobData) {
    // ... (código existente) ...
  },

  async getJobsByRecruiterId(recruiterId) {
    // ... (código existente) ...
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
