import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps'; // Make sure to install react-native-maps
import * as Location from 'expo-location';  // Change this import
import { useDarkMode } from '../context/DarkModeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Layout from '../components/Layout';
import MapViewDirections from 'react-native-maps-directions';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBhMlK_4BYmyS4Lo7xJmK-ofgGFWJATbb0'; // Replace with your actual API key

const SafeWalk = () => {
    const { isDarkMode } = useDarkMode();
    const [guardianPhone, setGuardianPhone] = useState('');
    const [guardians, setGuardians] = useState([]);
    const [selectedTransport, setSelectedTransport] = useState(null);
    const [estimatedTime, setEstimatedTime] = useState('');
    const [isSharing, setIsSharing] = useState(false);
    const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
    const [userMarker, setUserMarker] = useState(null);
    const [destinationMarker, setDestinationMarker] = useState(null);
    const [routeLine, setRouteLine] = useState(null);
    const [timer, setTimer] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedMode, setSelectedMode] = useState('walking');
    const [destination, setDestination] = useState(null);
    const [directionsResponse, setDirectionsResponse] = useState(null);
    const [map, setMap] = useState(null);

    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required for this feature');
                return;
            }

            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });
            
            const currentLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            };

            setLocation(currentLocation);
            setUserMarker(currentLocation);
            
            // Update map initial region
            if (map) {
                map.animateToRegion({
                    ...currentLocation,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }, 1000);
            }
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'Could not get your current location');
        }
    };

    const createUserMarker = (latlng) => {
        setUserMarker(latlng);
    };

    const handleDestinationSet = (latlng) => {
        setDestinationMarker(latlng);
        updateRoute();
    };

    const calculateRoute = async () => {
        if (!userMarker || !destinationMarker) return;

        const directionsService = new google.maps.DirectionsService();
        try {
            const results = await directionsService.route({
                origin: new google.maps.LatLng(userMarker.latitude, userMarker.longitude),
                destination: new google.maps.LatLng(destinationMarker.latitude, destinationMarker.longitude),
                travelMode: google.maps.TravelMode[selectedMode.toUpperCase()],
            });
            setDirectionsResponse(results);
        } catch (error) {
            console.error("Error calculating route:", error);
            Alert.alert("Error", "Could not calculate route");
        }
    };

    const updateRoute = () => {
        if (!userMarker || !destinationMarker) return;
        calculateRoute();
    };

    const selectTransport = (type) => {
        setSelectedTransport(type);
    };

    const addGuardian = () => {
        if (guardianPhone) {
            setGuardians([...guardians, guardianPhone]);
            setGuardianPhone('');
        }
    };

    const startSharing = () => {
        if (!destinationMarker) {
            showAlert('Please set a destination first');
            return;
        }

        if (!selectedTransport) {
            showAlert('Please select a transport method');
            return;
        }

        if (guardians.length === 0) {
            showAlert('Please add at least one guardian');
            return;
        }

        const estimatedTimeValue = parseInt(estimatedTime);
        if (!estimatedTimeValue) {
            showAlert('Please enter estimated time');
            return;
        }

        const currentTime = new Date();
        setStartTime(currentTime);
        startTimer(estimatedTimeValue, currentTime);
        setIsSharing(true);
        startLocationTracking();
        updateRoute();
        notifyGuardians('Location sharing started');
    };

    const stopSharing = () => {
        setIsSharing(false);
        clearInterval(timer);
        notifyGuardians('Location sharing stopped');
    };

    const startTimer = (estimatedMinutes, currentStartTime) => {
        const endTime = new Date(currentStartTime.getTime() + estimatedMinutes * 60000);
        const timerId = setInterval(() => {
            const now = new Date();
            const timeDiff = endTime - now;

            if (timeDiff <= 0) {
                clearInterval(timerId);
                triggerSOS('Estimated time exceeded');
                return;
            }

            // Update timer display logic here
        }, 1000);
        setTimer(timerId);
    };

    const startLocationTracking = () => {
        const watchId = Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 5000,
                distanceInterval: 5
            },
            (location) => {
                const { latitude, longitude } = location.coords;
                createUserMarker({ latitude, longitude });
                updateRoute();
            }
        );
        return watchId;
    };

    const triggerSOS = (reason = 'Manual SOS triggered') => {
        const currentLocation = userMarker;
        const message = `
            SOS ALERT!
            Reason: ${reason}
            Current Location: ${currentLocation.latitude}, ${currentLocation.longitude}
            Time: ${new Date().toLocaleTimeString()}
        `;
        notifyGuardians(message);
        showAlert('SOS alert sent to guardians');
        stopSharing();
    };

    const notifyGuardians = (message) => {
        // In a real application, this would send SMS using a service
        // For demo purposes, we'll just show the message
        showAlert(message);
    };

    const showAlert = (message) => {
        Alert.alert(message);
    };

    // Vehicle mode selection handler
    const handleModeChange = (mode) => {
        setSelectedMode(mode);
    };

    const renderGuardiansList = () => (
        <View style={styles.guardianListContainer}>
            {guardians.map((item, index) => (
                <Text 
                    key={index} 
                    style={[styles.guardian, isDarkMode ? styles.darkText : styles.lightText]}
                >
                    {item}
                </Text>
            ))}
        </View>
    );

    return (
        <Layout>
            <ScrollView style={styles.mainScrollView}>
                <View style={[styles.container, isDarkMode ? styles.darkBackground : styles.lightBackground]}>
                    <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>Suraksha Setu</Text>

                    {/* Guardians Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isDarkMode ? styles.darkText : styles.lightText]}>Guardians</Text>
                        <View style={styles.guardianInputContainer}>
                            <TextInput
                                value={guardianPhone}
                                onChangeText={setGuardianPhone}
                                placeholder="Guardian's Phone Number"
                                placeholderTextColor={isDarkMode ? '#AAAAAA' : '#666666'}
                                style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
                                keyboardType="phone-pad"
                            />
                            <TouchableOpacity onPress={addGuardian} style={[styles.addButton, isDarkMode ? styles.darkAddButton : styles.lightAddButton]}>
                                <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                        {renderGuardiansList()}
                    </View>

                    {/* Journey Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isDarkMode ? styles.darkText : styles.lightText]}>Journey Details</Text>
                        <View style={styles.transportButtons}>
                            {['walking', 'car', 'auto-rickshaw', 'bus'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => selectTransport(type)}
                                    style={[styles.transportButton, isDarkMode ? styles.darkTransportButton : styles.lightTransportButton]}
                                >
                                    <MaterialCommunityIcons name={type === 'walking' ? 'walk' : type === 'car' ? 'car' : type === 'bus' ? 'bus' : type === 'auto-rickshaw' ? 'rickshaw' : ''} size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                                    {/* <Text style={[styles.transportText, isDarkMode ? styles.darkText : styles.lightText]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text> */}
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TextInput
                            value={estimatedTime}
                            onChangeText={setEstimatedTime}
                            placeholder="Estimated time (minutes)"
                            keyboardType="numeric"
                            placeholderTextColor={isDarkMode ? '#AAAAAA' : '#666666'} 
                            style={{ borderWidth: 0.5, borderColor: 'gray', borderRadius: 5, padding: 10, marginVertical: 10 }}
                        />
                        <Text style={[styles.infoText, isDarkMode ? styles.darkText : styles.lightText]}>Click on map to set destination or drag marker</Text>
                    </View>

                    {/* Controls */}
                    <View style={styles.controls}>
                        <TouchableOpacity onPress={startSharing} style={[styles.startButton, isDarkMode ? styles.darkStartButton : styles.lightStartButton]}>
                            <Text style={styles.buttonText}>Start Sharing Location</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={stopSharing} style={[styles.stopButton, isDarkMode ? styles.darkStopButton : styles.lightStopButton]} disabled={!isSharing}>
                            <Text style={styles.buttonText}>Stop Sharing</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => triggerSOS()} style={styles.sosButton}>
                            <Text style={styles.buttonText}>SOS</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Map */}
                    <View style={styles.mapWrapper}>
                        <MapView
                            style={[styles.map, isDarkMode ? styles.darkMap : styles.lightMap]}
                            initialRegion={{
                                latitude: location.latitude,
                                longitude: location.longitude,
                                latitudeDelta: 0.0922,
                                longitudeDelta: 0.0421,
                            }}
                            onPress={(e) => handleDestinationSet(e.nativeEvent.coordinate)}
                            ref={(map) => setMap(map)}
                            showsUserLocation={true}
                            showsMyLocationButton={true}
                        >
                            {userMarker && <Marker coordinate={userMarker} />}
                            {destinationMarker && <Marker coordinate={destinationMarker} />}
                            {directionsResponse && (
                                <MapViewDirections
                                    origin={userMarker}
                                    destination={destinationMarker}
                                    apikey={GOOGLE_MAPS_API_KEY}
                                    strokeWidth={3}
                                    strokeColor="#007AFF"
                                    mode={selectedMode}
                                    onReady={(result) => {
                                        map.fitToCoordinates(result.coordinates, {
                                            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                                            animated: true,
                                        });
                                    }}
                                />
                            )}
                        </MapView>
                    </View>
                </View>
            </ScrollView>
        </Layout>
    );
};

const styles = StyleSheet.create({
    mainScrollView: {
        flex: 1,
    },
    
    container: {
        flex: 1,
        padding: 20,
        minHeight: '100%',
    },
    darkBackground: {
        backgroundColor: '#000000',
    },
    lightBackground: {
        backgroundColor: '#FFFFFF',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    guardianInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        borderWidth: 0,
        borderColor: '#d1d5db',
        borderRadius: 5,
        padding: 10,
        marginRight: 10,
    },
    darkInput: {
        backgroundColor: '#2D3748',
        color: '#FFFFFF',
    },
    lightInput: {
        backgroundColor: '#F2F0E9',
        color: '#000000',
    },
    addButton: {
        padding: 10,
        borderRadius: 5,
    },
    darkAddButton: {
        backgroundColor: '#2D3748',
    },
    lightAddButton: {
        backgroundColor: '#1d4ed8',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    guardianListContainer: {
        marginTop: 10,
    },
    guardian: {
        padding: 10,
        borderRadius: 5,
        marginBottom: 5,
        backgroundColor: '#f3f4f6', // Optional: Add background color for better visibility
    },
    transportButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        width: '100%',

    },
    transportButton: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
        borderWidth: 0,
        borderColor: '#d1d5db',
        borderRadius: 5,
        marginHorizontal: 5,
    },
    darkTransportButton: {
        backgroundColor: '#2D3748',
    },
    lightTransportButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 0.5,
        borderColor: '#d1d5db',
    },
    transportText: {
        fontSize: 12,
        marginTop: 5,
        textAlign: 'center',
    },
    infoText: {
        fontSize: 12,
        marginTop: 5,
    },
    controls: {
        marginBottom: 20,
    },
    startButton: {
        padding: 15,
        borderRadius: 5,
        marginBottom: 10,
    },
    darkStartButton: {
        backgroundColor: '#22c55e',
    },
    lightStartButton: {
        backgroundColor: 'green',
    },
    stopButton: {
        padding: 15,
        borderRadius: 5,
        marginBottom: 10,
    },
    darkStopButton: {
        backgroundColor: '#ef4444',
    },
    lightStopButton: {
        backgroundColor: 'crimson',
    },
    sosButton: {
        backgroundColor: '#fbbf24',
        padding: 15,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    map: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    darkMap: {
        backgroundColor: '#1A202C',
    },
    lightMap: {
        backgroundColor: '#FFFFFF',
    },
    darkText: {
        color: '#FFFFFF',
    },
    lightText: {
        color: '#000000',
    },
    mapWrapper: {
        height: 500,
        width: '100%',
        marginTop: 20,
        marginBottom: 20,
    },
});

export default SafeWalk;