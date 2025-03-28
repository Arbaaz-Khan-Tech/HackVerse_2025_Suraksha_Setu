import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const Tour = ({ isVisible, onClose, tourContent, onFinish, isDarkMode, currentStep, setCurrentStep }) => {
    useEffect(() => {
        if (isVisible && tourContent && tourContent[currentStep]?.action) {
            tourContent[currentStep].action();
        }
    }, [currentStep, isVisible]);

    const handleNext = () => {
        if (currentStep < tourContent.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setCurrentStep(0);
            onFinish();
        }
    };

    const handleSkip = () => {
        setCurrentStep(0);
        onClose();
    };

    if (!isVisible || !tourContent || tourContent.length === 0) return null;

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={[
                    styles.tourBox,
                    isDarkMode ? styles.darkTourBox : styles.lightTourBox,
                    currentStep > 0 && {
                        position: 'absolute',
                        left: 230,
                        top: (currentStep - 1) * 50 + 70,
                    }
                ]}>
                    <Text style={[
                        styles.title,
                        isDarkMode ? styles.darkText : styles.lightText
                    ]}>
                        {tourContent[currentStep].title}
                    </Text>
                    <Text style={[
                        styles.content,
                        isDarkMode ? styles.darkText : styles.lightText
                    ]}>
                        {tourContent[currentStep].content}
                    </Text>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            onPress={handleSkip} 
                            style={[styles.button, styles.skipButton]}
                        >
                            <Text style={styles.buttonText}>Skip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={handleNext} 
                            style={[styles.button, styles.nextButton]}
                        >
                            <Text style={styles.buttonText}>
                                {currentStep === tourContent.length - 1 ? 'Done' : 'Next'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    tourBox: {
        borderRadius: 8,
        padding: 12,
        width: Dimensions.get('window').width * 0.45,
        maxWidth: 220,
        elevation: 5,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    lightTourBox: {
        backgroundColor: 'white',
    },
    darkTourBox: {
        backgroundColor: '#1A1A1A',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    content: {
        fontSize: 12,
        marginBottom: 12,
        lineHeight: 16,
    },
    lightText: {
        color: '#000000',
    },
    darkText: {
        color: '#FFFFFF',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 6,
    },
    button: {
        padding: 6,
        borderRadius: 4,
        minWidth: 50,
        alignItems: 'center',
    },
    skipButton: {
        backgroundColor: '#FF3B30',
    },
    nextButton: {
        backgroundColor: '#007AFF',
    },
    buttonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default Tour;