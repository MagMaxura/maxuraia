import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Building2, Phone, Globe, Users, Flag } from 'lucide-react';

function Register() {
  console.log("Register component rendering");
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneCountryCode: "+54",
    phone: "",
    website: "",
    country: "",
    industry: "",
    companySize: "",
    marketingConsent: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  console.log("Register: register function available:", !!register);

  const validateWebsite = (website) => {
    if (!website) return true;
    // Permite http://, https://, www. o solo el dominio.
    // También permite una ruta opcional al final.
    const pattern = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
    return pattern.test(website.toLowerCase());
  };

  const handleSubmit = async (e) => {
    console.log("Register.jsx: handleSubmit - INICIO DE FUNCIÓN");
    e.preventDefault();
    
    if (isSubmitting) {
      console.log("Register.jsx: Form submission blocked - already submitting");
      return;
    }

    if (!register) {
      console.error("Register.jsx: register function is not available");
      toast({
        title: "Error del sistema",
        description: "No se puede procesar el registro en este momento.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Register.jsx: Form data being validated:", formData);
    
    // Validate required fields
    const requiredFields = {
      firstName: "nombre",
      lastName: "apellido",
      company: "empresa",
      email: "email",
      password: "contraseña",
      confirmPassword: "confirmación de contraseña"
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !formData[key])
      .map(([_, label]) => label);

    if (missingFields.length > 0) {
      console.log("Register.jsx: Missing required fields:", missingFields);
      toast({
        title: "Campos requeridos",
        description: `Por favor, completa los siguientes campos: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      console.log("Register.jsx: Passwords don't match");
      toast({
        title: "Error en la contraseña",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      console.log("Register.jsx: Password too short");
      toast({
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    // Validate website format if provided
    if (formData.website && !validateWebsite(formData.website)) {
      console.log("Register.jsx: Invalid website format");
      toast({
        title: "Formato de sitio web inválido",
        description: "Por favor, ingresa un sitio web válido (ejemplo: www.empresa.com)",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.log("Register.jsx: Invalid email format");
      toast({
        title: "Formato de email inválido",
        description: "Por favor, ingresa un email válido",
        variant: "destructive",
      });
      return;
    }

    console.log("Register.jsx: All validations passed, proceeding with registration");
    setIsSubmitting(true);

    try {
      // Preparamos los datos para el signUp y para almacenar en localStorage
      const { password, confirmPassword, ...profileDataForStorage } = formData;
      
      const dataForSignUp = {
        ...profileDataForStorage, // Contiene todos los campos excepto password y confirmPassword
        password: formData.password, // Añadimos la contraseña para el signUp
        // Formateamos el teléfono aquí si es necesario, o lo hacemos en auth.js si es más limpio
        phone: formData.phoneCountryCode && formData.phone
          ? `${formData.phoneCountryCode}${formData.phone}`
          : formData.phone
      };
      // Eliminamos confirmPassword de los datos que se envían a auth.register
      // (ya lo hicimos al crear profileDataForStorage, pero por si acaso)
      // delete dataForSignUp.confirmPassword; // No es necesario, ya no está.

      console.log("Register.jsx: Calling register function with data for signUp:", dataForSignUp);
      const registrationAttempt = await register(dataForSignUp);

      console.log("Register.jsx: Registration (signUp) attempt result:", registrationAttempt);
      
      console.log("Register.jsx: SignUp successful, user needs to confirm email.");
      
      if (registrationAttempt && registrationAttempt.user) {
        // Añadimos el ID del usuario a los datos que se guardarán en localStorage
        profileDataForStorage.id = registrationAttempt.user.id;
      } else {
        console.error("Register.jsx: User object not found in registration attempt result after successful signUp.");
        toast({
          title: "Error Inesperado",
          description: "No se pudo obtener el ID de usuario después del registro. Por favor, intenta nuevamente.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      localStorage.setItem('pendingUserProfile', JSON.stringify(profileDataForStorage));

      toast({
        title: "¡Casi listo!",
        description: "Hemos enviado un correo de confirmación a tu email. Por favor, revísalo para activar tu cuenta.",
        variant: "default",
        duration: 10000,
      });
      
      setFormData({
        firstName: "", lastName: "", company: "", email: "",
        password: "", confirmPassword: "", phoneCountryCode: "+54",
        phone: "", website: "", country: "", industry: "",
        companySize: "", marketingConsent: false
      });

    } catch (error) {
      console.error("Register.jsx: Error during signUp process:", error.message, error);
      toast({
        title: "Error en el registro",
        description: error.message || "Ocurrió un error inesperado durante el registro.",
        variant: "destructive",
      });
    } finally {
      console.log("Register.jsx: Registration process completed, resetting submit state");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-blue-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-xl p-8 w-full max-w-2xl space-y-8 shadow-2xl border border-white/20"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Prueba Gratuita</h2>
          <p className="text-white/80">7 días de acceso completo sin costo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Personal */}
            <div>
              <label className="block text-base font-medium text-white mb-2">
                Nombre *
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-lg border border-white/30 
                  bg-white/10 text-white placeholder-white/50 p-3
                  focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Juan"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-base font-medium text-white mb-2">
                Apellido *
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-lg border border-white/30 
                  bg-white/10 text-white placeholder-white/50 p-3
                  focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Pérez"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-base font-medium text-white mb-2">
                Email corporativo *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <input
                  type="email"
                  className="mt-1 block w-full rounded-lg border border-white/30 
                    bg-white/10 text-white placeholder-white/50 p-3 pl-10
                    focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tu@empresa.com"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Información de la Empresa */}
            <div>
              <label className="block text-base font-medium text-white mb-2">
                Empresa *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-white/30 
                    bg-white/10 text-white placeholder-white/50 p-3 pl-10
                    focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Nombre de tu empresa"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-white mb-2">
                País
              </label>
              <div className="relative">
                <Flag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <select
                  className="mt-1 block w-full rounded-lg border border-white/30 
                    bg-white/10 text-white placeholder-white/50 p-3 pl-10
                    focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  disabled={isSubmitting}
                >
                  <option value="" className="bg-blue-800">Selecciona un país</option>
                  <option value="AR" className="bg-blue-800">Argentina</option>
                  <option value="BO" className="bg-blue-800">Bolivia</option>
                  <option value="CL" className="bg-blue-800">Chile</option>
                  <option value="CO" className="bg-blue-800">Colombia</option>
                  <option value="CR" className="bg-blue-800">Costa Rica</option>
                  <option value="CU" className="bg-blue-800">Cuba</option>
                  <option value="EC" className="bg-blue-800">Ecuador</option>
                  <option value="SV" className="bg-blue-800">El Salvador</option>
                  <option value="ES" className="bg-blue-800">España</option>
                  <option value="GT" className="bg-blue-800">Guatemala</option>
                  <option value="HN" className="bg-blue-800">Honduras</option>
                  <option value="MX" className="bg-blue-800">México</option>
                  <option value="NI" className="bg-blue-800">Nicaragua</option>
                  <option value="PA" className="bg-blue-800">Panamá</option>
                  <option value="PY" className="bg-blue-800">Paraguay</option>
                  <option value="PE" className="bg-blue-800">Perú</option>
                  <option value="PR" className="bg-blue-800">Puerto Rico</option>
                  <option value="DO" className="bg-blue-800">República Dominicana</option>
                  <option value="UY" className="bg-blue-800">Uruguay</option>
                  <option value="VE" className="bg-blue-800">Venezuela</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-white mb-2">
                Teléfono
              </label>
              <div className="flex gap-2">
                <div className="relative w-1/3">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                  <select
                    className="mt-1 block w-full rounded-lg border border-white/30 
                      bg-white/10 text-white placeholder-white/50 p-3 pl-10
                      focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                    value={formData.phoneCountryCode}
                    onChange={(e) => setFormData({ ...formData, phoneCountryCode: e.target.value })}
                    disabled={isSubmitting}
                  >
                    <option value="" className="bg-blue-800">Código</option>
                    <option value="+54" className="bg-blue-800">+54 (AR)</option>
                    <option value="+591" className="bg-blue-800">+591 (BO)</option>
                    <option value="+56" className="bg-blue-800">+56 (CL)</option>
                    <option value="+57" className="bg-blue-800">+57 (CO)</option>
                    <option value="+506" className="bg-blue-800">+506 (CR)</option>
                    <option value="+53" className="bg-blue-800">+53 (CU)</option>
                    <option value="+593" className="bg-blue-800">+593 (EC)</option>
                    <option value="+503" className="bg-blue-800">+503 (SV)</option>
                    <option value="+34" className="bg-blue-800">+34 (ES)</option>
                    <option value="+502" className="bg-blue-800">+502 (GT)</option>
                    <option value="+504" className="bg-blue-800">+504 (HN)</option>
                    <option value="+52" className="bg-blue-800">+52 (MX)</option>
                    <option value="+505" className="bg-blue-800">+505 (NI)</option>
                    <option value="+507" className="bg-blue-800">+507 (PA)</option>
                    <option value="+595" className="bg-blue-800">+595 (PY)</option>
                    <option value="+51" className="bg-blue-800">+51 (PE)</option>
                    <option value="+1" className="bg-blue-800">+1 (PR)</option>
                    <option value="+1" className="bg-blue-800">+1 (DO)</option>
                    <option value="+598" className="bg-blue-800">+598 (UY)</option>
                    <option value="+58" className="bg-blue-800">+58 (VE)</option>
                  </select>
                </div>
                <input
                  type="tel"
                  className="mt-1 block w-2/3 rounded-lg border border-white/30 
                    bg-white/10 text-white placeholder-white/50 p-3
                    focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Número de teléfono"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-white mb-2">
                Sitio web
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-white/30 
                    bg-white/10 text-white placeholder-white/50 p-3 pl-10
                    focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="www.tuempresa.com"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-white mb-2">
                Industria
              </label>
              <select
                className="mt-1 block w-full rounded-lg border border-white/30 
                  bg-white/10 text-white placeholder-white/50 p-3
                  focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
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

            <div>
              <label className="block text-base font-medium text-white mb-2">
                Tamaño de la empresa
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <select
                  className="mt-1 block w-full rounded-lg border border-white/30 
                    bg-white/10 text-white placeholder-white/50 p-3 pl-10
                    focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
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

            {/* Contraseña */}
            <div>
              <label className="block text-base font-medium text-white mb-2">
                Contraseña *
              </label>
              <input
                type="password"
                className="mt-1 block w-full rounded-lg border border-white/30 
                  bg-white/10 text-white placeholder-white/50 p-3
                  focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-base font-medium text-white mb-2">
                Confirmar contraseña *
              </label>
              <input
                type="password"
                className="mt-1 block w-full rounded-lg border border-white/30 
                  bg-white/10 text-white placeholder-white/50 p-3
                  focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Marketing Consent */}
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
              Acepto recibir información sobre productos, servicios, eventos y ofertas especiales.
              Puedo darme de baja en cualquier momento.
            </label>
          </div>

          <Button
            type="submit"
            className="w-full bg-white hover:bg-white/90 text-blue-600 
              font-semibold py-3 px-4 rounded-lg transition duration-200
              text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Procesando..." : "Comenzar prueba gratuita"}
          </Button>

          <p className="text-sm text-white/60 text-center mt-4">
            Al registrarte, aceptas nuestros términos y condiciones y nuestra política de privacidad.
          </p>
        </form>
      </motion.div>
    </div>
  );
}

export default Register;
