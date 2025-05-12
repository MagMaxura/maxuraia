import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext'; // Para acceder a user.suscripcion

function CurrentPlanTab() {
  const { user } = useAuth();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="bg-white p-6 md:p-8 rounded-xl shadow-xl"
    >
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Detalles de tu Plan</h2>
      {user && user.suscripcion ? (
        <div className="space-y-5 text-slate-700">
          <div>
            <p className="text-sm font-medium text-slate-500">Plan Contratado:</p>
            <p className="text-xl font-semibold capitalize text-blue-600">{user.suscripcion.plan_id || "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Estado:</p>
            <p className="text-lg capitalize">{user.suscripcion.status || "No disponible"}</p>
          </div>
          
          {user.suscripcion.status === 'trialing' && user.suscripcion.trial_ends_at && (
            <div>
              <p className="text-sm font-medium text-slate-500">Tu prueba gratuita finaliza el:</p>
              <p className="text-lg">{new Date(user.suscripcion.trial_ends_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          )}

          {user.suscripcion.status === 'active' && user.suscripcion.current_period_start && (
             <div>
              <p className="text-sm font-medium text-slate-500">Período actual desde:</p>
              <p className="text-lg">{new Date(user.suscripcion.current_period_start).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          )}

          {user.suscripcion.status === 'active' && user.suscripcion.current_period_end && (
             <div>
              <p className="text-sm font-medium text-slate-500">Próxima fecha de renovación:</p>
              <p className="text-lg">{new Date(user.suscripcion.current_period_end).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          )}
          
           {user.suscripcion.created_at && (
            <div>
              <p className="text-sm font-medium text-slate-500">Suscripción (o prueba) iniciada el:</p>
              <p className="text-lg">{new Date(user.suscripcion.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
           )}

        </div>
      ) : (
        <p className="text-slate-500">No se pudo cargar la información de tu plan. Si el problema persiste, contacta a soporte.</p>
      )}
    </motion.div>
  );
}

export default CurrentPlanTab;