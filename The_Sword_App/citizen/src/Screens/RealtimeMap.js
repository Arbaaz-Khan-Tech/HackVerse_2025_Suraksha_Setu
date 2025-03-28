import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useDarkMode } from '../context/DarkModeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config/api';
import { Layout } from '../components/Layout';

const RealtimeMap = () => {
    const { isDarkMode } = useDarkMode();
    const [markers, setMarkers] = useState([]);
    const [mapRegion, setMapRegion] = useState({
        latitude: 19.0628161,
        longitude: 72.8888403,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [searchLocation, setSearchLocation] = useState('');

    useEffect(() => {
        loadMarkers();
    }, []);

    const loadMarkers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/markers`);
            const data = await response.json();
            setMarkers(data);
        } catch (error) {
            console.error('Error loading markers:', error);
        }
    };

    const handleMapPress = (e) => {
        const { coordinate } = e.nativeEvent;
        // Add marker logic here if needed
    };

    return (
        <Layout>
            <View style={[styles.container, isDarkMode ? styles.darkBackground : styles.lightBackground]}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search location..."
                    placeholderTextColor={isDarkMode ? '#ffffff' : '#000000'}
                    value={searchLocation}
                    onChangeText={setSearchLocation}
                />

                <MapView
                    style={styles.map}
                    initialRegion={mapRegion}
                    onPress={handleMapPress}
                >
                    {markers.map((marker, index) => (
                        <Marker
                            key={index}
                            coordinate={{ latitude: marker.lat, longitude: marker.lng }}
                        />
                    ))}
                </MapView>
            </View>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container1: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    darkBackground: {
        backgroundColor: '#1a1a1a',
    },
    lightBackground: {
        backgroundColor: '#f3f4f6',
    },
    searchInput: {
        borderWidth: 0,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        margin: 16,
    },
    map: {
        flex: 1,
    },
});

export default RealtimeMap;