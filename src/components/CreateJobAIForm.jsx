import React, { useState } from 'react';
import { Button } from "@/components/ui/button.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Loader2 } from 'lucide-react';
import { generateJobFromPrompt } from '@/lib/jobGeneration.js';
import { useToast } from "@/components/ui/use-toast.js";

function CreateJobAIForm({ onJobGenerated, setIsLoadingParent }) {
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!promptText.trim()) {
      toast({ title: "Entrada vacía", description: "Por favor, ingresa una descripción del puesto.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    if (setIsLoadingParent) setIsLoadingParent(true); // Notificar al padre que estamos procesando

    try {
      const generatedJobData = await generateJobFromPrompt(promptText);
      if (onJobGenerated) {
        onJobGenerated(generatedJobData);
      }
      toast({ title: "¡Oferta generada!", description: "Revisa y ajusta los detalles a continuación." });
    } catch (error) {
      console.error("Error al generar oferta con IA:", error);
      toast({ title: "Error de IA", description: `No se pudo generar la oferta: ${error.message}`, variant: "destructive" });
    } finally {
      setIsGenerating(false);
      if (setIsLoadingParent) setIsLoadingParent(false);
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6 bg-white rounded-xl shadow-xl border mb-6">
      <h3 className="text-lg font-semibold text-gray-800">Asistente IA para Creación de Puestos</h3>
      <div>
        <label htmlFor="aiPrompt" className="block text-sm font-medium text-gray-700 mb-1">
          Describe el puesto o perfil deseado:
        </label>
        <Textarea
          id="aiPrompt"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Ej: Busco un desarrollador frontend con 3 años de experiencia en React, TypeScript y buenas prácticas de UI/UX para un proyecto innovador en el sector fintech. Debe ser proactivo y con capacidad de trabajo en equipo..."
          rows={5}
          className="mt-1"
          disabled={isGenerating}
        />
        <p className="text-xs text-gray-500 mt-1">Cuanto más detallada sea tu descripción, mejor será el resultado de la IA.</p>
      </div>
      <Button onClick={handleGenerate} disabled={isGenerating || !promptText.trim()} className="w-full md:w-auto bg-green-600 hover:bg-green-700">
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generando...
          </>
        ) : (
          "Generar con IA"
        )}
      </Button>
    </div>
  );
}

export default CreateJobAIForm;