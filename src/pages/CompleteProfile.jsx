import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { Mail, User, Building2, Phone, Globe, Users, Flag } from 'lucide-react';

function CompleteProfile() {
  console.log("CompleteProfile component rendering");
  // Obtener la función updateRecruiterProfile del contexto
  const { user: authUser, updateRecruiterProfile, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    phoneCountryCode: "+54", // Default a +54
    phone: "",
    website: "https://", // Precargar con https://
    country: "",
    industry: "",
    companySize: "",
    marketingConsent: false // Puedes decidir si incluir esto aquí
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirigir si no hay usuario autenticado
    if (!loading && !authUser) {
      console.log("CompleteProfile: No authenticated user found, redirecting to login.");
      navigate('/login');
    }
    // Podrías pre-rellenar algún dato si estuviera en authUser.user_metadata, pero lo dejamos vacío por ahora.
  }, [authUser, loading, navigate]);

  const validateWebsite = (website) => {
    if (!website) return true; // Permitir campo vacío si es opcional
    const pattern = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
    return pattern.test(website.toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !authUser) return;

    console.log("CompleteProfile: Form data being validated:", formData);

    // Validar campos requeridos (ajusta según necesites)
    const requiredFields = {
      firstName: "nombre",
      lastName: "apellido",
      company: "empresa",
    };
    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !formData[key])
      .map(([_, label]) => label);

    if (missingFields.length > 0) {
      toast({
        title: "Campos requeridos",
        description: `Por favor, completa los siguientes campos: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Validar sitio web si se ingresó
    if (formData.website && !validateWebsite(formData.website)) {
      toast({
        title: "Formato de sitio web inválido",
        description: "Por favor, ingresa un sitio web válido (ej: https://www.empresa.com)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log("CompleteProfile: [LOG] Submitting profile data...");

    try {
      const dataForUpdate = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        company: formData.company,
        phone: formData.phoneCountryCode && formData.phone
                 ? `${formData.phoneCountryCode}${formData.phone}`
                 : formData.phone,
        website: formData.website,
        country_code: formData.country,
        industry: formData.industry,
        company_size: formData.companySize,
        marketing_consent: formData.marketingConsent,
      };

      console.log("CompleteProfile: [LOG] Calling updateRecruiterProfile for user ID:", authUser.id, "with data:", dataForUpdate);
      await updateRecruiterProfile(authUser.id, dataForUpdate);
      console.log("CompleteProfile: [LOG] updateRecruiterProfile call completed.");

      toast({
        title: "¡Perfil completado!",
        description: "Tu información ha sido guardada exitosamente.",
        variant: "default", // o 'success'
      });
      navigate('/dashboard');

    } catch (error) {
      console.error("CompleteProfile: [LOG] Error saving profile:", error, JSON.stringify(error, null, 2));
      toast({
        title: "Error al guardar perfil",
        description: error.message || "No se pudo guardar tu perfil. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar carga o nada si el usuario aún no está disponible
  if (loading || !authUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-blue-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-xl p-8 w-full max-w-2xl space-y-8 shadow-2xl border border-white/20"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Completa tu Perfil</h2>
          <p className="text-white/80">Necesitamos algunos detalles más para configurar tu cuenta.</p>
        </div>

        {/* Mostrar email (solo lectura) */}
         <div className="mb-4">
            <label className="block text-base font-medium text-white mb-1">Email</label>
            <div className="relative">
                 <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                 <input
                   type="email"
                   readOnly
                   value={authUser.email || ''}
                   className="mt-1 block w-full rounded-lg border border-white/30 
                     bg-white/20 text-white/80 placeholder-white/50 p-3 pl-10 cursor-not-allowed"
                 />
            </div>
         </div>


        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label className="block text-base font-medium text-white mb-2">Nombre *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/50 p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Juan"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Apellido */}
            <div>
              <label className="block text-base font-medium text-white mb-2">Apellido *</label>
               <div className="relative">
                 <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                 <input
                   type="text"
                   className="mt-1 block w-full rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/50 p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                   value={formData.lastName}
                   onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                   placeholder="Pérez"
                   required
                   disabled={isSubmitting}
                 />
               </div>
            </div>

            {/* Empresa */}
            <div>
              <label className="block text-base font-medium text-white mb-2">Empresa *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/50 p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Nombre de tu empresa"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* País */}
             <div>
               <label className="block text-base font-medium text-white mb-2">País</label>
               <div className="relative">
                 <Flag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                 <select
                   className="mt-1 block w-full rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/50 p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent appearance-none"
                   value={formData.country}
                   onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                   disabled={isSubmitting}
                 >
                   <option value="" className="bg-blue-800">Selecciona un país</option>
                   <option value="AR" className="bg-blue-800">Argentina</option>
                   {/* Añadir más países si es necesario */}
                 </select>
               </div>
             </div>

            {/* Teléfono */}
            <div>
              <label className="block text-base font-medium text-white mb-2">Teléfono</label>
              <div className="flex gap-2">
                <div className="relative w-1/3">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                  <select
                    className="mt-1 block w-full rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/50 p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent appearance-none"
                    value={formData.phoneCountryCode}
                    onChange={(e) => setFormData({ ...formData, phoneCountryCode: e.target.value })}
                    disabled={isSubmitting}
                  >
                    <option value="+54" className="bg-blue-800">+54 (AR)</option>
                    {/* Añadir más códigos si es necesario */}
                  </select>
                </div>
                <input
                  type="tel"
                  className="mt-1 block w-2/3 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/50 p-3 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Número"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Sitio web */}
            <div>
              <label className="block text-base font-medium text-white mb-2">Sitio web</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/50 p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.tuempresa.com"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Industria */}
            <div>
              <label className="block text-base font-medium text-white mb-2">Industria</label>
              <select
                className="mt-1 block w-full rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/50 p-3 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent appearance-none"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                disabled={isSubmitting}
              >
               <option value="" className="bg-blue-800">Selecciona una industria</option>
               <option value="tecnologia" className="bg-blue-800">Tecnología</option>
               <option value="finanzas" className="bg-blue-800">Finanzas</option>
               <option value="salud" className="bg-blue-800">Salud</option>
               <option value="educacion" className="bg-blue-800">Educación</option>
               <option value="manufactura" className="bg-blue-800">Manufactura</option>
               <option value="retail" className="bg-blue-800">Retail</option>
               <option value="servicios" className="bg-blue-800">Servicios</option>
               <option value="otros" className="bg-blue-800">Otros</option>
            </select>
          </div>

            {/* Tamaño de la empresa */}
            <div>
              <label className="block text-base font-medium text-white mb-2">Tamaño de la empresa</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <select
                  className="mt-1 block w-full rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/50 p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent appearance-none"
                  value={formData.companySize}
                  onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                  disabled={isSubmitting}
                >
                  <option value="" className="bg-blue-800">Selecciona el tamaño</option>
                  <option value="1-10" className="bg-blue-800">1-10 empleados</option>
                  <option value="11-50" className="bg-blue-800">11-50 empleados</option>
                  <option value="51-200" className="bg-blue-800">51-200 empleados</option>
                  <option value="201-500" className="bg-blue-800">201-500 empleados</option>
                  <option value="501+" className="bg-blue-800">501+ empleados</option>
                </select>
              </div>
            </div>
          </div>

          {/* Marketing Consent (Opcional) */}
          <div className="flex items-start space-x-3 mt-6">
             <input
               type="checkbox"
               id="marketingConsent"
               className="mt-1"
               checked={formData.marketingConsent}
               onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
               disabled={isSubmitting}
             />
             <label htmlFor="marketingConsent" className="text-sm text-white/80">
               Acepto recibir comunicaciones de marketing.
             </label>
           </div>

          <Button
            type="submit"
            className="w-full bg-white hover:bg-white/90 text-blue-600 font-semibold py-3 px-4 rounded-lg transition duration-200 text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? "Guardando..." : "Guardar Perfil y Continuar"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

export default CompleteProfile;