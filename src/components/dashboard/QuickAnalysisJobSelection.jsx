import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

const QuickAnalysisJobSelection = ({
  selectedJob,
  searchTerm,
  setSearchTerm,
  isDialogOpen,
  setIsDialogOpen,
  filteredJobs,
  handleSelectJob,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold text-slate-700 mb-4">1. Selecciona un Puesto de Trabajo</h3>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selectedJob ? selectedJob.title : "Seleccionar Puesto"}
            <Search className="ml-2 h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Seleccionar Puesto de Trabajo</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Input
              placeholder="Buscar puestos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            <ScrollArea className="h-[300px]">
              {filteredJobs.length > 0 ? (
                <div className="space-y-2">
                  {filteredJobs.map((job) => (
                    <Button
                      key={job.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleSelectJob(job)}
                    >
                      {job.title}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500">No se encontraron puestos.</p>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
      {selectedJob && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm font-medium text-blue-800">Puesto Seleccionado:</p>
          <p className="text-md text-blue-900 font-semibold">{selectedJob.title}</p>
        </div>
      )}
    </div>
  );
};

export default QuickAnalysisJobSelection;