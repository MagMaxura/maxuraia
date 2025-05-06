
import { supabase, getRecruiterByEmail } from "@/lib/supabase";

const STORAGE_KEY = 'auth_user';
const SITE_URL = 'https://employsmartia.com';

// Keep auth object simple, primarily for storing the current user state in memory
// and providing methods that interact with Supabase and local storage.
export const auth = {
  user: null, // In-memory cache of the user

  async login(credentials) {
    // Error handling is crucial here to provide feedback to useAuthService
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
      // Should not happen if signInError is null, but good practice to check
      throw new Error('Usuario no encontrado después del inicio de sesión exitoso');
    }

    // Combine auth user data with recruiter data
    const fullUserData = {
      ...authUser,
      ...recruiterExists, 
    };

    // Update in-memory cache and local storage
    this.user = fullUserData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullUserData));
    
    // Return true or user data upon success if needed by caller, 
    // but the primary update mechanism is the auth state listener.
    return true; 
  },

  async register(userData) {
    // Check if email already exists in reclutadores table
    const { data: existingRecruiter, error: checkError } = await supabase
      .from('reclutadores')
      .select('id', { count: 'exact' }) // Use count for efficiency if just checking existence
      .eq('email', userData.email)
      .maybeSingle(); // maybeSingle is fine, but check for error first

    // Explicitly check for errors during the select query
    if (checkError) {
        console.error('Error checking existing recruiter email:', checkError);
        // Provide a more specific error message if possible, otherwise a generic one
        throw new Error(`Error al verificar el email: ${checkError.message}`);
    }

    if (existingRecruiter) {
      // Consider if this check is still needed if Supabase Auth handles unique emails
      console.warn("Attempted registration with email already in reclutadores table:", userData.email);
      throw new Error('Este email ya pertenece a un reclutador registrado.');
    }

    // Proceed with Supabase Auth signup
    const { data: { user: authUser }, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: { // Data stored in auth.users.raw_user_meta_data
          first_name: userData.firstName,
          last_name: userData.lastName,
        },
        emailRedirectTo: `${SITE_URL}/login` // Redirect after email confirmation
      }
    });

    if (authError) {
      console.error('Supabase Auth signUp error:', authError);
      // Check for specific errors if needed, e.g., email already registered in Auth
      if (authError.message.includes('User already registered')) {
         throw new Error('Este email ya está registrado.');
      }
      throw new Error('Error al crear la cuenta de autenticación.');
    }

    if (!authUser) {
      throw new Error('No se pudo crear el usuario de autenticación.');
    }

    // Now insert into the 'reclutadores' table
    const recruiterData = {
      id: authUser.id, // Use the ID from the created auth user
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      company: userData.company,
      phone: userData.phone, // Use the phone number directly from formData
      phone_country_code: userData.phoneCountryCode, // Add and use the country code from formData
      website: userData.website,
      country_code: userData.country, // This is for the general country, separate from phone code
      industry: userData.industry,
      company_size: userData.companySize,
      marketing_consent: userData.marketingConsent,
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7-day trial
      created_at: new Date().toISOString()
    };

    const { data: insertedRecruiter, error: recruiterInsertError } = await supabase
      .from('reclutadores')
      .insert([recruiterData])
      .select()
      .single(); // Assuming insert returns the created row

    if (recruiterInsertError) {
      console.error('Error inserting into reclutadores table:', recruiterInsertError);
      // IMPORTANT: Attempt to delete the auth user if recruiter insert fails to avoid orphans
      try {
        // This requires Supabase Admin privileges if run from client-side.
        // Consider moving this cleanup logic to a server-side function or handle manually.
        // If running client-side with only anon key, this delete will likely fail.
        // await supabase.auth.admin.deleteUser(authUser.id); 
        console.warn("Failed to insert recruiter data. Corresponding auth user might need manual cleanup:", authUser.id);
      } catch (deleteError) {
         console.error('Failed to delete auth user after recruiter insert failed:', deleteError);
      }
      throw new Error('Error al guardar los datos del reclutador.');
    }

    // Registration successful, auth listener will handle user state update after email confirmation.
    // No need to set this.user or localStorage here as user is not fully active yet.
    return true; // Indicate success to the caller
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      throw error; // Re-throw error to be caught by caller
    }
    // Clear local state after successful sign out
    this.user = null;
    localStorage.removeItem(STORAGE_KEY);
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${SITE_URL}/reset-password`, // URL to redirect to after clicking the link in the email
    });
    
    if (error) {
       console.error('Reset password error:', error);
       throw error; 
    }
    return true; // Indicate success
  },

  // Method to get the current user, attempting to load from storage if not in memory
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
         localStorage.removeItem(STORAGE_KEY); // Clear invalid stored data
         this.user = null;
         return null;
      }
    }
    return null;
  },

  // Method to explicitly clear the user state (used on logout or errors)
  clearAuthUser() {
     this.user = null;
     localStorage.removeItem(STORAGE_KEY);
     console.log("Cleared auth user state and storage.");
  },

  // Expose getRecruiterByEmail for use in the auth service/context
  getRecruiterByEmail: getRecruiterByEmail 
};
