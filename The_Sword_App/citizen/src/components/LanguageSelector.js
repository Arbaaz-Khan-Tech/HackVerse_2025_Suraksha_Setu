import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useDarkMode } from '../context/DarkModeContext';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Entypo } from '@expo/vector-icons';

const LanguageSelector = ({ startTour }) => {
    const { isDarkMode } = useDarkMode();

    return (
        <Modal
            transparent
            visible={true}
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={[
                    styles.container,
                    isDarkMode ? styles.darkContainer : styles.lightContainer
                ]}>
                    <View style={styles.titleContainer}>
                        <Feather name="globe" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                        <Text style={[
                            styles.title,
                            isDarkMode ? styles.darkText : styles.lightText
                        ]}>
                            Select Language
                        </Text>
                    </View>
                    <TouchableOpacity 
                        style={[styles.button, styles.englishButton]} 
                        onPress={() => startTour('en')}
                    >
                        <FontAwesome5 name="flag-usa" size={15} color="white" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>English</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.button, styles.hindiButton]} 
                        onPress={() => startTour('hi')}
                    >
                        <Entypo 
                            name="flag" 
                            size={20} 
                            color="orange"
                            style={styles.buttonIcon} 
                        />
                        <Text style={styles.buttonText}>हिंदी</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        padding: 20,
        borderRadius: 12,
        width: '80%',
        maxWidth: 300,
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
    },
    lightContainer: {
        backgroundColor: 'white',
    },
    darkContainer: {
        backgroundColor: '#1A1A1A',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    lightText: {
        color: '#000000',
    },
    darkText: {
        color: '#FFFFFF',
    },
    button: {
        width: '100%',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    englishButton: {
        backgroundColor: '#007AFF',
        paddingLeft: 95,
        paddingRight: 95,
    },
    hindiButton: {
        backgroundColor: '#5856D6',
        paddingLeft: 85,
        paddingRight: 105,
    },
    buttonIcon: {
        marginRight: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default LanguageSelector;