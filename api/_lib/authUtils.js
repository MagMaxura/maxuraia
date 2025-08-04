import { supabase } from '../../src/lib/supabase'; // Asegúrate de que esta ruta sea correcta para el entorno de Vercel

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