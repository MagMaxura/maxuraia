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

  const testUserId = authUser?.id;
  const testUserEmail = authUser?.email;

  const handleTestInsert = async () => {
    if (!testUserId || !testUserEmail) {
      toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setTestResults('Intentando INSERT...');
    try {
      const testData = {
        id: testUserId,
        email: testUserEmail,
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
    if (!testUserId) {
      toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setTestResults('Intentando SELECT...');
    try {
      console.log('[SupabaseTestPage] Intentando SELECT para ID:', testUserId);
      const { data, error } = await supabase
        .from('reclutadores')
        .select('*')
        .eq('id', testUserId)
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
    if (!testUserId) {
      toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
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
        .eq('id', testUserId)
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
    if (!testUserId) {
      toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setTestResults('Intentando DELETE...');
    try {
      console.log('[SupabaseTestPage] Intentando DELETE para ID:', testUserId);
      const { error } = await supabase
        .from('reclutadores')
        .delete()
        .eq('id', testUserId);

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
      <p>Usuario ID: {testUserId}</p>
      <p>Usuario Email: {testUserEmail}</p>
      
      <div className="space-x-2">
        <Button onClick={handleTestInsert} disabled={isLoading || !testUserId}>
          {isLoading ? 'Probando...' : 'Probar INSERT'}
        </Button>
        <Button onClick={handleTestSelect} disabled={isLoading || !testUserId}>
          {isLoading ? 'Probando...' : 'Probar SELECT'}
        </Button>
        <Button onClick={handleTestUpdate} disabled={isLoading || !testUserId}>
          {isLoading ? 'Probando...' : 'Probar UPDATE'}
        </Button>
         <Button onClick={handleDelete} variant="destructive" disabled={isLoading || !testUserId}>
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