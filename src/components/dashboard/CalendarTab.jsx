import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '../ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
    initiateGoogleAuth,
    getCalendarEvents,
    getGoogleAccessTokenFromSupabase,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent
} from '../../lib/googleCalendar';
import { useToast } from '../ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

const localizer = momentLocalizer(moment);

const CalendarTab = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { toast } = useToast();

    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null); // Para editar
    const [newEventData, setNewEventData] = useState({
        title: '',
        description: '',
        start: '',
        end: '',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Zona horaria del usuario
    });

    // Función para cargar eventos del calendario
    const fetchAndSetEvents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!user || !user.id) {
                console.warn("User not available for fetching events.");
                setIsAuthenticated(false);
                setLoading(false);
                return;
            }
            console.log("Frontend - Obteniendo eventos del calendario para userId:", user.id);
            const response = await fetch(`/api/google-calendar/list-events?userId=${user.id}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || 'Failed to fetch calendar events from backend.');
            }
            const data = await response.json();
            const formattedEvents = data.events.map(event => ({
                id: event.id, // Google Event ID
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
            setIsAuthenticated(false);
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

        if (googleAuthStatus || message) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (user) {
            if (googleAuthStatus === 'success') {
                toast({
                    title: "Conexión exitosa",
                    description: "Google Calendar conectado correctamente.",
                });
                fetchAndSetEvents();
            } else if (googleAuthStatus === 'error') {
                setError("Error al conectar Google Calendar: " + (message || "Desconocido"));
                toast({
                    title: "Error de conexión",
                    description: "No se pudo conectar Google Calendar: " + (message || "Por favor, inténtalo de nuevo."),
                    variant: "destructive",
                });
                setLoading(false);
            } else {
                const loadExistingTokens = async () => {
                    try {
                        const accessToken = await getGoogleAccessTokenFromSupabase(user.id);
                        if (accessToken) {
                            setIsAuthenticated(true);
                            fetchAndSetEvents(); // Ya no pasamos el token, la Vercel Function lo obtiene
                        } else {
                            setIsAuthenticated(false);
                            setLoading(false);
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
            setLoading(false);
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

    const handleSelectSlot = ({ start, end }) => {
        setSelectedEvent(null);
        setNewEventData({
            title: '',
            description: '',
            start: moment(start).format('YYYY-MM-DDTHH:mm'),
            end: moment(end).format('YYYY-MM-DDTHH:mm'),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        setShowEventModal(true);
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setNewEventData({
            title: event.title,
            description: event.resource.description || '',
            start: moment(event.start).format('YYYY-MM-DDTHH:mm'),
            end: moment(event.end).format('YYYY-MM-DDTHH:mm'),
            timeZone: event.resource.start.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        setShowEventModal(true);
    };

    const handleEventFormChange = (e) => {
        const { name, value } = e.target;
        setNewEventData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitEvent = async () => {
        if (!user || !user.id) {
            toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            if (selectedEvent) {
                // Actualizar evento
                await updateCalendarEvent(user.id, selectedEvent.id, newEventData);
                toast({ title: "Éxito", description: "Evento actualizado correctamente." });
            } else {
                // Crear evento
                await createCalendarEvent(user.id, newEventData);
                toast({ title: "Éxito", description: "Evento creado correctamente." });
            }
            setShowEventModal(false);
            fetchAndSetEvents(); // Refrescar eventos
        } catch (err) {
            console.error("Error al guardar evento:", err);
            toast({ title: "Error", description: "Error al guardar evento: " + err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (!user || !user.id || !selectedEvent) {
            toast({ title: "Error", description: "No se pudo eliminar el evento.", variant: "destructive" });
            return;
        }
        if (!window.confirm("¿Estás seguro de que quieres eliminar este evento?")) {
            return;
        }
        setLoading(true);
        try {
            await deleteCalendarEvent(user.id, selectedEvent.id);
            toast({ title: "Éxito", description: "Evento eliminado correctamente." });
            setShowEventModal(false);
            fetchAndSetEvents(); // Refrescar eventos
        } catch (err) {
            console.error("Error al eliminar evento:", err);
            toast({ title: "Error", description: "Error al eliminar evento: " + err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Calendario</h2>
            {loading && !events.length ? ( // Mostrar cargando solo si no hay eventos ya cargados
                <div className="flex flex-col items-center justify-center h-64 border rounded-md p-4">
                    <p>Cargando estado de Google Calendar...</p>
                </div>
            ) : !isAuthenticated ? (
                <div className="flex flex-col items-center justify-center h-64 border rounded-md p-4">
                    <p className="mb-4">Conecta tu Google Calendar para ver y gestionar tus eventos.</p>
                    <Button onClick={handleConnectGoogleCalendar}>Conectar Google Calendar</Button>
                    {error && <p className="text-red-500 mt-2">Error: {error}</p>}
                </div>
            ) : (
                <div>
                    <div className="mb-4 flex justify-end">
                        <Button onClick={() => handleSelectSlot({ start: new Date(), end: new Date(moment().add(1, 'hour')) })}>
                            Crear Nuevo Evento
                        </Button>
                    </div>
                    {error && <p className="text-red-500">Error: {error}</p>}
                    <div style={{ height: 500 }}>
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            selectable
                            onSelectSlot={handleSelectSlot}
                            onSelectEvent={handleSelectEvent}
                            style={{ height: '100%' }}
                        />
                    </div>

                    <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{selectedEvent ? 'Editar Evento' : 'Crear Nuevo Evento'}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="title" className="text-right">Título</Label>
                                    <Input id="title" name="title" value={newEventData.title} onChange={handleEventFormChange} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="description" className="text-right">Descripción</Label>
                                    <Textarea id="description" name="description" value={newEventData.description} onChange={handleEventFormChange} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="start" className="text-right">Inicio</Label>
                                    <Input id="start" name="start" type="datetime-local" value={newEventData.start} onChange={handleEventFormChange} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="end" className="text-right">Fin</Label>
                                    <Input id="end" name="end" type="datetime-local" value={newEventData.end} onChange={handleEventFormChange} className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                {selectedEvent && (
                                    <Button variant="destructive" onClick={handleDeleteEvent} className="mr-auto">
                                        Eliminar
                                    </Button>
                                )}
                                <Button onClick={handleSubmitEvent} disabled={loading}>
                                    {loading ? 'Guardando...' : (selectedEvent ? 'Guardar Cambios' : 'Crear Evento')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    );
};

export default CalendarTab;