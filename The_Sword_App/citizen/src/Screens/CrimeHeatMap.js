import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import MapView, { Heatmap, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { API_BASE_URL } from '../config/api';
import Layout from '../components/Layout';
import { useDarkMode } from '../context/DarkModeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Notifications from 'expo-notifications';
import io from 'socket.io-client';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Calculate distance between two coordinates in kilometers
const haversineDistance = (coords1, coords2) => {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.latitude)) * 
    Math.cos(toRad(coords2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const CrimeHeatMap = () => {
  const { isDarkMode } = useDarkMode();
  const [heatmapData, setHeatmapData] = useState([]);
  const [citizenLocation, setCitizenLocation] = useState(null);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [socket, setSocket] = useState(null);
  const [shownNotifications, setShownNotifications] = useState(new Set());
  const severityColors = { low: "green", medium: "yellow", high: "red" };

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(API_BASE_URL, { 
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    newSocket.on('connect_error', (err) => {
      console.log('Socket connection error:', err);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Request notification permissions
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Warning', 'Notifications permission is required for crime alerts');
      }
    })();
  }, []);

  // Get current location and watch for changes
  useEffect(() => {
    let locationSubscription;

    const startLocationTracking = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required');
          return;
        }

        // Get initial position
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        setCitizenLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });

        // Watch for position changes
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 100, // Update every 100 meters
            timeInterval: 10000 // Update every 10 seconds
          },
          (newLocation) => {
            setCitizenLocation({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            });
          }
        );
      } catch (error) {
        console.error('Location error:', error);
        Alert.alert('Error', 'Could not get location');
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Fetch initial crime data
  const fetchCrimeData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/crime-data`);
      const data = await response.json();
      if (data && data.length > 0) {
        setHeatmapData(data);
      }
    } catch (error) {
      console.error("Error fetching crime data:", error);
      Alert.alert(
        "Error",
        "Could not fetch crime data. Showing default points.",
        [{ text: "OK" }]
      );
    }
  };

  useEffect(() => {
    fetchCrimeData();
  }, []);

  // Listen for new crimes from socket
  useEffect(() => {
    if (!socket) return;

    const handleNewCrime = (newCrime) => {
      setHeatmapData(prev => [...prev, newCrime]);
      checkDistanceAndNotify(newCrime);
    };

    socket.on('new_crime', handleNewCrime);

    return () => {
      socket.off('new_crime', handleNewCrime);
    };
  }, [socket, citizenLocation]);

  // Check distance and show notification if within 10km
  const checkDistanceAndNotify = async (crime) => {
    if (!citizenLocation || shownNotifications.has(crime._id)) return;

    try {
      const crimeCoords = {
        latitude: parseFloat(crime.lat),
        longitude: parseFloat(crime.lng)
      };

      const distance = haversineDistance(citizenLocation, crimeCoords);
      
      if (distance <= 10) { // 10km radius
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🚨 Crime Alert Nearby!",
            body: `${crime.type || 'Crime'} reported ${Math.round(distance)}km away (Severity: ${crime.severity}) (description: ${crime.description}) `,
            sound: true,
            data: { crimeData: crime },
          },
          trigger: null, // Show immediately
        });

        setShownNotifications(prev => {
          const newSet = new Set(prev);
          newSet.add(crime._id);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Notification error:', error);
    }
  };

  // Check all existing crimes when location changes
  useEffect(() => {
    if (!citizenLocation || heatmapData.length === 0) return;

    heatmapData.forEach(crime => {
      if (!shownNotifications.has(crime._id)) {
        checkDistanceAndNotify(crime);
      }
    });
  }, [citizenLocation, heatmapData]);

  const selectTransport = (type) => {
    setSelectedTransport(type);
  };

  return (
    <Layout>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>
            📍 Live Crime Heatmap
          </Text>

          {/* Transport Selection */}
          <View style={styles.transportButtons}>
            {['walking', 'car', 'auto-rickshaw', 'bus'].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => selectTransport(type)}
                style={[
                  styles.transportButton,
                  selectedTransport === type && styles.selectedTransport,
                  isDarkMode ? styles.darkTransportButton : styles.lightTransportButton
                ]}
              >
                <MaterialCommunityIcons 
                  name={
                    type === 'walking' ? 'walk' : 
                    type === 'car' ? 'car' : 
                    type === 'bus' ? 'bus' : 
                    'rickshaw'
                  } 
                  size={24} 
                  color={isDarkMode ? '#FFFFFF' : '#000000'} 
                />
                <Text style={[styles.transportText, isDarkMode ? styles.darkText : styles.lightText]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <MapView
            style={styles.map}
            initialRegion={citizenLocation || {
              latitude: 19.0760,
              longitude: 72.8777,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            followsUserLocation={true}
            showsCompass={true}
            loadingEnabled={true}
          >
            {citizenLocation && (
              <Marker
                coordinate={citizenLocation}
                title="You are here"
                description="Your current location"
                pinColor="blue"
              />
            )}
            
            {heatmapData.length > 0 && (
              <>
                <Heatmap
                  points={heatmapData.map(crime => ({
                    latitude: parseFloat(crime.lat),
                    longitude: parseFloat(crime.lng),
                    weight: crime.severity === 'high' ? 2 : 
                            crime.severity === 'medium' ? 1.5 : 1,
                    intensity: crime.intensity || 0.7
                  }))}
                  opacity={0.8}
                  radius={25}
                  maxIntensity={100}
                  gradientSmoothing={10}
                  heatmapMode={"POINTS_WEIGHT"}
                  gradient={{
                    colors: ['#00f', '#0ff', '#0f0', '#ff0', '#f00'],
                    startPoints: [0.1, 0.3, 0.5, 0.7, 1],
                    colorMapSize: 256,
                  }}
                />

                {heatmapData.map((crime, index) => (
                  <Marker
                    key={`${crime._id || index}`}
                    coordinate={{
                      latitude: parseFloat(crime.lat),
                      longitude: parseFloat(crime.lng)
                    }}
                    pinColor={severityColors[crime.severity] || 'red'}
                    title={crime.type || 'Crime Incident'}
                    description={crime.description || 'No details available'}
                  />
                ))}
              </>
            )}
          </MapView>
        </View>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  darkText: {
    color: '#FFFFFF',
  },
  lightText: {
    color: '#000000',
  },
  transportButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  transportButton: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  selectedTransport: {
    backgroundColor: '#4A90E2',
  },
  darkTransportButton: {
    backgroundColor: '#2D3748',
  },
  lightTransportButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  transportText: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  map: {
    height: 550,
    width: '100%',
    borderRadius: 10,
    marginBottom: 20,
  },
});

export default CrimeHeatMap;