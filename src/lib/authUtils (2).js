
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const fetchAndSetRecruiterData = async (authUser) => {
  try {
    const recruiterData = await auth.getRecruiterByEmail(authUser.email);
    if (recruiterData) {
      const fullUserData = { ...authUser, ...recruiterData };
      auth.user = fullUserData;
      localStorage.setItem('auth_user', JSON.stringify(fullUserData));
      return fullUserData;
    } else {
      console.error("Recruiter data not found for authenticated user:", authUser.email);
      await auth.logout(); 
      return null;
    }
  } catch (error) {
    console.error("Error fetching recruiter data:", error);
    auth.clearAuthUser();
    throw new Error("Error al obtener datos del reclutador."); 
  }
};
