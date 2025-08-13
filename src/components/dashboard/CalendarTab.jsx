import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '../ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { exchangeCodeForTokens, getCalendarEvents } from '../../lib/googleCalendar';

const localizer = momentLocalizer(moment);

const CalendarTab = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = useGoogleLogin({
        // onSuccess ya no se usará, la lógica se mueve al useEffect
        flow: 'auth-code',
        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
    });

    // --- LÓGICA CLAVE AÑADIDA ---
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code && user && !accessToken) {
            setLoading(true);
            console.log("Frontend - Código de autorización detectado en la URL. Intercambiando por tokens...");
            
            exchangeCodeForTokens(code, user.id)
                .then(fetchedAccessToken => {
                    console.log("Frontend - Tokens recibidos del backend.");
                    setAccessToken(fetchedAccessToken);
                    // Limpia la URL para no volver a usar el mismo código
                    window.history.pushState({}, document.title, window.location.pathname);
                })
                .catch(err => {
                    console.error("Frontend - Error durante el intercambio de tokens con el backend:", err);
                    setError("Error al autenticar con Google: " + err.message);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [user, accessToken]); // Se ejecuta cuando el usuario está disponible

    useEffect(() => {
        if (accessToken) {
            const fetchEvents = async () => {
                setLoading(true);
                setError(null);
                try {
                    console.log("Frontend - Obteniendo eventos del calendario...");
                    const calendarEvents = await getCalendarEvents(accessToken);
                    setEvents(calendarEvents);
                } catch (err) {
                    console.error("Frontend - Error al obtener eventos:", err);
                    setError("Error al cargar eventos: " + err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchEvents();
        }
    }, [accessToken]);

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Calendario</h2>
            {!accessToken ? (
                <div className="flex flex-col items-center justify-center h-64 border rounded-md p-4">
                    <p className="mb-4">Conecta tu Google Calendar para ver tus eventos.</p>
                    <Button onClick={() => login()}>Conectar Google Calendar</Button>
                    {loading && <p className="mt-4">Autenticando...</p>}
                    {error && <p className="text-red-500 mt-2">Error: {error}</p>}
                </div>
            ) : (
                // ... (El resto del componente para mostrar el calendario no cambia)
                <div>
                    {loading && <p>Cargando eventos...</p>}
                    {error && <p className="text-red-500">Error: {error}</p>}
                    {!loading && !error && (
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

// El componente Wrapped no necesita cambios
const WrappedCalendarTab = () => (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <CalendarTab />
    </GoogleOAuthProvider>
);

export default WrappedCalendarTab;