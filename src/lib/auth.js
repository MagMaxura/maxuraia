import { supabase, getRecruiterByEmail } from "./supabase";
import { APP_PLANS } from '../config/plans'; // Importar APP_PLANS - Forzar reevaluación

const STORAGE_KEY = 'auth_user';
const SITE_URL = 'https://www.employsmartia.com'; // Asegurar consistencia con el dominio canónico y certificado SSL

export const auth = {
  user: null,

  async login(credentials) {
    console.debug("auth.js: login - Attempting login for:", credentials.email);
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
      console.debug("auth.js: Login successful for user ID:", authUser.id);

      // 2. Verificar si el perfil existe en 'reclutadores'
      console.debug("auth.js: Checking for recruiter profile for user ID:", authUser.id);
      // Llamar explícitamente a auth.getRecruiterProfile en lugar de this.getRecruiterProfile
      let profile = await auth.getRecruiterProfile(authUser.id); // Esto ahora devuelve el perfil completo o null
      let profileExists = !!profile;
      // Un perfil se considera incompleto si 'company' o 'first_name' tienen el placeholder
      let profileIsComplete = profileExists && profile.company !== "LLENAR POR EL USUARIO" && profile.first_name !== "LLENAR POR EL USUARIO";
      
      console.debug("auth.js: Initial profile check. Profile data:", profile);
      console.debug("auth.js: Profile exists:", profileExists, "Is complete:", profileIsComplete);
      console.debug("auth.js: Checking conditions for profile creation: email_confirmed_at:", authUser.email_confirmed_at, "!profileExists:", !profileExists);

      // Si el perfil existe pero no tiene una suscripción activa o puntual, intentar crear una de prueba
      // O si tiene una suscripción pero no es de tipo mensual ni puntual (ej. solo trial expirado)
      if (profileExists && (!profile.suscripcion || (!profile.suscripcion.current_plan && !profile.suscripcion.one_time_plan))) {
        console.debug("auth.js: Profile exists but no active monthly/one-time subscription found. Attempting to create/update trial subscription.");
        try {
          const defaultPlanId = 'trial';
          const trialDays = 7;
          const trialEnds = new Date();
          trialEnds.setDate(trialEnds.getDate() + trialDays);

          // Obtener los límites del plan trial desde APP_PLANS
          const trialPlanDetails = APP_PLANS[defaultPlanId];
          const trialCvLimit = trialPlanDetails?.cvLimit || 0;
          const trialJobLimit = trialPlanDetails?.jobLimit || 0;

          const defaultSubscription = {
            recruiter_id: authUser.id,
            plan_id: defaultPlanId,
            status: 'trialing',
            trial_ends_at: trialEnds.toISOString(),
          };

          const { data: newSubscription, error: subError } = await supabase
            .from('suscripciones')
            .upsert({
              recruiter_id: authUser.id,
              plan_id: defaultPlanId,
              status: 'trialing',
              trial_ends_at: trialEnds.toISOString(),
              current_period_start: new Date().toISOString(),
              current_period_end: trialEnds.toISOString(), // Para que el trial tenga un período definido
              cvs_analizados_este_periodo: 0,
              jobs_creados_este_periodo: 0,
              CV_Max_plan: trialCvLimit, // Establecer límites del trial
              Jobs_Max_plan: trialJobLimit, // Establecer límites del trial
              one_time_cv_bonus: 0, // Asegurar que los bonos puntuales sean 0 para un trial
              one_time_job_bonus: 0, // Asegurar que los bonos puntuales sean 0 para un trial
            }, { onConflict: 'recruiter_id' }) // Usar upsert para evitar duplicados
            .select()
            .single();

          if (subError) {
            console.error("auth.js: Error creating trial subscription during login flow:", subError);
          } else if (!newSubscription) {
            console.warn("auth.js: Trial subscription INSERT returned no data during login flow, but no error. Check RLS or table configuration.");
          } else {
            console.debug("auth.js: Trial subscription created successfully during login flow:", newSubscription);
            profile.suscripcion = newSubscription; // Actualizar el perfil con la nueva suscripción
          }
        } catch (subCreationError) {
          console.error("auth.js: Exception during trial subscription creation in login flow:", subCreationError);
        }
      }

      // Si el usuario está confirmado pero el perfil no existe, crearlo ahora
      if (authUser.email_confirmed_at && !profileExists) {
        console.debug("auth.js: CONDITION MET - User confirmed but no profile. Attempting to create basic profile...");
        try {
          const basicProfileData = {
            id: authUser.id,
            email: authUser.email,
            first_name: authUser.user_metadata?.first_name || "LLENAR POR EL USUARIO",
            last_name: authUser.user_metadata?.last_name || "LLENAR POR EL USUARIO",
          };
          const newProfile = await auth.saveRecruiterProfile(basicProfileData); // INSERT
          if (newProfile) {
            console.debug("auth.js: Basic profile created successfully during login flow.");
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
      console.debug("auth.js: register - Starting registration process");
      // Eliminamos la verificación manual de email existente en 'reclutadores'.
      // supabase.auth.signUp() ya maneja la unicidad del email en 'auth.users'.
      
      console.debug("auth.js: Proceeding with Supabase Auth signup for email:", userData.email);
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
      console.debug("[DEBUG] supabase.auth.signUp finished. Error:", authError, "User:", authUser);

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
        console.debug('auth.js: Session active immediately after signup. User ID:', sessionData.session.user.id);
        console.debug('auth.js: Token:', sessionData.session.access_token ? 'Exists' : 'DOES NOT EXIST');
      } else {
        console.warn('auth.js: No active session found immediately after signup.');
      }
      // FIN NUEVO LOG

      // El usuario ha sido creado en auth.users.
      // La inserción en la tabla 'reclutadores' se hará después de la confirmación del email.
      console.debug("auth.js: Supabase Auth signUp successful. User created with ID:", authUser.id);
      console.debug("auth.js: User needs to confirm email before profile data is saved.");
      
      // Devolvemos el usuario de autenticación para que el frontend pueda decidir cómo proceder
      // (por ejemplo, almacenar datos del perfil temporalmente y mostrar mensaje de confirmación).
      return { user: authUser, needsEmailConfirmation: true };

    } catch (error) {
      console.error("auth.js: Registration error (during signUp):", error);
      throw error; // Re-throw the error to be caught by the caller
    }
  },

  async saveRecruiterProfile(profileData) {
    console.debug("auth.js: saveRecruiterProfile - Attempting to save recruiter profile data");
    
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

    console.debug("auth.js: [LOG] saveRecruiterProfile - Attempting INSERT with data:", recruiterDataToInsert);
    const { data: insertedRecruiter, error: recruiterInsertError } = await supabase
      .from('reclutadores')
      .insert([recruiterDataToInsert])
      .select()
      .single();

    if (recruiterInsertError) {
      console.error('auth.js: [LOG] Error during INSERT in saveRecruiterProfile. Full error object:', recruiterInsertError);
      console.error('auth.js: [LOG] Failed data for INSERT:', JSON.stringify(recruiterDataToInsert, null, 2));
      throw new Error(`Error al guardar perfil inicial: ${recruiterInsertError.message || recruiterInsertError.details || "Error desconocido"}`);
    }

    console.debug("auth.js: [LOG] saveRecruiterProfile - INSERT successful. Result:", insertedRecruiter);

    // Después de crear el perfil del reclutador, crear o actualizar una suscripción de prueba por defecto
    if (insertedRecruiter) {
      const defaultPlanId = 'trial';
      const trialDays = 7;
      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + trialDays);

      // Obtener los límites del plan trial desde APP_PLANS
      const trialPlanDetails = APP_PLANS[defaultPlanId];
      const trialCvLimit = trialPlanDetails?.cvLimit || 0;
      const trialJobLimit = trialPlanDetails?.jobLimit || 0;

      const defaultSubscription = {
        recruiter_id: insertedRecruiter.id,
        plan_id: defaultPlanId,
        status: 'trialing', // O 'active' si 'basico' no tiene trial
        trial_ends_at: trialEnds.toISOString(),
        // current_period_start y current_period_end pueden ser null o definirse si es necesario
        // created_at y updated_at se manejarán por defecto en la BD si están configurados
      };

      console.debug("auth.js: Attempting to create/update default subscription for recruiter_id:", insertedRecruiter.id);
      const { data: newSubscription, error: subError } = await supabase
        .from('suscripciones')
        .upsert({
          recruiter_id: insertedRecruiter.id,
          plan_id: defaultPlanId,
          status: 'trialing',
          trial_ends_at: trialEnds.toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: trialEnds.toISOString(), // Para que el trial tenga un período definido
          cvs_analizados_este_periodo: 0,
          jobs_creados_este_periodo: 0,
          CV_Max_plan: trialCvLimit, // Establecer límites del trial
          Jobs_Max_plan: trialJobLimit, // Establecer límites del trial
          one_time_cv_bonus: 0, // Asegurar que los bonos puntuales sean 0 para un trial
          one_time_job_bonus: 0, // Asegurar que los bonos puntuales sean 0 para un trial
        }, { onConflict: 'recruiter_id' }) // Usar upsert para evitar duplicados
        .select()
        .single();

      if (subError) {
        console.error("auth.js: Error creating default subscription:", subError);
        // No lanzar error aquí para no interrumpir el flujo de creación de perfil,
        // pero sí loguearlo. El usuario tendrá perfil pero no suscripción.
        // Se podría reintentar o manejar administrativamente.
      } else if (!newSubscription) {
        console.warn("auth.js: Default subscription INSERT returned no data, but no error. Check RLS or table configuration.");
      }
      else {
        console.debug("auth.js: Default subscription created successfully:", newSubscription);
        // Opcional: añadir la suscripción al objeto insertedRecruiter antes de devolverlo
        // insertedRecruiter.suscripcion = newSubscription;
      }
    }
    return insertedRecruiter; // Devolver el perfil del reclutador
  },

  async updateRecruiterProfile(userId, profileData) {
    console.debug("auth.js: updateRecruiterProfile - Attempting to update profile for user:", userId);
    
    // No necesitamos verificar la sesión aquí, ya que se asume que CompleteProfile es una ruta protegida
    // y la llamada vendrá de un usuario autenticado. La RLS se encargará de la seguridad.

    // Preparamos los datos para actualizar. Excluimos 'id' y 'email' si no queremos que se actualicen.
    // También excluimos campos que no existen en la tabla reclutadores.
    // Revertir la prueba y usar la lógica original para preparar dataToUpdate
    const { id, email, created_at, trial_ends_at, ...dataToUpdate } = profileData;
    // Asegúrate de que todos los campos en dataToUpdate (que vienen de CompleteProfile.jsx
    // ya mapeados a snake_case) existan como columnas en tu tabla reclutadores.

    console.debug("auth.js: [LOG] updateRecruiterProfile - Attempting UPDATE for userId:", userId, "with data:", dataToUpdate);
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
      console.debug("auth.js: [LOG] updateRecruiterProfile - UPDATE successful. Result:", updatedRecruiter);
    }
    // Ya no devolvemos los datos actualizados, solo indicamos éxito implícito (sin error)
    return true; // O devolver void
  },

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        // Si el error específico es que la sesión no existe en Supabase,
        // podemos tratarlo como si el logout ya hubiera ocurrido del lado del servidor.
        if (error.message === 'Session from session_id claim in JWT does not exist' || error.status === 403) {
          console.warn('Logout attempted on a session that Supabase considers non-existent. Clearing local state as if logout was successful.');
        } else {
          throw error; // Re-lanzar otros errores
        }
      }
    } finally {
      // Siempre limpiar el estado local, independientemente de si Supabase dio error o no,
      // especialmente si el error indica que la sesión ya no es válida.
      this.user = null;
      localStorage.removeItem(STORAGE_KEY);
      console.debug("auth.js: Local user state and storage cleared after logout attempt.");
    }
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
     console.debug("Cleared auth user state and storage.");
  },

  async getRecruiterProfile(userId) {
    console.log("[DEBUG] Entering getRecruiterProfile for userId:", userId); // Log al entrar
    if (!userId) {
      console.error("auth.js: getRecruiterProfile - userId is required.");
      return null;
    }
    try {
      console.log("[DEBUG] getRecruiterProfile: Querying 'reclutadores' table for userId:", userId);
      const { data: recruiterProfile, error: recruiterError } = await supabase
        .from('reclutadores')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log("[DEBUG] getRecruiterProfile: 'reclutadores' query result - Error:", recruiterError, "Data:", recruiterProfile);

      if (recruiterError) {
        console.error('auth.js: Error fetching recruiter profile by ID:', recruiterError);
        throw recruiterError;
      }

      if (!recruiterProfile) {
        // Si no hay perfil de reclutador, no tiene sentido buscar suscripción.
        return null;
      }

      // Ahora, obtener todas las suscripciones activas del reclutador
      console.log("[DEBUG] getRecruiterProfile: Querying 'suscripciones' table for recruiterId:", userId);
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('recruiter_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false });

      console.log("[DEBUG] getRecruiterProfile: 'suscripciones' query result - Error:", subscriptionsError, "Data:", subscriptions);

      if (subscriptionsError) {
        console.error('auth.js: Error fetching subscriptions:', subscriptionsError);
        // Decidir si lanzar el error o solo devolver el perfil sin suscripciones.
      }

      let currentPlan = null; // Para planes mensuales/empresariales
      let oneTimePlan = null; // Para planes de búsqueda puntual

      if (subscriptions && subscriptions.length > 0) {
        // Iterar sobre las suscripciones para clasificar y encontrar las más relevantes
        for (const sub of subscriptions) {
          // Asumiendo que APP_PLANS está disponible y tiene la propiedad 'type'
          const planDetails = APP_PLANS[sub.plan_id];
          if (planDetails) {
            if (planDetails.type === 'monthly' || planDetails.type === 'enterprise') {
              // Si ya tenemos un plan mensual, el más reciente (por el order by) es el que nos interesa
              if (!currentPlan) {
                currentPlan = sub;
              }
            } else if (planDetails.type === 'one-time') {
              // Si ya tenemos un plan puntual, el más reciente (por el order by) es el que nos interesa
              if (!oneTimePlan) {
                oneTimePlan = sub;
              }
            }
          }
        }
      }
      
      // Combinar el perfil del reclutador con la suscripción más relevante
      let activeSubscription = null;
      const now = new Date();
      
      // Determinar si el currentPlan (mensual/enterprise) está realmente activo por fecha
      const isCurrentPlanActiveByDate = currentPlan && currentPlan.status === 'active' && new Date(currentPlan.current_period_end) > now;
      // Determinar si el oneTimePlan está realmente activo por fecha
      const isOneTimePlanActiveByDate = oneTimePlan && oneTimePlan.status === 'active' && new Date(oneTimePlan.current_period_end) > now;

      if (isCurrentPlanActiveByDate) { // Priorizar plan mensual/enterprise si está activo por fecha
        activeSubscription = currentPlan;
      } else if (isOneTimePlanActiveByDate) { // Si no, usar puntual si está activo por fecha
        activeSubscription = oneTimePlan;
      } else if (currentPlan) { // Si el plan mensual existe pero está expirado, aún lo asignamos para que se muestre su nombre, pero se indicará como expirado
        activeSubscription = currentPlan;
      } else if (oneTimePlan) { // Si el plan puntual existe pero está expirado, lo asignamos
        activeSubscription = oneTimePlan;
      }

      // Asegurar que los campos de conteo estén presentes en el objeto de suscripción
      // y que los límites del plan se adjunten para calculateEffectivePlan
      if (activeSubscription) {
        activeSubscription.cvs_analizados_este_periodo = activeSubscription.cvs_analizados_este_periodo || 0;
        activeSubscription.jobs_creados_este_periodo = activeSubscription.jobs_creados_este_periodo || 0;
        // Adjuntar los límites del plan directamente al objeto de suscripción para fácil acceso
        const planDetails = APP_PLANS[activeSubscription.plan_id];
        if (planDetails) {
          activeSubscription.cvLimit = planDetails.cvLimit;
          activeSubscription.jobLimit = planDetails.jobLimit;
          activeSubscription.type = planDetails.type; // Añadir el tipo de plan
          activeSubscription.name = planDetails.name; // Añadir el nombre del plan
        }
      }

      return {
        ...recruiterProfile,
        suscripcion: activeSubscription, // Adjuntar el objeto de suscripción directamente
      };
    } catch (error) {
      console.error('auth.js: Error fetching recruiter profile or subscriptions:', error);
      throw error;
    }
  },

  getRecruiterByEmail: getRecruiterByEmail
};
