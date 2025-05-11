import { supabase } from '../lib/supabase';

export const cvService = {
  async uploadCV(file, recruiterId, analysis) {
    try {
      // 1. Subir el archivo al storage
      const fileExt = file.name.split('.').pop();
      // Sanitizar el nombre del candidato para usarlo en el nombre del archivo
      const candidateNameSanitized = (analysis.nombre || "candidato_desconocido")
        .toLowerCase()
        .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
        .replace(/[^a-z0-9_.-]/g, ''); // Eliminar caracteres no alfanuméricos excepto _, ., -
      
      const fileName = `${candidateNameSanitized}_${Date.now()}.${fileExt}`;
      // filePath ahora es solo recruiterId/fileName, asumiendo que el bucket es 'cvs'
      const filePath = `${recruiterId}/${fileName}`;
      console.log("cvService: Nuevo fileName para storage:", fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Crear el registro del CV

      // Función para sanitizar strings eliminando caracteres nulos
      const sanitizeString = (str) => (typeof str === 'string' ? str.replace(/\u0000/g, '') : str);

      // Sanitizar los campos de texto principales del objeto analysis
      const sanitizedAnalysis = {
        ...analysis,
        nombre: sanitizeString(analysis.nombre),
        localidad: sanitizeString(analysis.localidad),
        email: sanitizeString(analysis.email),
        telefono: sanitizeString(analysis.telefono),
        nivel_escolarizacion: sanitizeString(analysis.nivel_escolarizacion),
        resumen: sanitizeString(analysis.resumen),
        experiencia: sanitizeString(analysis.experiencia),
        textoCompleto: sanitizeString(analysis.textoCompleto), // Muy importante para el campo 'content'
        habilidades: {
          tecnicas: Array.isArray(analysis.habilidades?.tecnicas) ? analysis.habilidades.tecnicas.map(sanitizeString) : [],
          blandas: Array.isArray(analysis.habilidades?.blandas) ? analysis.habilidades.blandas.map(sanitizeString) : [],
        }
      };
      
      // También sanitizar el texto completo que va al campo 'content'
      const sanitizedContent = sanitizeString(analysis.textoCompleto);

      const { data: cvData, error: cvError } = await supabase
        .from('cvs')
        .insert({
          recruiter_id: recruiterId,
          file_name: fileName,
          file_type: file.type,
          file_path: filePath,
          content: sanitizedContent, // Usar contenido sanitizado
          analysis_result: sanitizedAnalysis // Usar análisis sanitizado
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
          name: sanitizedAnalysis.nombre,
          title: sanitizedAnalysis.nivel_escolarizacion || "No especificado",
          email: sanitizedAnalysis.email,
          phone: sanitizedAnalysis.telefono,
          location: sanitizedAnalysis.localidad,
          birth_date: null,
          age: parseInt(sanitizedAnalysis.edad, 10) || null,
          experience: sanitizedAnalysis.experiencia,
          skills: [
            ...(sanitizedAnalysis.habilidades?.tecnicas || []),
            ...(sanitizedAnalysis.habilidades?.blandas || [])
          ].filter(Boolean),
          summary: sanitizedAnalysis.resumen
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
  },

  async getJobsByRecruiterId(recruiterId) {
    if (!recruiterId) {
      console.warn("getJobsByRecruiterId: recruiterId no proporcionado.");
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*') // Seleccionar todos los campos del puesto
        .eq('recruiter_id', recruiterId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error en getJobsByRecruiterId:', error);
        throw error;
      }
      console.log("cvService.getJobsByRecruiterId: Puestos obtenidos:", data);
      return data || [];
    } catch (error) {
      console.error('Error al obtener puestos de trabajo:', error.message);
      throw error;
    }
  }
};
