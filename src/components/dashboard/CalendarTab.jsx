import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '../ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { initiateGoogleAuth, getCalendarEvents, getGoogleAccessTokenFromSupabase } from '../../lib/googleCalendar';
import { useToast } from '../ui/use-toast'; // Asumiendo que tienes un componente de toast

const localizer = momentLocalizer(moment);

const CalendarTab = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); // Inicia en true para la carga inicial de tokens
    const [error, setError] = useState(null);
    const { toast } = useToast();

    // Función para cargar eventos del calendario
    const fetchAndSetEvents = useCallback(async (token) => {
        setLoading(true);
        setError(null);
        try {
            console.log("Frontend - Obteniendo eventos del calendario con token:", token);
            // Llamar a la Vercel Function para listar eventos, que internamente refrescará el token si es necesario
            const response = await fetch(`/api/google-calendar/list-events?userId=${user.id}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || 'Failed to fetch calendar events from backend.');
            }
            const data = await response.json();
            // Formatear eventos para react-big-calendar (si el backend no lo hace)
            const formattedEvents = data.events.map(event => ({
                title: event.summary,
                start: new Date(event.start.dateTime || event.start.date),
                end: new Date(event.end.dateTime || event.end.date),
                allDay: !event.start.dateTime,
                resource: event,
            }));
            setEvents(formattedEvents);
            setIsAuthenticated(true);
        } catch (err) {
            console.error("Frontend - Error al obtener eventos del calendario:", err);
            setError("Error al cargar eventos: " + err.message);
            setIsAuthenticated(false); // Si hay un error, el usuario no está autenticado o el token es inválido
            toast({
                title: "Error de Google Calendar",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    // Efecto para manejar el callback de Google OAuth y cargar tokens/eventos
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const googleAuthStatus = urlParams.get('googleAuth');
        const message = urlParams.get('message');

        // Limpiar la URL después de procesar los parámetros de Google Auth
        if (googleAuthStatus || message) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (user) {
            // Manejar el resultado del callback de Google
            if (googleAuthStatus === 'success') {
                toast({
                    title: "Conexión exitosa",
                    description: "Google Calendar conectado correctamente.",
                });
                // Intentar cargar eventos inmediatamente después de una conexión exitosa
                // No necesitamos el access_token aquí, ya que el backend lo maneja
                fetchAndSetEvents();
            } else if (googleAuthStatus === 'error') {
                setError("Error al conectar Google Calendar: " + (message || "Desconocido"));
                toast({
                    title: "Error de conexión",
                    description: "No se pudo conectar Google Calendar: " + (message || "Por favor, inténtalo de nuevo."),
                    variant: "destructive",
                });
                setLoading(false); // Detener la carga si hubo un error
            } else {
                // Si no hay parámetros de auth en la URL, intentar cargar tokens existentes
                const loadExistingTokens = async () => {
                    try {
                        const accessToken = await getGoogleAccessTokenFromSupabase(user.id);
                        if (accessToken) {
                            setIsAuthenticated(true);
                            fetchAndSetEvents(accessToken); // Cargar eventos si hay un token válido
                        } else {
                            setIsAuthenticated(false);
                            setLoading(false); // No hay tokens, detener la carga
                        }
                    } catch (err) {
                        console.error("Error al obtener token existente de Supabase:", err);
                        setError("Error al verificar la conexión de Google Calendar.");
                        setIsAuthenticated(false);
                        setLoading(false);
                    }
                };
                loadExistingTokens();
            }
        } else {
            setLoading(false); // Si no hay usuario, no hay nada que cargar
        }
    }, [user, fetchAndSetEvents, toast]);

    const handleConnectGoogleCalendar = () => {
        if (user) {
            initiateGoogleAuth(user.id);
        } else {
            toast({
                title: "Usuario no autenticado",
                description: "Por favor, inicia sesión para conectar Google Calendar.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Calendario</h2>
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 border rounded-md p-4">
                    <p>Cargando estado de Google Calendar...</p>
                </div>
            ) : !isAuthenticated ? (
                <div className="flex flex-col items-center justify-center h-64 border rounded-md p-4">
                    <p className="mb-4">Conecta tu Google Calendar para ver tus eventos.</p>
                    <Button onClick={handleConnectGoogleCalendar}>Conectar Google Calendar</Button>
                    {error && <p className="text-red-500 mt-2">Error: {error}</p>}
                </div>
            ) : (
                <div>
                    {error && <p className="text-red-500">Error: {error}</p>}
                    {!error && (
                        <div style={{ height: 500 }}>
                            <Calendar
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: '100%' }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// No se necesita GoogleOAuthProvider aquí, ya que el flujo de autenticación se maneja por redirección.
export default CalendarTab;