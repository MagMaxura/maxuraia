import { supabase } from '../lib/supabase';

export const cvService = {
  async uploadCV(file, recruiterId, analysis) {
    try {
      // 1. Subir el archivo al storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      // filePath ahora es solo recruiterId/fileName, asumiendo que el bucket es 'cvs'
      const filePath = `${recruiterId}/${fileName}`;

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
          title: analysis.nivel_escolarizacion || "No especificado", // Guardar nivel de escolarización
          email: analysis.email,
          phone: analysis.telefono,
          location: analysis.localidad,
          birth_date: null,
          age: parseInt(analysis.edad, 10) || null, // Asegurar que la edad sea un número o null
          experience: analysis.experiencia,
          // Concatenar habilidades técnicas y blandas en el array 'skills'
          skills: [
            ...(analysis.habilidades?.tecnicas || []),
            ...(analysis.habilidades?.blandas || [])
          ].filter(Boolean), // Filtrar nulos o vacíos si los hubiera
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
  },

  async createJobPost(jobPayload) {
    try {
      console.log("cvService.createJobPost: Recibido payload:", jobPayload);
      // Asegurarse de que recruiter_id esté presente
      if (!jobPayload.recruiter_id) {
        throw new Error("recruiter_id es requerido para crear un puesto.");
      }

      // Preparar el payload para Supabase, asegurando que los tipos coincidan
      // Supabase puede manejar el string JSON directamente para un campo jsonb.
      // keywords se espera como un array de strings si tu columna es text[] o se puede unir si es text.
      // Asumimos que jobPayload.keywords ya es un array de strings.
      // Si tu columna 'keywords' en Supabase es de tipo TEXT, deberías unir el array:
      // keywords: jobPayload.keywords.join(','),
      
      const payloadToInsert = {
        recruiter_id: jobPayload.recruiter_id,
        title: jobPayload.title,
        description: jobPayload.description,
        requirements: jobPayload.requirements, // Supabase maneja el objeto JS para jsonb
        keywords: jobPayload.keywords, // Asumiendo que la columna 'keywords' es text[]
        status: jobPayload.status || 'published', // 'published' por defecto
        // created_at es manejado por Supabase (default now())
      };
      
      console.log("cvService.createJobPost: Enviando a Supabase:", payloadToInsert);

      const { data, error } = await supabase
        .from('jobs')
        .insert([payloadToInsert])
        .select()
        .single(); // Asumimos que queremos el registro insertado de vuelta

      if (error) {
        console.error("cvService.createJobPost: Error de Supabase:", error);
        throw error;
      }

      console.log("cvService.createJobPost: Puesto creado exitosamente:", data);
      return data;
    } catch (error) {
      console.error('Error en cvService.createJobPost:', error.message);
      throw error;
    }
  }
};
