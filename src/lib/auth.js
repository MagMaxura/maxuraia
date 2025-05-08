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

      console.log("auth.js: Auth signup successful, proceeding to insert recruiter data");
      const recruiterData = {
        id: authUser.id,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        company: userData.company,
        phone: userData.phone,
        phone_country_code: userData.phoneCountryCode,
        website: userData.website,
        country_code: userData.country,
        industry: userData.industry,
        company_size: userData.companySize,
        marketing_consent: userData.marketingConsent,
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      };

      console.log("auth.js: Inserting recruiter data:", recruiterData);
      const { data: insertedRecruiter, error: recruiterInsertError } = await supabase
        .from('reclutadores')
        .insert([recruiterData])
        .select()
        .single();

      if (recruiterInsertError) {
        console.error('auth.js: Error inserting into reclutadores table:', recruiterInsertError);
        try {
          console.warn("auth.js: Failed to insert recruiter data. Auth user might need cleanup:", authUser.id);
          // Don't try to delete the auth user, as they need to verify their email
        } catch (deleteError) {
           console.error('auth.js: Failed to delete auth user after recruiter insert failed:', deleteError);
        }
        throw new Error('Error al guardar los datos del reclutador.');
      }

      console.log("auth.js: Registration completed successfully");
      return true;
    } catch (error) {
      console.error("auth.js: Registration error:", error);
      throw error; // Re-throw the error to be caught by the caller
    }
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
