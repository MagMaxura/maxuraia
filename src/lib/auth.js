import { supabase, getRecruiterByEmail } from "./supabase";

const STORAGE_KEY = 'auth_user';
const SITE_URL = 'https://employsmartia.com';

export const auth = {
  user: null,

  async login(credentials) {
    try {
      const recruiterExists = await getRecruiterByEmail(credentials.email);
      if (!recruiterExists) {
        throw new Error('Email no registrado');
      }

      const { data: { user: authUser }, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (signInError) {
        console.error('Auth signIn error:', signInError);
        if (signInError.message.includes('Invalid login credentials')) {
           throw new Error('Credenciales inválidas');
        }
        throw new Error('Error al iniciar sesión');
      }

      if (!authUser) {
        throw new Error('Usuario no encontrado después del inicio de sesión exitoso');
      }

      const fullUserData = {
        ...authUser,
        ...recruiterExists, 
      };

      this.user = fullUserData;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fullUserData));

      // Get the current session to ensure it's properly set
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error getting session after login:', sessionError);
        throw new Error('Error al obtener la sesión');
      }

      if (!session) {
        console.error('No session found after login');
        throw new Error('Error al establecer la sesión');
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(userData) {
    try {
      console.log("auth.js: register - Starting registration process");
      console.log("auth.js: Checking if email exists in reclutadores table");
      
      const { data: existingRecruiter, error: checkError } = await supabase
        .from('reclutadores')
        .select('id', { count: 'exact' })
        .eq('email', userData.email)
        .maybeSingle();

      if (checkError) {
          console.error('auth.js: Error checking existing recruiter email:', checkError);
          throw new Error(`Error al verificar el email: ${checkError.message}`);
      }

      if (existingRecruiter) {
        console.warn("auth.js: Email already exists in reclutadores table:", userData.email);
        throw new Error('Este email ya pertenece a un reclutador registrado.');
      }

      console.log("auth.js: Proceeding with Supabase Auth signup");
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

  getRecruiterByEmail: getRecruiterByEmail 
};
