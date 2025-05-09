import { supabase } from '../lib/supabase';

export const cvService = {
  async uploadCV(file, recruiterId, analysis) {
    try {
      // 1. Subir el archivo al storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `cvs/${recruiterId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Crear el registro del CV
      const { data: cvData, error: cvError } = await supabase
        .from('cvs')
        .insert({
          recruiter_id: recruiterId,
          file_name: fileName,
          file_type: file.type,
          file_path: filePath,
          content: analysis.textoCompleto,
          analysis_result: analysis
        })
        .select()
        .single();

      if (cvError) throw cvError;

      // 3. Crear el registro del candidato
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidatos')
        .insert({
          cv_id: cvData.id,
          recruiter_id: recruiterId,
          name: analysis.nombre,
          email: analysis.email,
          phone: analysis.telefono,
          location: analysis.localidad,
          birth_date: null, // Se podría calcular desde la edad si es necesario
          age: analysis.edad,
          experience: analysis.experiencia,
          skills: analysis.habilidades,
          summary: analysis.resumen
        })
        .select()
        .single();

      if (candidateError) throw candidateError;

      return {
        cv: cvData,
        candidate: candidateData
      };
    } catch (error) {
      console.error('Error en uploadCV:', error);
      throw error;
    }
  },

  async getCVsByRecruiterId(recruiterId) {
    try {
      const { data, error } = await supabase
        .from('cvs')
        .select(`
          *,
          candidatos (*)
        `)
        .eq('recruiter_id', recruiterId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en getCVsByRecruiterId:', error);
      throw error;
    }
  },

  async getCVById(cvId) {
    try {
      const { data, error } = await supabase
        .from('cvs')
        .select(`
          *,
          candidatos (*)
        `)
        .eq('id', cvId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en getCVById:', error);
      throw error;
    }
  },

  async updateCandidate(candidateId, updateData) {
    try {
      const { data, error } = await supabase
        .from('candidatos')
        .update(updateData)
        .eq('id', candidateId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en updateCandidate:', error);
      throw error;
    }
  },

  async deleteCV(cvId) {
    try {
      // 1. Obtener la información del CV para el archivo
      const { data: cvData, error: fetchError } = await supabase
        .from('cvs')
        .select('file_path')
        .eq('id', cvId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Eliminar el archivo del storage
      const { error: storageError } = await supabase.storage
        .from('cvs')
        .remove([cvData.file_path]);

      if (storageError) throw storageError;

      // 3. El candidato se eliminará automáticamente por la restricción ON DELETE CASCADE
      const { error: deleteError } = await supabase
        .from('cvs')
        .delete()
        .eq('id', cvId);

      if (deleteError) throw deleteError;

      return true;
    } catch (error) {
      console.error('Error en deleteCV:', error);
      throw error;
    }
  }
};
