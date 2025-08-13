import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '../ui/button';
import { useAuth } from '@/contexts/AuthContext'; // Importar useAuth
import { exchangeCodeForTokens, getCalendarEvents } from '../../lib/googleCalendar'; // Importar funciones del servicio

const localizer = momentLocalizer(moment);

const CalendarTab = () => {
    const { user } = useAuth(); // Obtener el usuario del contexto de autenticación
    const [events, setEvents] = useState([]);
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Configuración de Google Login
    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                // Intercambiar el código por tokens en el backend
                const fetchedAccessToken = await exchangeCodeForTokens(tokenResponse.code, user.id);
                setAccessToken(fetchedAccessToken);
            } catch (err) {
                setError("Error al autenticar con Google: " + err.message);
            }
        },
        onError: (errorResponse) => setError(errorResponse),
        flow: 'auth-code', // Importante para el flujo de código de autorización
        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    });

    useEffect(() => {
        if (accessToken) {
            const fetchEvents = async () => {
                setLoading(true);
                setError(null);
                try {
                    const calendarEvents = await getCalendarEvents(accessToken);
                    setEvents(calendarEvents);
                } catch (err) {
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
                    {error && <p className="text-red-500 mt-2">Error: {error.error}</p>}
                </div>
            ) : (
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

// El componente principal que se exportará, envuelto en GoogleOAuthProvider
const WrappedCalendarTab = () => (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <CalendarTab />
    </GoogleOAuthProvider>
);

export default WrappedCalendarTab;