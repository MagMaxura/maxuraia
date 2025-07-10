import React, { useState } from 'react';
import { useAuth as useAppAuth } from '../contexts/AuthContext'; // Renombrar para evitar conflicto
import { supabase } from '../lib/supabase';
import { auth as authFunctions } from '../lib/auth'; // Importar funciones de auth.js
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';

function SupabaseTestPage() {
  // Usamos useAppAuth para el estado global si es necesario, pero las pruebas serán más directas
  const { user: globalAuthUser, loading: globalAuthLoading } = useAppAuth();
  const { toast } = useToast();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null); // Usuario después del login en esta página
  const [loginStatus, setLoginStatus] = useState('');
  
  const [testResults, setTestResults] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTestLogin = async () => {
    setIsLoading(true);
    setLoginStatus('Intentando login...');
    setLoggedInUser(null);
    setTestResults('');
    try {
      // Usar la función login de authFunctions directamente
      const result = await authFunctions.login({ email: loginEmail, password: loginPassword });

      if (result.success && result.user) {
        setLoggedInUser(result.user);
        let status = `Login exitoso. User ID: ${result.user.id}, Email: ${result.user.email}. `;
        status += `Email Confirmado: ${result.user.email_confirmed_at ? 'Sí' : 'No'}. `;
        status += `Perfil en reclutadores existe: ${result.profileExists ? 'Sí' : 'No'}.`;
        setLoginStatus(status);
        toast({ title: "Login de Prueba Exitoso" });
      } else {
        setLoginStatus(`Error en Login: ${result.error || 'Error desconocido'}`);
        toast({ title: "Error en Login de Prueba", description: result.error, variant: "destructive" });
      }
    } catch (e) {
      console.error('[SupabaseTestPage] Excepción en Login:', e);
      setLoginStatus(`Excepción en Login: ${e.message}`);
      toast({ title: "Excepción en Login", description: e.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  // Las funciones CRUD usarán loggedInUser de esta página
  const currentTestUserId = loggedInUser?.id;
  const currentTestUserEmail = loggedInUser?.email;

  const handleTestInsert = async () => {
    if (!currentTestUserId || !currentTestUserEmail) {
      toast({ title: "Error", description: "Inicia sesión primero en esta página.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setTestResults('Intentando INSERT en reclutadores...');
    try {
      const testData = {
        id: currentTestUserId,
        email: currentTestUserEmail,
        first_name: 'TestInsertFirstName',
        last_name: 'TestInsertLastName',
        company: 'TestInsertCompany',
        created_at: new Date().toISOString(),
      };
      // Usar saveRecruiterProfile de authFunctions
      const data = await authFunctions.saveRecruiterProfile(testData);
      setTestResults(`Éxito en INSERT: ${JSON.stringify(data, null, 2)}`);
      toast({ title: "Éxito en INSERT", description: "Registro insertado." });
    } catch (e) {
      console.error('[SupabaseTestPage] Excepción/Error en INSERT:', e);
      setTestResults(`Excepción/Error en INSERT: ${e.message} \n ${JSON.stringify(e, null, 2)}`);
      toast({ title: "Error en INSERT", description: e.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleTestSelect = async () => {
    if (!currentTestUserId) {
      toast({ title: "Error", description: "Inicia sesión primero en esta página.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setTestResults('Intentando SELECT de reclutadores...');
    try {
      // Usar getRecruiterProfile de authFunctions
      const profileExists = await authFunctions.getRecruiterProfile(currentTestUserId);
      const message = profileExists ? `Registro encontrado (getRecruiterProfile devolvió true)` : 'No se encontró registro (getRecruiterProfile devolvió false)';
      setTestResults(`Éxito en SELECT: ${message}`);
      toast({ title: "Éxito en SELECT", description: message });
    } catch (e) {
      console.error('[SupabaseTestPage] Excepción/Error en SELECT:', e);
      setTestResults(`Excepción/Error en SELECT: ${e.message}`);
      toast({ title: "Error en SELECT", description: e.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleTestUpdate = async () => {
    if (!currentTestUserId) {
      toast({ title: "Error", description: "Inicia sesión primero en esta página.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setTestResults('Intentando UPDATE en reclutadores...');
    try {
      const timestamp = new Date().toLocaleTimeString();
      const updateData = {
        first_name: `TestFirstName Updated ${timestamp}`,
        last_name: `TestLastName Updated ${timestamp}`,
        company: `TestCompany Updated ${timestamp}`,
        phone: '+5491122334455', // Ejemplo
        website: 'https://test-updated.com', // Ejemplo
        industry: 'tecnologia_actualizada', // Ejemplo
        company_size: '11-50', // Ejemplo
        marketing_consent: true, // Ejemplo
        // Asegúrate de que estos nombres de campo (snake_case) coincidan con tus columnas en la DB
        // y que los valores sean del tipo correcto.
      };
      // Usar updateRecruiterProfile de authFunctions
      const data = await authFunctions.updateRecruiterProfile(currentTestUserId, updateData);
      setTestResults(`Éxito en UPDATE: ${JSON.stringify(data, null, 2)} (la función devuelve true si no hay error)`);
      toast({ title: "Éxito en UPDATE", description: "Registro actualizado." });
    } catch (e) {
      console.error('[SupabaseTestPage] Excepción/Error en UPDATE:', e);
      setTestResults(`Excepción/Error en UPDATE: ${e.message} \n ${JSON.stringify(e, null, 2)}`);
      toast({ title: "Error en UPDATE", description: e.message, variant: "destructive" });
    }
    setIsLoading(false);
  };
  
  const handleDelete = async () => {
    if (!currentTestUserId) {
      toast({ title: "Error", description: "Inicia sesión primero en esta página.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setTestResults('Intentando DELETE de reclutadores...');
    try {
      const { error } = await supabase // Usar supabase directo para delete es más simple
        .from('reclutadores')
        .delete()
        .eq('id', currentTestUserId);

      if (error) {
        console.error('[SupabaseTestPage] Error en DELETE:', error);
        setTestResults(`Error en DELETE: ${JSON.stringify(error, null, 2)}`);
        toast({ title: "Error en DELETE", description: error.message, variant: "destructive" });
      } else {
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

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Página de Prueba de Supabase</h1>
      
      <div className="p-4 border rounded-lg shadow space-y-3">
        <h2 className="text-xl font-semibold">1. Probar Login</h2>
        <div>
          <label htmlFor="loginEmail" className="block text-sm font-medium">Email:</label>
          <input 
            type="email" 
            id="loginEmail"
            value={loginEmail} 
            onChange={(e) => setLoginEmail(e.target.value)} 
            placeholder="Email de prueba"
            className="mt-1 block w-full p-2 border rounded-md"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="loginPassword" className="block text-sm font-medium">Contraseña:</label>
          <input 
            type="password" 
            id="loginPassword"
            value={loginPassword} 
            onChange={(e) => setLoginPassword(e.target.value)} 
            placeholder="Contraseña de prueba"
            className="mt-1 block w-full p-2 border rounded-md"
            disabled={isLoading}
          />
        </div>
        <Button onClick={handleTestLogin} disabled={isLoading}>
          {isLoading ? 'Probando Login...' : 'Probar Login'}
        </Button>
        {loginStatus && <p className="mt-2 text-sm text-gray-700 bg-gray-100 p-2 rounded-md">{loginStatus}</p>}
      </div>

      {loggedInUser && (
        <div className="p-4 border rounded-lg shadow space-y-3">
          <h2 className="text-xl font-semibold">2. Datos del Usuario Logueado (en esta página)</h2>
          <p>ID: {loggedInUser.id}</p>
          <p>Email: {loggedInUser.email}</p>
          <p>Email Confirmado: {loggedInUser.email_confirmed_at ? `Sí (en ${new Date(loggedInUser.email_confirmed_at).toLocaleString()})` : 'No'}</p>
          <p className="text-sm text-gray-600">Las siguientes operaciones usarán este ID y Email.</p>
        </div>
      )}

      <div className="p-4 border rounded-lg shadow space-y-3">
        <h2 className="text-xl font-semibold">3. Operaciones CRUD en 'reclutadores'</h2>
        <div className="space-x-2">
          <Button onClick={handleTestInsert} disabled={isLoading || !loggedInUser}>
            {isLoading ? 'Probando...' : 'Probar INSERT'}
          </Button>
          <Button onClick={handleTestSelect} disabled={isLoading || !loggedInUser}>
            {isLoading ? 'Probando...' : 'Probar SELECT'}
          </Button>
          <Button onClick={handleTestUpdate} disabled={isLoading || !loggedInUser}>
            {isLoading ? 'Probando...' : 'Probar UPDATE'}
          </Button>
          <Button onClick={handleDelete} variant="destructive" disabled={isLoading || !loggedInUser}>
            {isLoading ? 'Eliminando...' : 'Probar DELETE'}
          </Button>
        </div>
      </div>

      <div className="mt-4 p-4 border rounded-lg shadow bg-gray-50 min-h-[150px]">
        <h2 className="text-xl font-semibold">Resultados de Operaciones CRUD:</h2>
        <pre className="text-sm whitespace-pre-wrap">{testResults}</pre>
      </div>
    </div>
  );
}

export default SupabaseTestPage;