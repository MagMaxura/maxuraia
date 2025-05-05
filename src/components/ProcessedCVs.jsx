
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import CVAnalysis from "@/components/CVAnalysis";

function ProcessedCVs() {
  const [cvs, setCvs] = useState([]);
  const [selectedCV, setSelectedCV] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Por ahora cargamos desde localStorage, después migraremos a Supabase
    const savedCVs = JSON.parse(localStorage.getItem('cvs') || '[]');
    setCvs(savedCVs);
  }, []);

  const filteredCVs = cvs.filter(cv => 
    cv.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cv.habilidades.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="linkedin-section p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">CVs Procesados</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nombre o habilidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-100 rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredCVs.map((cv) => (
            <motion.div
              key={cv.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                selectedCV?.id === cv.id
                  ? "bg-blue-50 border-2 border-blue-500"
                  : "bg-white border border-gray-200 hover:shadow-md"
              }`}
              onClick={() => setSelectedCV(cv)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{cv.nombre}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(cv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="text-blue-600 hover:bg-blue-50"
                  onClick={() => setSelectedCV(cv)}
                >
                  Ver detalles
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {selectedCV && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="linkedin-section p-6"
        >
          <CVAnalysis analysis={selectedCV} />
        </motion.section>
      )}
    </div>
  );
}

export default ProcessedCVs;
