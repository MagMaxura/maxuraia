import { createClient } from '@supabase/supabase-js'; // Importar createClient

// Inicializar Supabase para el entorno de backend
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // O SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getAuthUser(req) {
  try {
    // Supabase Auth en el servidor puede obtener la sesión del usuario
    // a partir de los encabezados de la solicitud (ej. Authorization: Bearer <token>)
    const { data: { user }, error } = await supabase.auth.getUser(req.headers.authorization?.split(' ')[1]);

    if (error) {
      console.error('Error getting authenticated user from Supabase:', error);
      return { user: null, error };
    }

    if (!user) {
      return { user: null, error: new Error('No authenticated user found.') };
    }

    return { user, error: null };
  } catch (error) {
    console.error('Unexpected error in getAuthUser:', error);
    return { user: null, error: new Error('Failed to get authenticated user.') };
  }
}