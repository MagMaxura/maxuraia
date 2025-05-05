
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://srbfgiujtgizzpialqfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyYmZnaXVqdGdpenpwaWFscWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MDk5MzMsImV4cCI6MjA2MDk4NTkzM30.Zc2inTAl1hDb44o9fTYkrav5vOUl5vR6T5fsWSQvifU';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    redirectTo: 'https://employsmartia.com/login'
  }
});

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
