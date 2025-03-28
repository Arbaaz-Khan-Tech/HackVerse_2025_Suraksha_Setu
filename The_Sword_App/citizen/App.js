import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { DarkModeProvider } from './src/context/DarkModeContext';
import { SocketProvider } from './src/context/SocketContext';

const App = () => {
    return (
        <SocketProvider>
            <DarkModeProvider>
                <AppNavigator />
            </DarkModeProvider>
        </SocketProvider>
    );
};

export default App;

