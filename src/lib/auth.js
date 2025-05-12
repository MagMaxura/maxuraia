import { supabase, getRecruiterByEmail } from "./supabase";

const STORAGE_KEY = 'auth_user';
const SITE_URL = 'https://www.employsmartia.com'; // Asegurar consistencia con el dominio canónico y certificado SSL

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
      // Llamar explícitamente a auth.getRecruiterProfile en lugar de this.getRecruiterProfile
      let profile = await auth.getRecruiterProfile(authUser.id); // Esto ahora devuelve el perfil completo o null
      let profileExists = !!profile;
      // Un perfil se considera incompleto si 'company' o 'first_name' tienen el placeholder
      let profileIsComplete = profileExists && profile.company !== "LLENAR POR EL USUARIO" && profile.first_name !== "LLENAR POR EL USUARIO";
      
      console.log("auth.js: Initial profile check. Profile data:", profile);
      console.log("auth.js: Profile exists:", profileExists, "Is complete:", profileIsComplete);
      console.log("auth.js: Checking conditions for profile creation: email_confirmed_at:", authUser.email_confirmed_at, "!profileExists:", !profileExists);

      // Si el usuario está confirmado pero el perfil no existe, crearlo ahora
      if (authUser.email_confirmed_at && !profileExists) {
        console.log("auth.js: CONDITION MET - User confirmed but no profile. Attempting to create basic profile...");
        try {
          const basicProfileData = {
            id: authUser.id,
            email: authUser.email,
            // Los placeholders se añaden en saveRecruiterProfile
          };
          const newProfile = await auth.saveRecruiterProfile(basicProfileData); // INSERT
          if (newProfile) {
            console.log("auth.js: Basic profile created successfully during login flow.");
            profileExists = true;
            profileIsComplete = false; // Recién creado, necesita completarse
            profile = newProfile; // Actualizar la variable de perfil local
          } else {
             console.error("auth.js: Failed to create basic profile during login flow (saveRecruiterProfile returned null/undefined).");
             profileExists = false;
             profileIsComplete = false;
          }
        } catch (insertError) {
          console.error("auth.js: Error creating basic profile during login flow:", insertError);
          profileExists = false;
          profileIsComplete = false;
        }
      }
      
      // 4. Devolver estado de login, si el perfil existe y si está completo
      return { success: true, profileExists: profileExists, profileIsComplete: profileIsComplete, user: authUser };

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
      
      // Log para verificar si la llamada a signUp retorna
      console.log("[DEBUG] supabase.auth.signUp finished. Error:", authError, "User:", authUser);

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
    
    const placeholderText = "LLENAR POR EL USUARIO";
    const recruiterDataToInsert = {
      id: profileData.id, // Viene de authUser.id
      email: profileData.email, // Viene de authUser.email
      company: profileData.company || placeholderText,
      first_name: profileData.first_name || placeholderText,
      last_name: profileData.last_name || placeholderText,
      // Otros campos que podrían ser NOT NULL y no vienen en el basicProfileData
      // phone: profileData.phone || null, // O un placeholder si es NOT NULL
      // website: profileData.website || null,
      // country_code: profileData.country_code || null,
      // industry: profileData.industry || null,
      // company_size: profileData.company_size || null,
      // marketing_consent: profileData.marketing_consent !== undefined ? profileData.marketing_consent : false,
      trial_ends_at: profileData.trial_ends_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: profileData.created_at || new Date().toISOString()
    };

    // Eliminar campos que no deberían estar en la tabla reclutadores si vienen de un formulario más grande
    delete recruiterDataToInsert.password;
    delete recruiterDataToInsert.confirmPassword;
    // Si 'email' ya está en auth.users y no quieres duplicarlo o es manejado por la FK, considera su manejo.
    // Por ahora, lo incluimos asumiendo que la tabla reclutadores tiene una columna email.

    console.log("auth.js: [LOG] saveRecruiterProfile - Attempting INSERT with data:", recruiterDataToInsert);
    const { data: insertedRecruiter, error: recruiterInsertError } = await supabase
      .from('reclutadores')
      .insert([recruiterDataToInsert])
      .select()
      .single();

    if (recruiterInsertError) {
      console.error('auth.js: [LOG] Error during INSERT in saveRecruiterProfile. Details:', JSON.stringify(recruiterInsertError, null, 2));
      console.error('auth.js: [LOG] Failed data for INSERT:', JSON.stringify(recruiterDataToInsert, null, 2));
      throw new Error(`Error al guardar perfil inicial: ${recruiterInsertError.message}`);
    }

    console.log("auth.js: [LOG] saveRecruiterProfile - INSERT successful. Result:", insertedRecruiter);

    // Después de crear el perfil del reclutador, crear una suscripción de prueba por defecto
    if (insertedRecruiter) {
      const defaultPlanId = 'trial'; // O 'basico', según tu lógica de negocio
      const trialDays = 7;
      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + trialDays);

      const defaultSubscription = {
        recruiter_id: insertedRecruiter.id,
        plan_id: defaultPlanId,
        status: 'trialing', // O 'active' si 'basico' no tiene trial
        trial_ends_at: trialEnds.toISOString(),
        // current_period_start y current_period_end pueden ser null o definirse si es necesario
        // created_at y updated_at se manejarán por defecto en la BD si están configurados
      };

      console.log("auth.js: Attempting to create default subscription:", defaultSubscription);
      const { data: newSubscription, error: subError } = await supabase
        .from('suscripciones')
        .insert([defaultSubscription])
        .select()
        .single();

      if (subError) {
        console.error("auth.js: Error creating default subscription:", subError);
        // No lanzar error aquí para no interrumpir el flujo de creación de perfil,
        // pero sí loguearlo. El usuario tendrá perfil pero no suscripción.
        // Se podría reintentar o manejar administrativamente.
      } else {
        console.log("auth.js: Default subscription created successfully:", newSubscription);
        // Opcional: añadir la suscripción al objeto insertedRecruiter antes de devolverlo
        // insertedRecruiter.suscripcion = newSubscription;
      }
    }
    return insertedRecruiter; // Devolver el perfil del reclutador
  },

  async updateRecruiterProfile(userId, profileData) {
    console.log("auth.js: updateRecruiterProfile - Attempting to update profile for user:", userId);
    
    // No necesitamos verificar la sesión aquí, ya que se asume que CompleteProfile es una ruta protegida
    // y la llamada vendrá de un usuario autenticado. La RLS se encargará de la seguridad.

    // Preparamos los datos para actualizar. Excluimos 'id' y 'email' si no queremos que se actualicen.
    // También excluimos campos que no existen en la tabla reclutadores.
    // Revertir la prueba y usar la lógica original para preparar dataToUpdate
    const { id, email, created_at, trial_ends_at, ...dataToUpdate } = profileData;
    // Asegúrate de que todos los campos en dataToUpdate (que vienen de CompleteProfile.jsx
    // ya mapeados a snake_case) existan como columnas en tu tabla reclutadores.

    console.log("auth.js: [LOG] updateRecruiterProfile - Attempting UPDATE for userId:", userId, "with data:", dataToUpdate);
    const { data: updatedRecruiter, error: recruiterUpdateError } = await supabase
      .from('reclutadores')
      .update(dataToUpdate)
      .eq('id', userId)
      .select(); // Añadir select() para obtener la fila actualizada o un error si no se encuentra/permite

    if (recruiterUpdateError) {
      console.error('auth.js: [LOG] Error during UPDATE in updateRecruiterProfile. Details:', JSON.stringify(recruiterUpdateError, null, 2));
      console.error('auth.js: [LOG] Failed data for UPDATE:', JSON.stringify(dataToUpdate, null, 2));
      throw new Error(`Error al actualizar perfil: ${recruiterUpdateError.message}`);
    }
    
    // Verificar si la actualización realmente devolvió datos (es decir, encontró y actualizó una fila)
    if (!updatedRecruiter || updatedRecruiter.length === 0) {
      console.warn("auth.js: [LOG] updateRecruiterProfile - UPDATE operation did not return data, possibly no matching row or RLS issue. UserID:", userId);
      // Podrías lanzar un error aquí si esperas que siempre se actualice una fila.
      // throw new Error('No se encontró el perfil para actualizar o la actualización fue denegada.');
    } else {
      console.log("auth.js: [LOG] updateRecruiterProfile - UPDATE successful. Result:", updatedRecruiter);
    }
    // Ya no devolvemos los datos actualizados, solo indicamos éxito implícito (sin error)
    return true; // O devolver void
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
    console.log("[DEBUG] Entering getRecruiterProfile for userId:", userId); // Log al entrar
    if (!userId) {
      console.error("auth.js: getRecruiterProfile - userId is required.");
      return null;
    }
    try {
      console.log("[DEBUG] Attempting SELECT query in getRecruiterProfile...");
      // Seleccionar todos los campos para poder verificar el contenido
      const { data: recruiterProfile, error: recruiterError } = await supabase
        .from('reclutadores')
        .select('*') // Seleccionar todos los campos
        .eq('id', userId)
        .maybeSingle(); // Devuelve el objeto o null si no se encuentra

      console.log("[DEBUG] Recruiter profile query finished. Error:", recruiterError, "Data:", recruiterProfile);

      if (recruiterError) {
        console.error('auth.js: Error fetching recruiter profile by ID:', recruiterError);
        throw recruiterError;
      }

      if (!recruiterProfile) {
        // Si no hay perfil de reclutador, no tiene sentido buscar suscripción.
        return null;
      }

      // Ahora, obtener la suscripción activa del reclutador
      console.log("[DEBUG] Attempting to fetch active subscription for recruiterId:", userId);
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('recruiter_id', userId)
        // Queremos la suscripción activa o en trial más reciente.
        // Podríamos filtrar por status 'active' o 'trialing' y luego ordenar.
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false }) // Tomar la más reciente si hay varias activas/trial
        .limit(1) // Solo necesitamos una
        .maybeSingle(); // Puede que no tenga ninguna suscripción activa

      console.log("[DEBUG] Subscription query finished. Error:", subscriptionError, "Data:", subscriptionData);

      if (subscriptionError) {
        console.error('auth.js: Error fetching subscription:', subscriptionError);
        // Decidir si lanzar el error o solo devolver el perfil sin suscripción.
        // Por ahora, logueamos el error y continuamos, el perfil podría existir sin suscripción activa.
      }
      
      // Combinar el perfil del reclutador con su suscripción (si existe)
      return {
        ...recruiterProfile,
        suscripcion: subscriptionData || null // Añadir la info de suscripción al objeto del perfil
      };
    } catch (error) {
      console.error('auth.js: Exception in getRecruiterProfile:', error);
      return null; // O re-lanzar el error
    }
  },

  getRecruiterByEmail: getRecruiterByEmail
};
