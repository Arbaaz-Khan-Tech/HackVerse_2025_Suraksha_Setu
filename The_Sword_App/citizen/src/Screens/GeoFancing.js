import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDarkMode } from '../context/DarkModeContext';
import { API_BASE_URL } from '../config/api';
import Layout from '../components/Layout';
import * as Location from 'expo-location';

const GeofencingScreen = () => {
    const { isDarkMode } = useDarkMode();
    const [geofenceName, setGeofenceName] = useState('');
    const [geofenceRadius, setGeofenceRadius] = useState('');
    const [geofences, setGeofences] = useState([]);
    const [alertEnter, setAlertEnter] = useState(false);
    const [alertExit, setAlertExit] = useState(false);
    const [currentGeofence, setCurrentGeofence] = useState(null);
    const [mapRegion, setMapRegion] = useState({
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Location permission is required for this feature',
                    [{ text: 'OK' }]
                );
                return;
            }

            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });

            const currentLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            };

            setUserLocation(currentLocation);
            setMapRegion(currentLocation);
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'Could not get your current location');
        }
    };

    const handleMapPress = (e) => {
        const { coordinate } = e.nativeEvent;
        if (geofenceName && geofenceRadius) {
            setCurrentGeofence({ coordinate, radius: parseInt(geofenceRadius) });
        }
    };

    const addGeofence = async () => {
        if (!currentGeofence) {
            Alert.alert('Error', 'Please select a location first');
            return;
        }

        try {
            const geofenceData = {
                name: geofenceName,
                radius: parseInt(geofenceRadius),
                coordinate: currentGeofence.coordinate,
                alertEnter,
                alertExit,
                created_at: new Date().toISOString()
            };

            const response = await fetch(`${API_BASE_URL}/api/citizen/geofencing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(geofenceData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status === 'success') {
                Alert.alert('Success', 'Geofence added successfully');
                // Reset form and refresh map
                setGeofenceName('');
                setGeofenceRadius('');
                setAlertEnter(false);
                setAlertExit(false);
                setCurrentGeofence(null);
            } else {
                throw new Error(data.message || 'Failed to add geofence');
            }
        } catch (error) {
            console.error('Error adding geofence:', error);
            Alert.alert('Error', error.message || 'Failed to add geofence');
        }
    };

    return (
        <Layout>
            <View style={[styles.container, isDarkMode ? styles.darkBackground : styles.lightBackground]}>
                <View style={[styles.settingsContainer, isDarkMode ? styles.darkBackground : styles.lightBackground]}>
                    <Text style={[styles.settingsTitle, isDarkMode ? styles.darkText : styles.lightText]}>Geofencing Settings</Text>
                    <TextInput
                        style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
                        placeholder="Geofence Name"
                        placeholderTextColor={isDarkMode ? '#ffffff' : '#000000'}
                        value={geofenceName}
                        onChangeText={setGeofenceName}
                    />
                    <TextInput
                        style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
                        placeholder="Radius (meters)"
                        keyboardType="numeric"
                        value={geofenceRadius}
                        onChangeText={setGeofenceRadius}
                        placeholderTextColor={isDarkMode ? '#ffffff' : '#000000'}
                    />
                    {/* Alert Type Section */}
                    <View style={styles.alertTypeContainer}>
                        <Text style={[styles.alertTypeLabel, isDarkMode ? styles.darkText : styles.lightText]}>Alert Type</Text>
                        <View style={styles.checkboxContainer}>
                            <TouchableOpacity style={[styles.checkbox, isDarkMode ? styles.darkCheckbox : styles.lightCheckbox]} onPress={() => setAlertEnter(!alertEnter)}>
                                <Icon name={alertEnter ? "check-square" : "square-o"} size={20} color={isDarkMode ? '#ffffff' : '#000000'} />
                                <Text style={[styles.checkboxText, isDarkMode ? styles.darkText : styles.lightText]}>Enter Area</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.checkbox, isDarkMode ? styles.darkCheckbox : styles.lightCheckbox]} onPress={() => setAlertExit(!alertExit)}>
                                <Icon name={alertExit ? "check-square" : "square-o"} size={20} color={isDarkMode ? '#ffffff' : '#000000'} />
                                <Text style={[styles.checkboxText, isDarkMode ? styles.darkText : styles.lightText]}>Exit Area</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity onPress={addGeofence} style={[styles.addButton, isDarkMode ? styles.darkAddButton : styles.lightAddButton]}>
                        <Text style={[styles.addButtonText, isDarkMode ? styles.darkText2 : styles.lightText2]}>Add Geofence</Text>
                    </TouchableOpacity>
                </View>

                <MapView
                    style={styles.map}
                    region={mapRegion}
                    onPress={handleMapPress}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                >
                    {userLocation && (
                        <Marker
                            coordinate={{
                                latitude: userLocation.latitude,
                                longitude: userLocation.longitude
                            }}
                            title="You are here"
                            description="Your current location"
                        />
                    )}
                    {geofences.map((geofence, index) => (
                        <Circle
                            key={index}
                            center={geofence.coordinate}
                            radius={geofence.radius}
                            strokeColor="red"
                            fillColor="rgba(255, 0, 0, 0.5)"
                        />
                    ))}
                    {currentGeofence && (
                        <Circle
                            center={currentGeofence.coordinate}
                            radius={currentGeofence.radius}
                            strokeColor="blue"
                            fillColor="rgba(0, 0, 255, 0.5)"
                        />
                    )}
                </MapView>
            </View>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    darkBackground: {
        backgroundColor: '#000000',
    },
    lightBackground: {
        backgroundColor: '#FFFFFF',
    },
    darkText: {
        color: '#ffffff',
    },
    lightText: {
        color: '#000000',
    },
    darkInput: {
        backgroundColor: '#2a2a2a',
        color: '#ffffff',
        borderWidth: 0,
    },
    lightInput: {
        backgroundColor: '#ffffff',
        color: '#000000',
        borderWidth: 0.5,
        borderColor: '#d1d5db',
    },
    darkCheckbox: {
        color: '#ffffff',
    },
    lightCheckbox: {
        color: '#000000',
    },
    settingsContainer: {
        padding: 16,
        backgroundColor: '#ffffff',
        elevation: 0,
    },
    settingsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        borderWidth: 0,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        marginBottom: 8,
    },
    alertTypeContainer: {
        marginBottom: 16,
    },
    alertTypeLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    checkboxContainer: {
        flexDirection: 'column',
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    checkboxText: {
        marginLeft: 8,
        marginBottom: 3,
    },
    map: {
        flex: 1,
        marginHorizontal: 10,
    },
    addButton: {
        padding: 15,
        borderRadius: 5,
        width: '100%',
        alignSelf: 'center',
    },
    darkAddButton: {
        backgroundColor: '#F2F0E9',
    },
    lightAddButton: {
        backgroundColor: 'black',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        alignSelf: 'center',
    },
    darkText2: {
        color: 'black',
    },
    lightText2: {
        color: 'white',
    },
});

export default GeofencingScreen;