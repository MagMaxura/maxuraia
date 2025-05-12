import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';

function PublishedJobsTab({ jobs, isLoadingJobs, setActiveTab }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="bg-white p-6 md:p-8 rounded-xl shadow-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Puestos de Trabajo Publicados</h2>
        <Button onClick={() => setActiveTab('nuevoPuesto')} variant="outline" size="sm" className="flex items-center">
          <Briefcase className="mr-2 h-4 w-4" /> Crear Nuevo Puesto
        </Button>
      </div>

      {isLoadingJobs && (
        <p className="text-slate-500 text-sm text-center py-4">Cargando puestos de trabajo...</p>
      )}

      {!isLoadingJobs && jobs.length === 0 && (
        <div className="text-center py-10">
          <Briefcase className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-lg font-medium text-slate-800">No hay puestos publicados</h3>
          <p className="mt-1 text-sm text-slate-500">Empieza creando tu primer puesto de trabajo.</p>
          <Button onClick={() => setActiveTab('nuevoPuesto')} className="mt-6">
            Crear Nuevo Puesto
          </Button>
        </div>
      )}

      {!isLoadingJobs && jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div 
              key={job.id} 
              className="bg-slate-50 p-5 rounded-lg border border-slate-200 hover:shadow-lg transition-shadow duration-200 ease-in-out cursor-pointer"
              // onClick={() => console.log("Abrir detalle de puesto:", job.id)} // Futura funcionalidad
            >
              <h3 className="text-slate-800 font-semibold text-lg truncate" title={job.title}>{job.title}</h3>
              <p className="text-slate-600 text-sm mt-2 line-clamp-3 h-16">{job.description}</p> 
              {/* Añadir más detalles si es necesario, como fecha de creación, estado, etc. */}
              <p className="text-xs text-slate-400 mt-3">Publicado el: {new Date(job.created_at).toLocaleDateString('es-ES')}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default PublishedJobsTab;