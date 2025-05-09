
import React from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

function RegisterConfirmation() {
  const navigate = useNavigate();
  // const location = useLocation(); // Ya no necesitamos userData del state
  // const userData = location.state?.userData;

  // Ya no necesitamos esta verificación, la página siempre mostrará el mensaje de confirmación.
  // if (!userData) {
  //   navigate('/register');
  //   return null;
  // }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-lg rounded-xl p-8 w-full max-w-lg text-center space-y-6 border border-white/20"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </motion.div>

        <h2 className="text-3xl font-bold text-white">¡Registro Exitoso!</h2>
        
        <div className="space-y-4 text-white/80">
          <p>
            ¡Gracias por registrarte en HR Intelligence!
          </p>
          <p>
            Para completar el proceso y activar tu cuenta, por favor revisa tu bandeja de entrada (y la carpeta de spam) por un correo de confirmación.
          </p>
          <p>
            Haz clic en el enlace dentro del correo para verificar tu dirección de email.
          </p>
        </div>

        {/* Opcional: Podrías mostrar el email si lo pasas de otra forma o lo obtienes del contexto/localStorage */}
        {/* <div className="bg-white/5 rounded-lg p-4 mt-6">
          <p className="text-white/70 text-sm">
            Correo enviado a: tu.email@ejemplo.com
          </p>
        </div> */}

        <Button
          onClick={() => navigate('/login')} // Es más común redirigir a login después de este mensaje
          className="w-full bg-white text-blue-600 hover:bg-white/90 mt-6"
          size="lg"
        >
          Ir al Dashboard
        </Button>
      </motion.div>
    </div>
  );
}

export default RegisterConfirmation;
