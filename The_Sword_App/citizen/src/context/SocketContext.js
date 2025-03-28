import React, { createContext, useContext, useEffect } from 'react';
import { initializeSocket, disconnectSocket } from '../services/socketService';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    useEffect(() => {
        initializeSocket();
        return () => {
            disconnectSocket();
        };
    }, []);

    return (
        <SocketContext.Provider value={{}}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
