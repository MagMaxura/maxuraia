import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase'; // Importar cliente Supabase directamente
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';

function SupabaseTestPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [testResults, setTestResults] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados para entrada manual
  const [manualUserId, setManualUserId] = useState('');
  const [manualUserEmail, setManualUserEmail] = useState('');

  // Usar valores manuales si están presentes, sino los del usuario autenticado
  const effectiveUserId = manualUserId || authUser?.id;
  const effectiveUserEmail = manualUserEmail || authUser?.email;

  const handleTestInsert = async () => {
    if (!effectiveUserId || !effectiveUserEmail) {
      toast({ title: "Error", description: "ID de Usuario y Email son requeridos para la prueba.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setTestResults('Intentando INSERT...');
    try {
      const testData = {
        id: effectiveUserId,
        email: effectiveUserEmail,
        first_name: 'TestFirstName',
        last_name: 'TestLastName',
        company: 'TestCompany',
        created_at: new Date().toISOString(),
        // Añade otros campos requeridos por tu tabla con valores de prueba
      };
      console.log('[SupabaseTestPage] Datos para INSERT:', testData);
      const { data, error } = await supabase
        .from('reclutadores')
        .insert([testData])
        .select()
        .single();

      if (error) {
        console.error('[SupabaseTestPage] Error en INSERT:', error);
        setTestResults(`Error en INSERT: ${JSON.stringify(error, null, 2)}`);
        toast({ title: "Error en INSERT", description: error.message, variant: "destructive" });
      } else {
        console.log('[SupabaseTestPage] Éxito en INSERT:', data);
        setTestResults(`Éxito en INSERT: ${JSON.stringify(data, null, 2)}`);
        toast({ title: "Éxito en INSERT", description: "Registro insertado." });
      }
    } catch (e) {
      console.error('[SupabaseTestPage] Excepción en INSERT:', e);
      setTestResults(`Excepción en INSERT: ${e.message}`);
      toast({ title: "Excepción en INSERT", description: e.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleTestSelect = async () => {
    if (!effectiveUserId) {
      toast({ title: "Error", description: "ID de Usuario es requerido para la prueba.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setTestResults('Intentando SELECT...');
    try {
      console.log('[SupabaseTestPage] Intentando SELECT para ID:', effectiveUserId);
      const { data, error } = await supabase
        .from('reclutadores')
        .select('*')
        .eq('id', effectiveUserId)
        .maybeSingle(); // Usar maybeSingle para no fallar si no existe

      if (error) {
        console.error('[SupabaseTestPage] Error en SELECT:', error);
        setTestResults(`Error en SELECT: ${JSON.stringify(error, null, 2)}`);
        toast({ title: "Error en SELECT", description: error.message, variant: "destructive" });
      } else {
        console.log('[SupabaseTestPage] Éxito en SELECT:', data);
        setTestResults(data ? `Éxito en SELECT: ${JSON.stringify(data, null, 2)}` : 'Éxito en SELECT: No se encontró registro.');
        toast({ title: "Éxito en SELECT", description: data ? "Registro encontrado." : "No se encontró registro." });
      }
    } catch (e) {
      console.error('[SupabaseTestPage] Excepción en SELECT:', e);
      setTestResults(`Excepción en SELECT: ${e.message}`);
      toast({ title: "Excepción en SELECT", description: e.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleTestUpdate = async () => {
    if (!effectiveUserId) {
      toast({ title: "Error", description: "ID de Usuario es requerido para la prueba.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setTestResults('Intentando UPDATE...');
    try {
      const updateData = {
        company: `UpdatedCompany ${new Date().toLocaleTimeString()}`,
        // Puedes añadir más campos para actualizar
      };
      console.log('[SupabaseTestPage] Datos para UPDATE:', updateData);
      const { data, error } = await supabase
        .from('reclutadores')
        .update(updateData)
        .eq('id', effectiveUserId)
        .select()
        .single(); // Usar single si esperas que la fila exista y se actualice

      if (error) {
        console.error('[SupabaseTestPage] Error en UPDATE:', error);
        setTestResults(`Error en UPDATE: ${JSON.stringify(error, null, 2)}`);
        toast({ title: "Error en UPDATE", description: error.message, variant: "destructive" });
      } else {
        console.log('[SupabaseTestPage] Éxito en UPDATE:', data);
        setTestResults(`Éxito en UPDATE: ${JSON.stringify(data, null, 2)}`);
        toast({ title: "Éxito en UPDATE", description: "Registro actualizado." });
      }
    } catch (e) {
      console.error('[SupabaseTestPage] Excepción en UPDATE:', e);
      setTestResults(`Excepción en UPDATE: ${e.message}`);
      toast({ title: "Excepción en UPDATE", description: e.message, variant: "destructive" });
    }
    setIsLoading(false);
  };
  
  const handleDelete = async () => {
    if (!effectiveUserId) {
      toast({ title: "Error", description: "ID de Usuario es requerido para la prueba.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setTestResults('Intentando DELETE...');
    try {
      console.log('[SupabaseTestPage] Intentando DELETE para ID:', effectiveUserId);
      const { error } = await supabase
        .from('reclutadores')
        .delete()
        .eq('id', effectiveUserId);

      if (error) {
        console.error('[SupabaseTestPage] Error en DELETE:', error);
        setTestResults(`Error en DELETE: ${JSON.stringify(error, null, 2)}`);
        toast({ title: "Error en DELETE", description: error.message, variant: "destructive" });
      } else {
        console.log('[SupabaseTestPage] Éxito en DELETE');
        setTestResults('Éxito en DELETE: Registro eliminado (si existía).');
        toast({ title: "Éxito en DELETE", description: "Registro eliminado." });
      }
    } catch (e) {
      console.error('[SupabaseTestPage] Excepción en DELETE:', e);
      setTestResults(`Excepción en DELETE: ${e.message}`);
      toast({ title: "Excepción en DELETE", description: e.message, variant: "destructive" });
    }
    setIsLoading(false);
  };


  if (authLoading) {
    return <div className="p-4">Cargando autenticación...</div>;
  }

  if (!authUser) {
    return <div className="p-4">Por favor, inicia sesión para usar esta página de prueba.</div>;
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Página de Prueba de Supabase - Tabla 'reclutadores'</h1>
      
      <div className="my-4 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Datos del Usuario Autenticado (si existe):</h2>
        <p>ID: {authUser?.id || 'N/A'}</p>
        <p>Email: {authUser?.email || 'N/A'}</p>
        <p>Email Confirmado: {authUser?.email_confirmed_at ? `Sí (en ${new Date(authUser.email_confirmed_at).toLocaleString()})` : 'No (o N/A)'}</p>
      </div>

      <div className="my-4 p-4 border rounded space-y-2">
        <h2 className="text-lg font-semibold mb-2">Entrada Manual para Pruebas (Opcional):</h2>
        <div>
          <label htmlFor="manualId" className="block text-sm font-medium">ID de Usuario Manual:</label>
          <input
            type="text"
            id="manualId"
            value={manualUserId}
            onChange={(e) => setManualUserId(e.target.value)}
            placeholder="Ingresa UUID de usuario"
            className="mt-1 block w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="manualEmail" className="block text-sm font-medium">Email Manual:</label>
          <input
            type="email"
            id="manualEmail"
            value={manualUserEmail}
            onChange={(e) => setManualUserEmail(e.target.value)}
            placeholder="Ingresa email"
            className="mt-1 block w-full p-2 border rounded"
          />
        </div>
        <p className="text-xs text-gray-600">Si dejas estos campos vacíos, se usarán los datos del usuario autenticado (si hay uno).</p>
      </div>
      
      <p className="font-semibold">Probando con ID: {effectiveUserId || 'N/A'}, Email: {effectiveUserEmail || 'N/A'}</p>

      <div className="space-x-2">
        <Button onClick={handleTestInsert} disabled={isLoading || !effectiveUserId || !effectiveUserEmail}>
          {isLoading ? 'Probando...' : 'Probar INSERT'}
        </Button>
        <Button onClick={handleTestSelect} disabled={isLoading || !effectiveUserId}>
          {isLoading ? 'Probando...' : 'Probar SELECT'}
        </Button>
        <Button onClick={handleTestUpdate} disabled={isLoading || !effectiveUserId}>
          {isLoading ? 'Probando...' : 'Probar UPDATE'}
        </Button>
         <Button onClick={handleDelete} variant="destructive" disabled={isLoading || !effectiveUserId}>
          {isLoading ? 'Eliminando...' : 'Probar DELETE'}
        </Button>
      </div>

      <div className="mt-4 p-4 border rounded bg-gray-50 min-h-[100px]">
        <h2 className="font-semibold">Resultados:</h2>
        <pre className="text-sm whitespace-pre-wrap">{testResults}</pre>
      </div>
    </div>
  );
}

export default SupabaseTestPage;