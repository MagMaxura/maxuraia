
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const SITE_URL = process.env.VITE_SITE_URL;

let supabase;

if (typeof window !== 'undefined') {
  // Browser environment
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: window.localStorage,
      storageKey: 'supabase.auth.token',
      redirectTo: `${SITE_URL}/auth/callback`,
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'employsmartia'
      }
    }
  });

  // Add auth state change listener only in browser
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
      // Delete all supabase-related items from localStorage
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('supabase.auth.')) {
          localStorage.removeItem(key);
        }
      }
    }
  }
);

} else {
  // Server environment (e.g., Vercel function, Node.js backend)
  // Initialize client without browser-specific auth options
  // Consider using service_role key if needed for elevated privileges
  // For webhooks, standard key might be sufficient depending on RLS
  supabase = createClient(supabaseUrl, supabaseKey, {
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'employsmartia'
      }
    }
  });
}

export { supabase };

export async function checkEmailExists(email) {
  try {
    const { data, error } = await supabase
      .from('reclutadores')
      .select('id')
      .eq('email', email);

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking email:', error);
    throw error;
  }
}

export async function saveRecruiter(recruiterData) {
  try {
    const { data, error } = await supabase
      .from('reclutadores')
      .insert([recruiterData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving recruiter:', error);
    throw error;
  }
}

export async function getRecruiterByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('reclutadores')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching recruiter:', error);
    throw error;
  }
}
