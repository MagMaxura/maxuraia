import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Briefcase, Edit, Trash2 } from 'lucide-react'; // Importar iconos
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import { useTranslation } from 'react-i18next';

function PublishedJobsTab({ jobs, isLoadingJobs, onEditJob, onDeleteJob, currentJobCount, effectiveLimits }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 md:p-8 rounded-xl shadow-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">{t('published_jobs_title')}</h2>
        <Button onClick={() => navigate('/dashboard/nuevo-puesto')} variant="outline" size="sm" className="flex items-center">
          <Briefcase className="mr-2 h-4 w-4" /> {t('create_new_job_button_text')}
        </Button>
      </div>

      {/* Barra de progreso de Puestos Publicados */}
      {effectiveLimits?.jobLimit !== Infinity && effectiveLimits?.jobLimit > 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg relative mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              {t('jobs_published_this_period')}: {currentJobCount} {t('of')} {effectiveLimits.jobLimit}
            </span>
            <span className="text-sm font-medium">
              {((currentJobCount / effectiveLimits.jobLimit) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${(currentJobCount / effectiveLimits.jobLimit) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {effectiveLimits?.jobLimit === Infinity && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg relative mb-6">
          <span className="text-sm font-medium">
            {t('jobs_published_this_period')}: {currentJobCount} ({t('unlimited')})
          </span>
        </div>
      )}
      

      {isLoadingJobs && (
        <p className="text-slate-500 text-sm text-center py-4">{t('loading_job_posts')}</p>
      )}

      {!isLoadingJobs && jobs.length === 0 && (
        <div className="text-center py-10">
          <Briefcase className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-lg font-medium text-slate-800">{t('no_jobs_published_title')}</h3>
          <p className="mt-1 text-sm text-slate-500">{t('start_by_creating_first_job')}</p>
          <Button onClick={() => navigate('/dashboard/nuevo-puesto')} className="mt-6">
            {t('create_new_job_button_text')}
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
              <p className="text-xs text-slate-400 mt-3">{t('published_on')}: {new Date(job.created_at).toLocaleDateString('es-ES')}</p>
              {/* Contenedor para los botones de acción */}
              <div className="flex justify-end space-x-2 mt-4">
                 <Button
                   variant="ghost"
                   size="sm"
                   className="text-blue-600 hover:bg-blue-100 hover:text-blue-700 px-2 py-1"
                   onClick={(e) => {
                     e.stopPropagation(); // Evitar que el click se propague al div padre (si tuviera un onClick)
                     onEditJob(job);
                   }}
                   aria-label={t('modify_job_aria_label', { jobTitle: job.title })}
                 >
                   <Edit className="h-4 w-4" />
                 </Button>
                 <Button
                   variant="ghost"
                   size="sm"
                   className="text-red-600 hover:bg-red-100 hover:text-red-700 px-2 py-1"
                   onClick={(e) => {
                     e.stopPropagation();
                     onDeleteJob(job.id);
                   }}
                   aria-label={t('delete_job_aria_label', { jobTitle: job.title })}
                 >
                   <Trash2 className="h-4 w-4" />
                 </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default PublishedJobsTab;
