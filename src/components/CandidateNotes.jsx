import React, { useState, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

function CandidateNotes({ candidateId, initialNotes, onSave, isSaving }) {
  const [notes, setNotes] = useState(initialNotes || "");
  const { toast } = useToast();

  useEffect(() => {
    setNotes(initialNotes || "");
  }, [initialNotes]);

  const handleSave = async () => {
    if (notes === initialNotes) {
      toast({
        title: "Sin cambios",
        description: "No hay cambios para guardar en las notas.",
      });
      return;
    }
    await onSave(candidateId, notes);
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-xl h-full flex flex-col">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Notas del Candidato</h3>
      <Textarea
        placeholder="Agrega tus notas aquí (ej. fecha de entrevista, impresiones, seguimiento)..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="flex-grow mb-4 min-h-[150px]"
      />
      <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
        {isSaving ? "Guardando..." : "Guardar Notas"}
      </Button>
    </div>
  );
}

export default CandidateNotes;