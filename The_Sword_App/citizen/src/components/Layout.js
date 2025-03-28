import React, { useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useDarkMode } from '../context/DarkModeContext';

const Layout = ({ children }) => {
    const { isDarkMode } = useDarkMode();
    const [isSidebarExpanded, setSidebarExpanded] = useState(false);
    const [isInputVisible, setInputVisible] = useState(false);
    const [showLanguageSelector, setShowLanguageSelector] = useState(false);
    const inputAnim = React.useRef(new Animated.Value(0)).current;

    const handleSearchIconPress = () => {
        setInputVisible(!isInputVisible);
        Animated.timing(inputAnim, {
            toValue: isInputVisible ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const toggleSidebar = () => {
        setSidebarExpanded(!isSidebarExpanded);
    };

    return (
        <SafeAreaView style={[styles.container, isDarkMode ? styles.darkBackground : styles.lightBackground]}>
            <Navbar 
                toggleSidebar={toggleSidebar}
                isSidebarExpanded={isSidebarExpanded}
                isInputVisible={isInputVisible}
                inputAnim={inputAnim}
                handleSearchIconPress={handleSearchIconPress}
                setShowLanguageSelector={setShowLanguageSelector}
            />
            <View style={styles.content}>
                <Sidebar 
                    isExpanded={isSidebarExpanded} 
                    isDarkMode={isDarkMode}
                />
                <View style={styles.mainContent}>
                    {children}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    darkBackground: {
        backgroundColor: '#000000',
    },
    lightBackground: {
        backgroundColor: 'white',
    },
    content: {
        flex: 1,
        position: 'relative',
    },
    mainContent: {
        flex: 1,
        marginLeft: 0,
    }
});

export default Layout; 