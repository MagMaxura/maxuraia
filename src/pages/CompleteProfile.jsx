import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { Mail, User, Building2, Phone, Globe, Users, Flag } from 'lucide-react';

function CompleteProfile() {
  console.log("CompleteProfile component rendering");
  // Obtener las funciones updateRecruiterProfile y refreshUser del contexto
  const { user: authUser, updateRecruiterProfile, loading, refreshUser } = useAuth();
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

      // Llamar a refreshUser para actualizar el estado del usuario en el contexto
      console.log("CompleteProfile: [LOG] Calling refreshUser to update auth context.");
      await refreshUser(); // Esperar a que se complete la actualización del usuario

      console.log("CompleteProfile: [LOG] Profile updated and auth context refreshed. Redirecting to dashboard.");
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
              <p className="text-red-400 text-xs mt-1 ml-1">Tu nombre de pila.</p>
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
               <p className="text-red-400 text-xs mt-1 ml-1">Tu apellido.</p>
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
              <p className="text-red-400 text-xs mt-1 ml-1">Nombre legal o comercial de tu empresa.</p>
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
                   <option value="AF" className="bg-blue-800">Afganistán</option>
                   <option value="AL" className="bg-blue-800">Albania</option>
                   <option value="DE" className="bg-blue-800">Alemania</option>
                   <option value="AD" className="bg-blue-800">Andorra</option>
                   <option value="AO" className="bg-blue-800">Angola</option>
                   <option value="AI" className="bg-blue-800">Anguila</option>
                   <option value="AQ" className="bg-blue-800">Antártida</option>
                   <option value="AG" className="bg-blue-800">Antigua y Barbuda</option>
                   <option value="SA" className="bg-blue-800">Arabia Saudita</option>
                   <option value="DZ" className="bg-blue-800">Argelia</option>
                   <option value="AR" className="bg-blue-800">Argentina</option>
                   <option value="AM" className="bg-blue-800">Armenia</option>
                   <option value="AW" className="bg-blue-800">Aruba</option>
                   <option value="AU" className="bg-blue-800">Australia</option>
                   <option value="AT" className="bg-blue-800">Austria</option>
                   <option value="AZ" className="bg-blue-800">Azerbaiyán</option>
                   <option value="BS" className="bg-blue-800">Bahamas</option>
                   <option value="BH" className="bg-blue-800">Bahréin</option>
                   <option value="BD" className="bg-blue-800">Bangladés</option>
                   <option value="BB" className="bg-blue-800">Barbados</option>
                   <option value="BY" className="bg-blue-800">Bielorrusia</option>
                   <option value="BE" className="bg-blue-800">Bélgica</option>
                   <option value="BZ" className="bg-blue-800">Belice</option>
                   <option value="BJ" className="bg-blue-800">Benín</option>
                   <option value="BM" className="bg-blue-800">Bermudas</option>
                   <option value="BT" className="bg-blue-800">Bután</option>
                   <option value="BO" className="bg-blue-800">Bolivia</option>
                   <option value="BA" className="bg-blue-800">Bosnia y Herzegovina</option>
                   <option value="BW" className="bg-blue-800">Botsuana</option>
                   <option value="BR" className="bg-blue-800">Brasil</option>
                   <option value="BN" className="bg-blue-800">Brunéi</option>
                   <option value="BG" className="bg-blue-800">Bulgaria</option>
                   <option value="BF" className="bg-blue-800">Burkina Faso</option>
                   <option value="BI" className="bg-blue-800">Burundi</option>
                   <option value="CV" className="bg-blue-800">Cabo Verde</option>
                   <option value="KH" className="bg-blue-800">Camboya</option>
                   <option value="CM" className="bg-blue-800">Camerún</option>
                   <option value="CA" className="bg-blue-800">Canadá</option>
                   <option value="TD" className="bg-blue-800">Chad</option>
                   <option value="CL" className="bg-blue-800">Chile</option>
                   <option value="CN" className="bg-blue-800">China</option>
                   <option value="CY" className="bg-blue-800">Chipre</option>
                   <option value="CO" className="bg-blue-800">Colombia</option>
                   <option value="KM" className="bg-blue-800">Comoras</option>
                   <option value="CG" className="bg-blue-800">Congo</option>
                   <option value="KP" className="bg-blue-800">Corea del Norte</option>
                   <option value="KR" className="bg-blue-800">Corea del Sur</option>
                   <option value="CR" className="bg-blue-800">Costa Rica</option>
                   <option value="CI" className="bg-blue-800">Costa de Marfil</option>
                   <option value="HR" className="bg-blue-800">Croacia</option>
                   <option value="CU" className="bg-blue-800">Cuba</option>
                   <option value="DK" className="bg-blue-800">Dinamarca</option>
                   <option value="DM" className="bg-blue-800">Dominica</option>
                   <option value="EC" className="bg-blue-800">Ecuador</option>
                   <option value="EG" className="bg-blue-800">Egipto</option>
                   <option value="SV" className="bg-blue-800">El Salvador</option>
                   <option value="AE" className="bg-blue-800">Emiratos Árabes Unidos</option>
                   <option value="ER" className="bg-blue-800">Eritrea</option>
                   <option value="SK" className="bg-blue-800">Eslovaquia</option>
                   <option value="SI" className="bg-blue-800">Eslovenia</option>
                   <option value="ES" className="bg-blue-800">España</option>
                   <option value="US" className="bg-blue-800">Estados Unidos</option>
                   <option value="EE" className="bg-blue-800">Estonia</option>
                   <option value="ET" className="bg-blue-800">Etiopía</option>
                   <option value="PH" className="bg-blue-800">Filipinas</option>
                   <option value="FI" className="bg-blue-800">Finlandia</option>
                   <option value="FR" className="bg-blue-800">Francia</option>
                   <option value="GA" className="bg-blue-800">Gabón</option>
                   <option value="GM" className="bg-blue-800">Gambia</option>
                   <option value="GE" className="bg-blue-800">Georgia</option>
                   <option value="GH" className="bg-blue-800">Ghana</option>
                   <option value="GI" className="bg-blue-800">Gibraltar</option>
                   <option value="GD" className="bg-blue-800">Granada</option>
                   <option value="GR" className="bg-blue-800">Grecia</option>
                   <option value="GL" className="bg-blue-800">Groenlandia</option>
                   <option value="GP" className="bg-blue-800">Guadalupe</option>
                   <option value="GU" className="bg-blue-800">Guam</option>
                   <option value="GT" className="bg-blue-800">Guatemala</option>
                   <option value="GF" className="bg-blue-800">Guayana Francesa</option>
                   <option value="GN" className="bg-blue-800">Guinea</option>
                   <option value="GQ" className="bg-blue-800">Guinea Ecuatorial</option>
                   <option value="GW" className="bg-blue-800">Guinea-Bisáu</option>
                   <option value="GY" className="bg-blue-800">Guyana</option>
                   <option value="HT" className="bg-blue-800">Haití</option>
                   <option value="HN" className="bg-blue-800">Honduras</option>
                   <option value="HK" className="bg-blue-800">Hong Kong</option>
                   <option value="HU" className="bg-blue-800">Hungría</option>
                   <option value="IN" className="bg-blue-800">India</option>
                   <option value="ID" className="bg-blue-800">Indonesia</option>
                   <option value="IR" className="bg-blue-800">Irán</option>
                   <option value="IQ" className="bg-blue-800">Irak</option>
                   <option value="IE" className="bg-blue-800">Irlanda</option>
                   <option value="IS" className="bg-blue-800">Islandia</option>
                   <option value="IL" className="bg-blue-800">Israel</option>
                   <option value="IT" className="bg-blue-800">Italia</option>
                   <option value="JM" className="bg-blue-800">Jamaica</option>
                   <option value="JP" className="bg-blue-800">Japón</option>
                   <option value="JO" className="bg-blue-800">Jordania</option>
                   <option value="KZ" className="bg-blue-800">Kazajistán</option>
                   <option value="KE" className="bg-blue-800">Kenia</option>
                   <option value="KG" className="bg-blue-800">Kirguistán</option>
                   <option value="KI" className="bg-blue-800">Kiribati</option>
                   <option value="KW" className="bg-blue-800">Kuwait</option>
                   <option value="LA" className="bg-blue-800">Laos</option>
                   <option value="LS" className="bg-blue-800">Lesoto</option>
                   <option value="LV" className="bg-blue-800">Letonia</option>
                   <option value="LB" className="bg-blue-800">Líbano</option>
                   <option value="LR" className="bg-blue-800">Liberia</option>
                   <option value="LY" className="bg-blue-800">Libia</option>
                   <option value="LI" className="bg-blue-800">Liechtenstein</option>
                   <option value="LT" className="bg-blue-800">Lituania</option>
                   <option value="LU" className="bg-blue-800">Luxemburgo</option>
                   <option value="MO" className="bg-blue-800">Macao</option>
                   <option value="MK" className="bg-blue-800">Macedonia del Norte</option>
                   <option value="MG" className="bg-blue-800">Madagascar</option>
                   <option value="MY" className="bg-blue-800">Malasia</option>
                   <option value="MW" className="bg-blue-800">Malaui</option>
                   <option value="MV" className="bg-blue-800">Maldivas</option>
                   <option value="ML" className="bg-blue-800">Malí</option>
                   <option value="MT" className="bg-blue-800">Malta</option>
                   <option value="MA" className="bg-blue-800">Marruecos</option>
                   <option value="MQ" className="bg-blue-800">Martinica</option>
                   <option value="MU" className="bg-blue-800">Mauricio</option>
                   <option value="MR" className="bg-blue-800">Mauritania</option>
                   <option value="YT" className="bg-blue-800">Mayotte</option>
                   <option value="MX" className="bg-blue-800">México</option>
                   <option value="FM" className="bg-blue-800">Micronesia</option>
                   <option value="MD" className="bg-blue-800">Moldavia</option>
                   <option value="MC" className="bg-blue-800">Mónaco</option>
                   <option value="MN" className="bg-blue-800">Mongolia</option>
                   <option value="ME" className="bg-blue-800">Montenegro</option>
                   <option value="MS" className="bg-blue-800">Montserrat</option>
                   <option value="MZ" className="bg-blue-800">Mozambique</option>
                   <option value="MM" className="bg-blue-800">Myanmar</option>
                   <option value="NA" className="bg-blue-800">Namibia</option>
                   <option value="NR" className="bg-blue-800">Nauru</option>
                   <option value="NP" className="bg-blue-800">Nepal</option>
                   <option value="NI" className="bg-blue-800">Nicaragua</option>
                   <option value="NE" className="bg-blue-800">Níger</option>
                   <option value="NG" className="bg-blue-800">Nigeria</option>
                   <option value="NU" className="bg-blue-800">Niue</option>
                   <option value="NO" className="bg-blue-800">Noruega</option>
                   <option value="NC" className="bg-blue-800">Nueva Caledonia</option>
                   <option value="NZ" className="bg-blue-800">Nueva Zelanda</option>
                   <option value="OM" className="bg-blue-800">Omán</option>
                   <option value="NL" className="bg-blue-800">Países Bajos</option>
                   <option value="PK" className="bg-blue-800">Pakistán</option>
                   <option value="PW" className="bg-blue-800">Palaos</option>
                   <option value="PS" className="bg-blue-800">Palestina</option>
                   <option value="PA" className="bg-blue-800">Panamá</option>
                   <option value="PG" className="bg-blue-800">Papúa Nueva Guinea</option>
                   <option value="PY" className="bg-blue-800">Paraguay</option>
                   <option value="PE" className="bg-blue-800">Perú</option>
                   <option value="PN" className="bg-blue-800">Pitcairn</option>
                   <option value="PF" className="bg-blue-800">Polinesia Francesa</option>
                   <option value="PL" className="bg-blue-800">Polonia</option>
                   <option value="PT" className="bg-blue-800">Portugal</option>
                   <option value="PR" className="bg-blue-800">Puerto Rico</option>
                   <option value="QA" className="bg-blue-800">Catar</option>
                   <option value="GB" className="bg-blue-800">Reino Unido</option>
                   <option value="CF" className="bg-blue-800">República Centroafricana</option>
                   <option value="CZ" className="bg-blue-800">República Checa</option>
                   <option value="CD" className="bg-blue-800">República Democrática del Congo</option>
                   <option value="DO" className="bg-blue-800">República Dominicana</option>
                   <option value="RE" className="bg-blue-800">Reunión</option>
                   <option value="RW" className="bg-blue-800">Ruanda</option>
                   <option value="RO" className="bg-blue-800">Rumania</option>
                   <option value="RU" className="bg-blue-800">Rusia</option>
                   <option value="EH" className="bg-blue-800">Sahara Occidental</option>
                   <option value="WS" className="bg-blue-800">Samoa</option>
                   <option value="AS" className="bg-blue-800">Samoa Americana</option>
                   <option value="SM" className="bg-blue-800">San Marino</option>
                   <option value="KN" className="bg-blue-800">San Cristóbal y Nieves</option>
                   <option value="SX" className="bg-blue-800">San Martín (parte holandesa)</option>
                   <option value="MF" className="bg-blue-800">San Martín (parte francesa)</option>
                   <option value="PM" className="bg-blue-800">San Pedro y Miquelón</option>
                   <option value="VC" className="bg-blue-800">San Vicente y las Granadinas</option>
                   <option value="SH" className="bg-blue-800">Santa Elena, Ascensión y Tristán de Acuña</option>
                   <option value="LC" className="bg-blue-800">Santa Lucía</option>
                   <option value="ST" className="bg-blue-800">Santo Tomé y Príncipe</option>
                   <option value="SN" className="bg-blue-800">Senegal</option>
                   <option value="RS" className="bg-blue-800">Serbia</option>
                   <option value="SC" className="bg-blue-800">Seychelles</option>
                   <option value="SL" className="bg-blue-800">Sierra Leona</option>
                   <option value="SG" className="bg-blue-800">Singapur</option>
                   <option value="SY" className="bg-blue-800">Siria</option>
                   <option value="SO" className="bg-blue-800">Somalia</option>
                   <option value="LK" className="bg-blue-800">Sri Lanka</option>
                   <option value="SZ" className="bg-blue-800">Esuatini</option>
                   <option value="ZA" className="bg-blue-800">Sudáfrica</option>
                   <option value="SD" className="bg-blue-800">Sudán</option>
                   <option value="SS" className="bg-blue-800">Sudán del Sur</option>
                   <option value="SE" className="bg-blue-800">Suecia</option>
                   <option value="CH" className="bg-blue-800">Suiza</option>
                   <option value="SR" className="bg-blue-800">Surinam</option>
                   <option value="TH" className="bg-blue-800">Tailandia</option>
                   <option value="TW" className="bg-blue-800">Taiwán</option>
                   <option value="TZ" className="bg-blue-800">Tanzania</option>
                   <option value="TJ" className="bg-blue-800">Tayikistán</option>
                   <option value="IO" className="bg-blue-800">Territorio Británico del Océano Índico</option>
                   <option value="TF" className="bg-blue-800">Territorios Franceses del Sur</option>
                   <option value="TL" className="bg-blue-800">Timor Oriental</option>
                   <option value="TG" className="bg-blue-800">Togo</option>
                   <option value="TK" className="bg-blue-800">Tokelau</option>
                   <option value="TO" className="bg-blue-800">Tonga</option>
                   <option value="TT" className="bg-blue-800">Trinidad y Tobago</option>
                   <option value="TN" className="bg-blue-800">Túnez</option>
                   <option value="TM" className="bg-blue-800">Turkmenistán</option>
                   <option value="TR" className="bg-blue-800">Turquía</option>
                   <option value="TV" className="bg-blue-800">Tuvalu</option>
                   <option value="UA" className="bg-blue-800">Ucrania</option>
                   <option value="UG" className="bg-blue-800">Uganda</option>
                   <option value="UY" className="bg-blue-800">Uruguay</option>
                   <option value="UZ" className="bg-blue-800">Uzbekistán</option>
                   <option value="VU" className="bg-blue-800">Vanuatu</option>
                   <option value="VE" className="bg-blue-800">Venezuela</option>
                   <option value="VN" className="bg-blue-800">Vietnam</option>
                   <option value="YE" className="bg-blue-800">Yemen</option>
                   <option value="DJ" className="bg-blue-800">Yibuti</option>
                   <option value="ZM" className="bg-blue-800">Zambia</option>
                   <option value="ZW" className="bg-blue-800">Zimbabue</option>
                 </select>
               </div>
               <p className="text-red-400 text-xs mt-1 ml-1">País donde opera principalmente tu empresa.</p>
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
                    <option value="+1" className="bg-blue-800">+1 (USA, Canadá)</option>
                    <option value="+7" className="bg-blue-800">+7 (Rusia, Kazajistán)</option>
                    <option value="+20" className="bg-blue-800">+20 (Egipto)</option>
                    <option value="+27" className="bg-blue-800">+27 (Sudáfrica)</option>
                    <option value="+30" className="bg-blue-800">+30 (Grecia)</option>
                    <option value="+31" className="bg-blue-800">+31 (Países Bajos)</option>
                    <option value="+32" className="bg-blue-800">+32 (Bélgica)</option>
                    <option value="+33" className="bg-blue-800">+33 (Francia)</option>
                    <option value="+34" className="bg-blue-800">+34 (España)</option>
                    <option value="+36" className="bg-blue-800">+36 (Hungría)</option>
                    <option value="+39" className="bg-blue-800">+39 (Italia)</option>
                    <option value="+40" className="bg-blue-800">+40 (Rumania)</option>
                    <option value="+41" className="bg-blue-800">+41 (Suiza)</option>
                    <option value="+43" className="bg-blue-800">+43 (Austria)</option>
                    <option value="+44" className="bg-blue-800">+44 (Reino Unido)</option>
                    <option value="+45" className="bg-blue-800">+45 (Dinamarca)</option>
                    <option value="+46" className="bg-blue-800">+46 (Suecia)</option>
                    <option value="+47" className="bg-blue-800">+47 (Noruega)</option>
                    <option value="+48" className="bg-blue-800">+48 (Polonia)</option>
                    <option value="+49" className="bg-blue-800">+49 (Alemania)</option>
                    <option value="+51" className="bg-blue-800">+51 (Perú)</option>
                    <option value="+52" className="bg-blue-800">+52 (México)</option>
                    <option value="+53" className="bg-blue-800">+53 (Cuba)</option>
                    <option value="+54" className="bg-blue-800">+54 (Argentina)</option>
                    <option value="+55" className="bg-blue-800">+55 (Brasil)</option>
                    <option value="+56" className="bg-blue-800">+56 (Chile)</option>
                    <option value="+57" className="bg-blue-800">+57 (Colombia)</option>
                    <option value="+58" className="bg-blue-800">+58 (Venezuela)</option>
                    <option value="+60" className="bg-blue-800">+60 (Malasia)</option>
                    <option value="+61" className="bg-blue-800">+61 (Australia)</option>
                    <option value="+62" className="bg-blue-800">+62 (Indonesia)</option>
                    <option value="+63" className="bg-blue-800">+63 (Filipinas)</option>
                    <option value="+64" className="bg-blue-800">+64 (Nueva Zelanda)</option>
                    <option value="+65" className="bg-blue-800">+65 (Singapur)</option>
                    <option value="+66" className="bg-blue-800">+66 (Tailandia)</option>
                    <option value="+81" className="bg-blue-800">+81 (Japón)</option>
                    <option value="+82" className="bg-blue-800">+82 (Corea del Sur)</option>
                    <option value="+84" className="bg-blue-800">+84 (Vietnam)</option>
                    <option value="+86" className="bg-blue-800">+86 (China)</option>
                    <option value="+90" className="bg-blue-800">+90 (Turquía)</option>
                    <option value="+91" className="bg-blue-800">+91 (India)</option>
                    <option value="+92" className="bg-blue-800">+92 (Pakistán)</option>
                    <option value="+93" className="bg-blue-800">+93 (Afganistán)</option>
                    <option value="+94" className="bg-blue-800">+94 (Sri Lanka)</option>
                    <option value="+95" className="bg-blue-800">+95 (Myanmar)</option>
                    <option value="+98" className="bg-blue-800">+98 (Irán)</option>
                    <option value="+211" className="bg-blue-800">+211 (Sudán del Sur)</option>
                    <option value="+212" className="bg-blue-800">+212 (Marruecos)</option>
                    <option value="+213" className="bg-blue-800">+213 (Argelia)</option>
                    <option value="+216" className="bg-blue-800">+216 (Túnez)</option>
                    <option value="+218" className="bg-blue-800">+218 (Libia)</option>
                    <option value="+220" className="bg-blue-800">+220 (Gambia)</option>
                    <option value="+221" className="bg-blue-800">+221 (Senegal)</option>
                    <option value="+222" className="bg-blue-800">+222 (Mauritania)</option>
                    <option value="+223" className="bg-blue-800">+223 (Malí)</option>
                    <option value="+224" className="bg-blue-800">+224 (Guinea)</option>
                    <option value="+225" className="bg-blue-800">+225 (Costa de Marfil)</option>
                    <option value="+226" className="bg-blue-800">+226 (Burkina Faso)</option>
                    <option value="+227" className="bg-blue-800">+227 (Níger)</option>
                    <option value="+228" className="bg-blue-800">+228 (Togo)</option>
                    <option value="+229" className="bg-blue-800">+229 (Benín)</option>
                    <option value="+230" className="bg-blue-800">+230 (Mauricio)</option>
                    <option value="+231" className="bg-blue-800">+231 (Liberia)</option>
                    <option value="+232" className="bg-blue-800">+232 (Sierra Leona)</option>
                    <option value="+233" className="bg-blue-800">+233 (Ghana)</option>
                    <option value="+234" className="bg-blue-800">+234 (Nigeria)</option>
                    <option value="+235" className="bg-blue-800">+235 (Chad)</option>
                    <option value="+236" className="bg-blue-800">+236 (República Centroafricana)</option>
                    <option value="+237" className="bg-blue-800">+237 (Camerún)</option>
                    <option value="+238" className="bg-blue-800">+238 (Cabo Verde)</option>
                    <option value="+239" className="bg-blue-800">+239 (Santo Tomé y Príncipe)</option>
                    <option value="+240" className="bg-blue-800">+240 (Guinea Ecuatorial)</option>
                    <option value="+241" className="bg-blue-800">+241 (Gabón)</option>
                    <option value="+242" className="bg-blue-800">+242 (Congo)</option>
                    <option value="+243" className="bg-blue-800">+243 (República Democrática del Congo)</option>
                    <option value="+244" className="bg-blue-800">+244 (Angola)</option>
                    <option value="+245" className="bg-blue-800">+245 (Guinea-Bisáu)</option>
                    <option value="+246" className="bg-blue-800">+246 (Territorio Británico del Océano Índico)</option>
                    <option value="+248" className="bg-blue-800">+248 (Seychelles)</option>
                    <option value="+249" className="bg-blue-800">+249 (Sudán)</option>
                    <option value="+250" className="bg-blue-800">+250 (Ruanda)</option>
                    <option value="+251" className="bg-blue-800">+251 (Etiopía)</option>
                    <option value="+252" className="bg-blue-800">+252 (Somalia)</option>
                    <option value="+253" className="bg-blue-800">+253 (Yibuti)</option>
                    <option value="+254" className="bg-blue-800">+254 (Kenia)</option>
                    <option value="+255" className="bg-blue-800">+255 (Tanzania)</option>
                    <option value="+256" className="bg-blue-800">+256 (Uganda)</option>
                    <option value="+257" className="bg-blue-800">+257 (Burundi)</option>
                    <option value="+258" className="bg-blue-800">+258 (Mozambique)</option>
                    <option value="+260" className="bg-blue-800">+260 (Zambia)</option>
                    <option value="+263" className="bg-blue-800">+263 (Zimbabue)</option>
                    <option value="+264" className="bg-blue-800">+264 (Namibia)</option>
                    <option value="+265" className="bg-blue-800">+265 (Malaui)</option>
                    <option value="+266" className="bg-blue-800">+266 (Lesoto)</option>
                    <option value="+268" className="bg-blue-800">+268 (Esuatini)</option>
                    <option value="+269" className="bg-blue-800">+269 (Comoras)</option>
                    <option value="+290" className="bg-blue-800">+290 (Santa Elena, Ascensión y Tristán de Acuña)</option>
                    <option value="+291" className="bg-blue-800">+291 (Eritrea)</option>
                    <option value="+297" className="bg-blue-800">+297 (Aruba)</option>
                    <option value="+298" className="bg-blue-800">+298 (Islas Feroe)</option>
                    <option value="+299" className="bg-blue-800">+299 (Groenlandia)</option>
                    <option value="+350" className="bg-blue-800">+350 (Gibraltar)</option>
                    <option value="+351" className="bg-blue-800">+351 (Portugal)</option>
                    <option value="+352" className="bg-blue-800">+352 (Luxemburgo)</option>
                    <option value="+353" className="bg-blue-800">+353 (Irlanda)</option>
                    <option value="+354" className="bg-blue-800">+354 (Islandia)</option>
                    <option value="+355" className="bg-blue-800">+355 (Albania)</option>
                    <option value="+356" className="bg-blue-800">+356 (Malta)</option>
                    <option value="+357" className="bg-blue-800">+357 (Chipre)</option>
                    <option value="+358" className="bg-blue-800">+358 (Finlandia)</option>
                    <option value="+359" className="bg-blue-800">+359 (Bulgaria)</option>
                    <option value="+370" className="bg-blue-800">+370 (Lituania)</option>
                    <option value="+371" className="bg-blue-800">+371 (Letonia)</option>
                    <option value="+372" className="bg-blue-800">+372 (Estonia)</option>
                    <option value="+373" className="bg-blue-800">+373 (Moldavia)</option>
                    <option value="+374" className="bg-blue-800">+374 (Armenia)</option>
                    <option value="+375" className="bg-blue-800">+375 (Bielorrusia)</option>
                    <option value="+376" className="bg-blue-800">+376 (Andorra)</option>
                    <option value="+377" className="bg-blue-800">+377 (Mónaco)</option>
                    <option value="+378" className="bg-blue-800">+378 (San Marino)</option>
                    <option value="+380" className="bg-blue-800">+380 (Ucrania)</option>
                    <option value="+381" className="bg-blue-800">+381 (Serbia)</option>
                    <option value="+382" className="bg-blue-800">+382 (Montenegro)</option>
                    <option value="+385" className="bg-blue-800">+385 (Croacia)</option>
                    <option value="+386" className="bg-blue-800">+386 (Eslovenia)</option>
                    <option value="+387" className="bg-blue-800">+387 (Bosnia y Herzegovina)</option>
                    <option value="+389" className="bg-blue-800">+389 (Macedonia del Norte)</option>
                    <option value="+420" className="bg-blue-800">+420 (República Checa)</option>
                    <option value="+421" className="bg-blue-800">+421 (Eslovaquia)</option>
                    <option value="+423" className="bg-blue-800">+423 (Liechtenstein)</option>
                    <option value="+500" className="bg-blue-800">+500 (Islas Malvinas)</option>
                    <option value="+501" className="bg-blue-800">+501 (Belice)</option>
                    <option value="+502" className="bg-blue-800">+502 (Guatemala)</option>
                    <option value="+503" className="bg-blue-800">+503 (El Salvador)</option>
                    <option value="+504" className="bg-blue-800">+504 (Honduras)</option>
                    <option value="+505" className="bg-blue-800">+505 (Nicaragua)</option>
                    <option value="+506" className="bg-blue-800">+506 (Costa Rica)</option>
                    <option value="+507" className="bg-blue-800">+507 (Panamá)</option>
                    <option value="+508" className="bg-blue-800">+508 (San Pedro y Miquelón)</option>
                    <option value="+509" className="bg-blue-800">+509 (Haití)</option>
                    <option value="+590" className="bg-blue-800">+590 (Guadalupe, San Bartolomé, San Martín)</option>
                    <option value="+591" className="bg-blue-800">+591 (Bolivia)</option>
                    <option value="+592" className="bg-blue-800">+592 (Guyana)</option>
                    <option value="+593" className="bg-blue-800">+593 (Ecuador)</option>
                    <option value="+594" className="bg-blue-800">+594 (Guayana Francesa)</option>
                    <option value="+595" className="bg-blue-800">+595 (Paraguay)</option>
                    <option value="+597" className="bg-blue-800">+597 (Surinam)</option>
                    <option value="+598" className="bg-blue-800">+598 (Uruguay)</option>
                    <option value="+599" className="bg-blue-800">+599 (Caribe Neerlandés)</option>
                    <option value="+670" className="bg-blue-800">+670 (Timor Oriental)</option>
                    <option value="+672" className="bg-blue-800">+672 (Territorios Externos de Australia)</option>
                    <option value="+673" className="bg-blue-800">+673 (Brunéi)</option>
                    <option value="+674" className="bg-blue-800">+674 (Nauru)</option>
                    <option value="+675" className="bg-blue-800">+675 (Papúa Nueva Guinea)</option>
                    <option value="+676" className="bg-blue-800">+676 (Tonga)</option>
                    <option value="+677" className="bg-blue-800">+677 (Islas Salomón)</option>
                    <option value="+678" className="bg-blue-800">+678 (Vanuatu)</option>
                    <option value="+679" className="bg-blue-800">+679 (Fiyi)</option>
                    <option value="+680" className="bg-blue-800">+680 (Palaos)</option>
                    <option value="+681" className="bg-blue-800">+681 (Wallis y Futuna)</option>
                    <option value="+682" className="bg-blue-800">+682 (Islas Cook)</option>
                    <option value="+683" className="bg-blue-800">+683 (Niue)</option>
                    <option value="+685" className="bg-blue-800">+685 (Samoa)</option>
                    <option value="+686" className="bg-blue-800">+686 (Kiribati)</option>
                    <option value="+687" className="bg-blue-800">+687 (Nueva Caledonia)</option>
                    <option value="+688" className="bg-blue-800">+688 (Tuvalu)</option>
                    <option value="+689" className="bg-blue-800">+689 (Polinesia Francesa)</option>
                    <option value="+690" className="bg-blue-800">+690 (Tokelau)</option>
                    <option value="+691" className="bg-blue-800">+691 (Micronesia)</option>
                    <option value="+692" className="bg-blue-800">+692 (Islas Marshall)</option>
                    <option value="+850" className="bg-blue-800">+850 (Corea del Norte)</option>
                    <option value="+852" className="bg-blue-800">+852 (Hong Kong)</option>
                    <option value="+853" className="bg-blue-800">+853 (Macao)</option>
                    <option value="+855" className="bg-blue-800">+855 (Camboya)</option>
                    <option value="+856" className="bg-blue-800">+856 (Laos)</option>
                    <option value="+880" className="bg-blue-800">+880 (Bangladés)</option>
                    <option value="+886" className="bg-blue-800">+886 (Taiwán)</option>
                    <option value="+960" className="bg-blue-800">+960 (Maldivas)</option>
                    <option value="+961" className="bg-blue-800">+961 (Líbano)</option>
                    <option value="+962" className="bg-blue-800">+962 (Jordania)</option>
                    <option value="+963" className="bg-blue-800">+963 (Siria)</option>
                    <option value="+964" className="bg-blue-800">+964 (Irak)</option>
                    <option value="+965" className="bg-blue-800">+965 (Kuwait)</option>
                    <option value="+966" className="bg-blue-800">+966 (Arabia Saudita)</option>
                    <option value="+967" className="bg-blue-800">+967 (Yemen)</option>
                    <option value="+968" className="bg-blue-800">+968 (Omán)</option>
                    <option value="+970" className="bg-blue-800">+970 (Palestina)</option>
                    <option value="+971" className="bg-blue-800">+971 (Emiratos Árabes Unidos)</option>
                    <option value="+972" className="bg-blue-800">+972 (Israel)</option>
                    <option value="+973" className="bg-blue-800">+973 (Bahréin)</option>
                    <option value="+974" className="bg-blue-800">+974 (Catar)</option>
                    <option value="+975" className="bg-blue-800">+975 (Bután)</option>
                    <option value="+976" className="bg-blue-800">+976 (Mongolia)</option>
                    <option value="+977" className="bg-blue-800">+977 (Nepal)</option>
                    <option value="+992" className="bg-blue-800">+992 (Tayikistán)</option>
                    <option value="+993" className="bg-blue-800">+993 (Turkmenistán)</option>
                    <option value="+994" className="bg-blue-800">+994 (Azerbaiyán)</option>
                    <option value="+995" className="bg-blue-800">+995 (Georgia)</option>
                    <option value="+996" className="bg-blue-800">+996 (Kirguistán)</option>
                    <option value="+998" className="bg-blue-800">+998 (Uzbekistán)</option>
                    <option value="+1-242" className="bg-blue-800">+1-242 (Bahamas)</option>
                    <option value="+1-246" className="bg-blue-800">+1-246 (Barbados)</option>
                    <option value="+1-264" className="bg-blue-800">+1-264 (Anguila)</option>
                    <option value="+1-268" className="bg-blue-800">+1-268 (Antigua y Barbuda)</option>
                    <option value="+1-345" className="bg-blue-800">+1-345 (Islas Caimán)</option>
                    <option value="+1-441" className="bg-blue-800">+1-441 (Bermudas)</option>
                    <option value="+1-473" className="bg-blue-800">+1-473 (Granada)</option>
                    <option value="+1-664" className="bg-blue-800">+1-664 (Montserrat)</option>
                    <option value="+1-767" className="bg-blue-800">+1-767 (Dominica)</option>
                    <option value="+1-784" className="bg-blue-800">+1-784 (San Vicente y las Granadinas)</option>
                    <option value="+1-869" className="bg-blue-800">+1-869 (San Cristóbal y Nieves)</option>
                    <option value="+1-758" className="bg-blue-800">+1-758 (Santa Lucía)</option>
                    <option value="+1-809" className="bg-blue-800">+1-809 (República Dominicana)</option>
                    <option value="+1-829" className="bg-blue-800">+1-829 (República Dominicana)</option>
                    <option value="+1-849" className="bg-blue-800">+1-849 (República Dominicana)</option>
                    <option value="+1-868" className="bg-blue-800">+1-868 (Trinidad y Tobago)</option>
                    <option value="+1-876" className="bg-blue-800">+1-876 (Jamaica)</option>
                    <option value="+1-671" className="bg-blue-800">+1-671 (Guam)</option>
                    <option value="+1-684" className="bg-blue-800">+1-684 (Samoa Americana)</option>
                    <option value="+1-787" className="bg-blue-800">+1-787 (Puerto Rico)</option>
                    <option value="+1-939" className="bg-blue-800">+1-939 (Puerto Rico)</option>
                    <option value="+1-284" className="bg-blue-800">+1-284 (Islas Vírgenes Británicas)</option>
                    <option value="+1-340" className="bg-blue-800">+1-340 (Islas Vírgenes de los Estados Unidos)</option>
                    <option value="+47-79" className="bg-blue-800">+47-79 (Svalbard y Jan Mayen)</option>
                    <option value="+290-8" className="bg-blue-800">+290-8 (Tristán de Acuña)</option>
                    <option value="+599-3" className="bg-blue-800">+599-3 (Sint Eustatius)</option>
                    <option value="+599-4" className="bg-blue-800">+599-4 (Saba)</option>
                    <option value="+599-7" className="bg-blue-800">+599-7 (Bonaire)</option>
                    <option value="+599-9" className="bg-blue-800">+599-9 (Curazao)</option>
                    <option value="+672-1" className="bg-blue-800">+672-1 (Isla Norfolk)</option>
                    <option value="+672-3" className="bg-blue-800">+672-3 (Territorio Antártico Australiano)</option>
                    <option value="+672-4" className="bg-blue-800">+672-4 (Isla Macquarie)</option>
                    <option value="+681" className="bg-blue-800">+681 (Wallis y Futuna)</option>
                    <option value="+690" className="bg-blue-800">+690 (Tokelau)</option>
                    <option value="+691" className="bg-blue-800">+691 (Micronesia)</option>
                    <option value="+692" className="bg-blue-800">+692 (Islas Marshall)</option>
                    <option value="+886" className="bg-blue-800">+886 (Taiwán)</option>
                    <option value="+590" className="bg-blue-800">+590 (San Bartolomé, San Martín)</option>
                    <option value="+689" className="bg-blue-800">+689 (Polinesia Francesa)</option>
                    <option value="+246" className="bg-blue-800">+246 (Territorio Británico del Océano Índico)</option>
                    <option value="+290" className="bg-blue-800">+290 (Santa Elena)</option>
                    <option value="+508" className="bg-blue-800">+508 (San Pedro y Miquelón)</option>
                    <option value="+672" className="bg-blue-800">+672 (Isla Norfolk)</option>
                    <option value="+683" className="bg-blue-800">+683 (Niue)</option>
                    <option value="+690" className="bg-blue-800">+690 (Tokelau)</option>
                    <option value="+691" className="bg-blue-800">+691 (Micronesia)</option>
                    <option value="+692" className="bg-blue-800">+692 (Islas Marshall)</option>
                    <option value="+850" className="bg-blue-800">+850 (Corea del Norte)</option>
                    <option value="+855" className="bg-blue-800">+855 (Camboya)</option>
                    <option value="+856" className="bg-blue-800">+856 (Laos)</option>
                    <option value="+880" className="bg-blue-800">+880 (Bangladés)</option>
                    <option value="+960" className="bg-blue-800">+960 (Maldivas)</option>
                    <option value="+961" className="bg-blue-800">+961 (Líbano)</option>
                    <option value="+962" className="bg-blue-800">+962 (Jordania)</option>
                    <option value="+963" className="bg-blue-800">+963 (Siria)</option>
                    <option value="+964" className="bg-blue-800">+964 (Irak)</option>
                    <option value="+965" className="bg-blue-800">+965 (Kuwait)</option>
                    <option value="+966" className="bg-blue-800">+966 (Arabia Saudita)</option>
                    <option value="+967" className="bg-blue-800">+967 (Yemen)</option>
                    <option value="+968" className="bg-blue-800">+968 (Omán)</option>
                    <option value="+970" className="bg-blue-800">+970 (Palestina)</option>
                    <option value="+971" className="bg-blue-800">+971 (Emiratos Árabes Unidos)</option>
                    <option value="+972" className="bg-blue-800">+972 (Israel)</option>
                    <option value="+973" className="bg-blue-800">+973 (Bahréin)</option>
                    <option value="+974" className="bg-blue-800">+974 (Catar)</option>
                    <option value="+975" className="bg-blue-800">+975 (Bután)</option>
                    <option value="+976" className="bg-blue-800">+976 (Mongolia)</option>
                    <option value="+977" className="bg-blue-800">+977 (Nepal)</option>
                    <option value="+992" className="bg-blue-800">+992 (Tayikistán)</option>
                    <option value="+993" className="bg-blue-800">+993 (Turkmenistán)</option>
                    <option value="+994" className="bg-blue-800">+994 (Azerbaiyán)</option>
                    <option value="+995" className="bg-blue-800">+995 (Georgia)</option>
                    <option value="+996" className="bg-blue-800">+996 (Kirguistán)</option>
                    <option value="+998" className="bg-blue-800">+998 (Uzbekistán)</option>
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
              <p className="text-red-400 text-xs mt-1">Número de contacto principal. Recomendamos formato internacional para WhatsApp (ej: +54 9 XXX ...).</p>
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
              <p className="text-red-400 text-xs mt-1 ml-1">URL completa (ej: https://www.tuempresa.com). Requerido para ciertas funciones.</p>
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
            <p className="text-red-400 text-xs mt-1">Sector principal de actividad de tu empresa.</p>
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
              <p className="text-red-400 text-xs mt-1 ml-1">Rango de empleados de tu empresa.</p>
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