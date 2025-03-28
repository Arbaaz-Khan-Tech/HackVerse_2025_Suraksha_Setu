import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DarkModeContext = createContext();

export const useDarkMode = () => useContext(DarkModeContext);

export const DarkModeProvider = ({ children }) => {
    const [isDarkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const loadDarkModePreference = async () => {
            try {
                const storedPreference = await AsyncStorage.getItem('darkMode');
                if (storedPreference !== null) {
                    setDarkMode(storedPreference === 'true');
                }
            } catch (error) {
                console.error('Failed to load dark mode preference', error);
            }
        };

        loadDarkModePreference();
    }, []);

    const toggleDarkMode = async () => {
        try {
            const newMode = !isDarkMode;
            setDarkMode(newMode);
            await AsyncStorage.setItem('darkMode', newMode.toString());
        } catch (error) {
            console.error('Failed to save dark mode preference', error);
        }
    };

    return (
        <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
            {children}
        </DarkModeContext.Provider>
    );
};
