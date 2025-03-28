import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, TextInput } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';
import { useDarkMode } from '../context/DarkModeContext';

const Navbar = ({ 
    toggleSidebar, 
    isSidebarExpanded, 
    isInputVisible, 
    inputAnim, 
    handleSearchIconPress, 
    setShowLanguageSelector 
}) => {
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const navigation = useNavigation();

    return (
        <View style={[styles.navbar, isDarkMode ? styles.darkNavbar : styles.lightNavbar]}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.iconButton}>
                <Entypo name={isSidebarExpanded ? "cross" : "menu"} size={28} color={isDarkMode ? "#fff" : "#000"} />
            </TouchableOpacity>

            <Animated.View style={[styles.searchContainer, { width: inputAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "60%"] }) }]}>
                {isInputVisible && <TextInput style={styles.searchInput} placeholder="Search..." placeholderTextColor="#999" />}
            </Animated.View>

            <TouchableOpacity onPress={handleSearchIconPress} style={styles.iconButton}>
                <Feather name="search" size={24} color={isDarkMode ? "#fff" : "#000"} />
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleDarkMode} style={styles.iconButton}>
                <Feather name={isDarkMode ? "sun" : "moon"} size={24} color={isDarkMode ? "#fff" : "#000"} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowLanguageSelector(true)} style={styles.iconButton}>
                <Feather name="globe" size={24} color={isDarkMode ? "#fff" : "#000"} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        elevation: 2,
        zIndex: 10,
    },
    darkNavbar: {
        backgroundColor: '#000',
    },
    lightNavbar: {
        backgroundColor: '#fff',
    },
    iconButton: {
        padding: 8,
    },
    searchContainer: {
        overflow: 'hidden',
    },
    searchInput: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 35,
        color: '#000',
    },
});

export default Navbar;