import { supabase, getRecruiterByEmail } from "./supabase";

const STORAGE_KEY = 'auth_user';
const SITE_URL = 'https://employsmartia.com';

export const auth = {
  user: null,

  async login(credentials) {
    console.log("auth.js: login - Attempting login for:", credentials.email);
    let authUser = null;
    try {
      // 1. Intentar iniciar sesión
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (signInError) {
        console.error('auth.js: Supabase signIn error:', signInError);
        // Verificar errores específicos
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Credenciales inválidas');
        }
        if (signInError.message.includes('Email not confirmed')) {
          // Podríamos necesitar verificar el código de error exacto de Supabase si este mensaje cambia
          throw new Error('Usuario aún no validado. Revisa tu correo para confirmar.');
        }
        // Otro error durante el signIn
        throw new Error(`Error de autenticación: ${signInError.message}`);
      }

      if (!signInData || !signInData.user) {
        console.error('auth.js: No user data returned after successful signIn');
        throw new Error('Error inesperado durante el inicio de sesión.');
      }
      
      authUser = signInData.user;
      console.log("auth.js: Login successful for user ID:", authUser.id);

      // 2. Verificar si el perfil existe en 'reclutadores'
      console.log("auth.js: Checking for recruiter profile for user ID:", authUser.id);
      const profile = await this.getRecruiterProfile(authUser.id); // Usar la función que ya creamos

      const profileExists = !!profile;
      console.log("auth.js: Profile exists:", profileExists);

      // 3. (Opcional pero recomendado) Combinar datos y guardar en localStorage si es necesario
      //    Si tu app depende de datos del perfil inmediatamente después del login,
      //    puedes obtenerlos aquí. Por ahora, solo necesitamos saber si existe.
      //    El hook useAuthService ya maneja el estado del usuario de autenticación.
      // const fullUserData = profile ? { ...authUser, ...profile } : authUser;
      // localStorage.setItem(STORAGE_KEY, JSON.stringify(fullUserData)); // Considera si esto es necesario aquí o lo maneja el hook

      // 4. Devolver estado de login y perfil
      return { success: true, profileExists: profileExists, user: authUser };

    } catch (error) {
      console.error('auth.js: Login process error:', error);
      // Asegurarse de que el usuario esté deslogueado si el proceso falla a mitad de camino
      if (authUser) { // Si el signIn funcionó pero el chequeo de perfil falló
         // Podrías decidir si mantenerlo logueado o no. Por seguridad, desloguear podría ser mejor.
         // await this.logout(); // Descomentar si quieres desloguear en caso de error post-signIn
      }
      // Devolver el error para que el componente lo maneje
      // Asegurarse de que el mensaje de error sea útil (ya lo es si viene del throw)
      return { success: false, error: error.message || "Error desconocido en el inicio de sesión." };
    }
  },

  async register(userData) {
    try {
      console.log("auth.js: register - Starting registration process");
      // Eliminamos la verificación manual de email existente en 'reclutadores'.
      // supabase.auth.signUp() ya maneja la unicidad del email en 'auth.users'.
      
      console.log("auth.js: Proceeding with Supabase Auth signup for email:", userData.email);
      const { data: { user: authUser }, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
          },
          emailRedirectTo: `${SITE_URL}/auth/callback`
        }
      });

      if (authError) {
        console.error('auth.js: Supabase Auth signUp error:', authError);
        if (authError.message.includes('User already registered')) {
           throw new Error('Este email ya está registrado.');
        }
        throw new Error('Error al crear la cuenta de autenticación.');
      }

      if (!authUser) {
        console.error('auth.js: No auth user returned after successful signup');
        throw new Error('No se pudo crear el usuario de autenticación.');
      }

      // NUEVO LOG PARA DIAGNÓSTICO
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('auth.js: Error getting session immediately after signup:', sessionError);
      } else if (sessionData.session) {
        console.log('auth.js: Session active immediately after signup. User ID:', sessionData.session.user.id);
        console.log('auth.js: Token:', sessionData.session.access_token ? 'Exists' : 'DOES NOT EXIST');
      } else {
        console.warn('auth.js: No active session found immediately after signup.');
      }
      // FIN NUEVO LOG

      // El usuario ha sido creado en auth.users.
      // La inserción en la tabla 'reclutadores' se hará después de la confirmación del email.
      console.log("auth.js: Supabase Auth signUp successful. User created with ID:", authUser.id);
      console.log("auth.js: User needs to confirm email before profile data is saved.");
      
      // Devolvemos el usuario de autenticación para que el frontend pueda decidir cómo proceder
      // (por ejemplo, almacenar datos del perfil temporalmente y mostrar mensaje de confirmación).
      return { user: authUser, needsEmailConfirmation: true };

    } catch (error) {
      console.error("auth.js: Registration error (during signUp):", error);
      throw error; // Re-throw the error to be caught by the caller
    }
  },

  async saveRecruiterProfile(profileData) {
    console.log("auth.js: saveRecruiterProfile - Attempting to save recruiter profile data");
    
    // Asegurarse de que el usuario esté autenticado
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('auth.js: No active session found. Cannot save recruiter profile.', sessionError);
      throw new Error('Usuario no autenticado. No se puede guardar el perfil.');
    }

    if (profileData.id !== session.user.id) {
      console.error('auth.js: Profile ID does not match authenticated user ID. Aborting save.');
      throw new Error('Conflicto de ID de usuario. No se puede guardar el perfil.');
    }
    
    const recruiterDataToInsert = {
      ...profileData, // Asume que profileData ya tiene el formato correcto para la tabla reclutadores
      trial_ends_at: profileData.trial_ends_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: profileData.created_at || new Date().toISOString()
    };

    // Eliminar campos que no deberían estar en la tabla reclutadores si vienen de un formulario más grande
    delete recruiterDataToInsert.password;
    delete recruiterDataToInsert.confirmPassword;
    // Si 'email' ya está en auth.users y no quieres duplicarlo o es manejado por la FK, considera su manejo.
    // Por ahora, lo incluimos asumiendo que la tabla reclutadores tiene una columna email.

    console.log("auth.js: Inserting recruiter profile data:", recruiterDataToInsert);
    const { data: insertedRecruiter, error: recruiterInsertError } = await supabase
      .from('reclutadores')
      .insert([recruiterDataToInsert])
      .select()
      .single();

    if (recruiterInsertError) {
      console.error('auth.js: Error inserting recruiter profile into reclutadores table:', recruiterInsertError);
      throw new Error('Error al guardar los datos del perfil del reclutador.');
    }

    console.log("auth.js: Recruiter profile data saved successfully:", insertedRecruiter);
    return insertedRecruiter;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      throw error;
    }
    this.user = null;
    localStorage.removeItem(STORAGE_KEY);
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${SITE_URL}/auth/callback?type=recovery`,
    });
    
    if (error) {
       console.error('Reset password error:', error);
       throw error; 
    }
    return true;
  },

  getCurrentUser() {
    if (this.user) {
      return this.user;
    }
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
        return this.user;
      } catch (e) {
         console.error("Failed to parse stored user data:", e);
         localStorage.removeItem(STORAGE_KEY);
         this.user = null;
         return null;
      }
    }
    return null;
  },

  clearAuthUser() {
     this.user = null;
     localStorage.removeItem(STORAGE_KEY);
     console.log("Cleared auth user state and storage.");
  },

  async getRecruiterProfile(userId) {
    if (!userId) {
      console.error("auth.js: getRecruiterProfile - userId is required.");
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('reclutadores')
        .select('id') // Solo necesitamos saber si existe
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('auth.js: Error fetching recruiter profile by ID:', error);
        throw error; // O manejar el error de otra forma
      }
      console.log("auth.js: getRecruiterProfile - Profile check result for", userId, ":", data);
      return data; // Devuelve el objeto {id: ...} si existe, o null si no existe
    } catch (error) {
      console.error('auth.js: Exception in getRecruiterProfile:', error);
      return null; // O re-lanzar el error
    }
  },

  getRecruiterByEmail: getRecruiterByEmail
};
