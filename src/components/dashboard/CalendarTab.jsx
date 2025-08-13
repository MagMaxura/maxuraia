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
        onSuccess: async (tokenResponse) => {
            console.log("Frontend - Google Login onSuccess:", tokenResponse);
            try {
                console.log("Frontend - Exchanging code for tokens with backend...");
                const fetchedAccessToken = await exchangeCodeForTokens(tokenResponse.code, user.id);
                console.log("Frontend - Successfully received access token from backend.");
                setAccessToken(fetchedAccessToken);
            } catch (err) {
                console.error("Frontend - Error during token exchange with backend:", err);
                setError("Error al autenticar con Google: " + err.message);
            }
        },
        onError: (errorResponse) => {
            console.error("Frontend - Google Login onError:", errorResponse);
            setError(errorResponse);
        },
        flow: 'auth-code',
        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        // --- LÍNEA CLAVE AÑADIDA: Asegura que el frontend use el mismo URL que el backend ---
        redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
    });

    useEffect(() => {
        if (accessToken) {
            const fetchEvents = async () => {
                setLoading(true);
                setError(null);
                try {
                    console.log("Frontend - Fetching calendar events with access token...");
                    const calendarEvents = await getCalendarEvents(accessToken);
                    setEvents(calendarEvents);
                    console.log("Frontend - Successfully fetched calendar events.");
                } catch (err) {
                    console.error("Frontend - Error fetching calendar events:", err);
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

const WrappedCalendarTab = () => (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <CalendarTab />
    </GoogleOAuthProvider>
);

export default WrappedCalendarTab;