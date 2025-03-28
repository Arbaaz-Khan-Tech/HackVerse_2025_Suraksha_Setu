import io from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

const SOCKET_URL = API_BASE_URL.replace(/^http/, 'ws');

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const socket = io(SOCKET_URL, {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: false,
    forceNew: true,
});

socket.on('connect', () => {
    console.log('Connected to socket server:', socket.id);
    reconnectAttempts = 0; // Reset attempts on successful connection
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    reconnectAttempts++;
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('Max reconnection attempts reached');
        socket.disconnect();
    } else {
        console.log(`Reconnecting... Attempt ${reconnectAttempts}`);
    }
});

socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        socket.connect();
    }
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
});

export const initializeSocket = () => {
    socket.connect();
};

export const disconnectSocket = () => {
    socket.disconnect();
};

export const subscribeToAlerts = (callback) => {
    socket.on('new_alert', callback);
};

export const subscribeToCrimeUpdates = (callback) => {
    socket.on('crime_update', callback);
};

export const subscribeToSOS = (callback) => {
    socket.on('sos_alert', callback);
};

export const emitSOS = (sosData) => {
    socket.emit('sos_triggered', sosData);
};

export default socket;
