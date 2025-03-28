import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Alert,
    Animated,
    Easing,
    Dimensions
} from 'react-native';
import { useDarkMode } from '../context/DarkModeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { emitSOS } from '../services/socketService';
import * as Location from 'expo-location';
import { API_BASE_URL } from '../config/api';
import Layout from '../components/Layout';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SOSScreen = () => {
    const { isDarkMode } = useDarkMode();
    const [sosActivated, setSosActivated] = useState(false);
    const [sosStatus, setSosStatus] = useState('');
    const [location, setLocation] = useState(null);
    const [locationSubscription, setLocationSubscription] = useState(null);

    // एनिमेशन वेरिएबल्स
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Location permission is required for SOS feature',
                    [{ text: 'OK' }]
                );
                return;
            }

            try {
                let location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High
                });
                setLocation(location);
            } catch (error) {
                console.error('Error getting location:', error);
                Alert.alert('Error', 'Could not get your location');
            }
        })();
    }, []);

    useEffect(() => {
        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, [locationSubscription]);

    useEffect(() => {
        if (sosActivated) {
            startPulseAnimation();
            startRotateAnimation();
        } else {
            pulseAnim.setValue(1);
            rotateAnim.setValue(0);
        }
    }, [sosActivated]);

    // पल्स एनिमेशन
    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    // रोटेट एनिमेशन
    const startRotateAnimation = () => {
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    };

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const handleSosButtonClick = async () => {
        if (!location || sosActivated) {
            Alert.alert('Error', 'SOS already active or cannot get your location.');
            return;
        }

        setSosActivated(true);
        setSosStatus('SOS Activated: Sending your location...');

        try {
            const sosData = {
                location: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                },
                citizenId: 'user123', // Replace with actual user ID
                timestamp: new Date().toISOString()
            };

            emitSOS(sosData);
            setSosStatus('SOS Activated: Emergency services notified. Help is on the way.');

            // Start location updates only once
            const subscription = await startLocationUpdates();
            setLocationSubscription(subscription);
        } catch (error) {
            console.error('Error sending SOS:', error);
            setSosActivated(false);
            setSosStatus('Error sending SOS. Please try again.');
            Alert.alert(
                'SOS Error',
                'Failed to send SOS. Please try again or call emergency services directly.',
                [{ text: 'OK' }]
            );
        }
    };

    const startLocationUpdates = async () => {
        return await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 5000,
                distanceInterval: 5
            },
            (newLocation) => {
                setLocation(newLocation);
                if (sosActivated) {
                    emitSOS({
                        location: {
                            latitude: newLocation.coords.latitude,
                            longitude: newLocation.coords.longitude
                        },
                        citizenId: 'user123',
                        timestamp: new Date().toISOString()
                    });
                }
            }
        );
    };

    const handleDeactivateSOS = () => {
        try {
            if (locationSubscription) {
                locationSubscription.remove();
                setLocationSubscription(null);
            }

            // Emit deactivation event before changing state
            emitSOS({
                citizenId: 'user123',
                status: 'deactivated',
                timestamp: new Date().toISOString()
            });

            setSosActivated(false);
            setSosStatus('SOS Deactivated');
            
            // Clear location updates after small delay
            setTimeout(() => {
                setSosStatus('');
            }, 2000);
        } catch (error) {
            console.error('Error deactivating SOS:', error);
            Alert.alert('Error', 'Failed to deactivate SOS. Please try again.');
        }
    };

    return (
        <Layout>
            <View style={[
                styles.container,
                isDarkMode ? styles.darkContainer : styles.lightContainer
            ]}>
                <View style={styles.header}>
                    <MaterialIcons 
                        name="emergency" 
                        size={40} 
                        color={isDarkMode ? "#fff" : "#000"} 
                    />
                    <Text style={[
                        styles.title,
                        isDarkMode ? styles.darkText : styles.lightText
                    ]}>
                        Emergency SOS
                    </Text>
                </View>

                <View style={styles.mainContent}>
                    <Animated.View style={[
                        styles.sosButtonContainer,
                        {
                            transform: [
                                { scale: pulseAnim },
                                { rotate: spin }
                            ]
                        }
                    ]}>
                        <TouchableOpacity
                            style={[
                                styles.sosButton,
                                sosActivated ? styles.activatedButton : null
                            ]}
                            onPress={handleSosButtonClick}
                            disabled={sosActivated}
                        >
                            <Text style={styles.buttonText}>
                                {sosActivated ? 'SOS ACTIVE' : 'ACTIVATE SOS'}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {sosActivated && (
                        <View style={styles.activeControls}>
                            <Text style={[
                                styles.statusText,
                                isDarkMode ? styles.darkText : styles.lightText
                            ]}>
                                {sosStatus}
                            </Text>
                            <TouchableOpacity
                                style={styles.deactivateButton}
                                onPress={handleDeactivateSOS}
                            >
                                <Text style={styles.deactivateText}>
                                    DEACTIVATE SOS
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {location && (
                        <View style={styles.locationContainer}>
                            <MaterialIcons 
                                name="location-on" 
                                size={24} 
                                color={isDarkMode ? "#fff" : "#000"} 
                            />
                            <Text style={[
                                styles.locationText,
                                isDarkMode ? styles.darkText : styles.lightText
                            ]}>
                                {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    darkContainer: {
        backgroundColor: '#1a1a1a',
    },
    lightContainer: {
        backgroundColor: '#f5f5f5',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sosButtonContainer: {
        width: width * 0.6,
        height: width * 0.6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sosButton: {
        backgroundColor: '#ff3b30',
        width: '100%',
        height: '100%',
        borderRadius: width * 0.3,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,
    },
    activatedButton: {
        backgroundColor: '#ff0000',
    },
    buttonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    activeControls: {
        marginTop: 30,
        alignItems: 'center',
    },
    statusText: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
    },
    deactivateButton: {
        backgroundColor: '#4a4a4a',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        elevation: 5,
    },
    deactivateText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 15,
        borderRadius: 15,
    },
    locationText: {
        fontSize: 16,
        marginLeft: 10,
    },
    darkText: {
        color: '#ffffff',
    },
    lightText: {
        color: '#000000',
    },
});

export default SOSScreen;