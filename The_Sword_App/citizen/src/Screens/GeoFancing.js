import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { useDarkMode } from '../context/DarkModeContext';
import { API_BASE_URL } from '../config/api';
import Layout from '../components/Layout';
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

const haversineDistance = (coords1, coords2) => {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(toRad(coords1.latitude)) * Math.cos(toRad(coords2.latitude)) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const GeofencingScreen = () => {
  const { isDarkMode } = useDarkMode();
  const [geofenceName, setGeofenceName] = useState('');
  const [geofenceRadius, setGeofenceRadius] = useState('');
  const [geofences, setGeofences] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [currentGeofence, setCurrentGeofence] = useState(null);
  const [shownNotifications, setShownNotifications] = useState(new Set());
  const [socket, setSocket] = useState(null);
  const severityColors = { low: "green", medium: "yellow", high: "red" };

  // Socket connection for real-time updates
  useEffect(() => {
    const newSocket = io(API_BASE_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Geofence socket connected');
      newSocket.emit('join_geofence_updates');
    });

    newSocket.on('new_crime', (newIncident) => {
      console.log('New crime received:', newIncident);
      handleNewIncident(newIncident);
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('new_crime');
      newSocket.disconnect();
    };
  }, []);

  // Notification permissions
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Warning', 'Notifications permission required for geofence alerts');
      }
    })();
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchGeofences();
    fetchIncidents();
  }, []);

  const fetchGeofences = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/citizen/geofencing`);
      const data = await response.json();
      if (data.status === 'success') setGeofences(data.geofences);
    } catch (error) {
      Alert.alert('Error', 'Failed to load geofences');
    }
  };

  const fetchIncidents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/crime-data`);
      const data = await response.json();
      setIncidents(data);
      checkGeofenceIncidents(data);
    } catch (error) {
      console.error("Error fetching incidents:", error);
    }
  };

  const handleNewIncident = (newIncident) => {
    setIncidents(prev => [...prev, newIncident]);
    checkGeofenceIncidents([newIncident]);
  };

  const checkGeofenceIncidents = (incidents) => {
    incidents.forEach(incident => {
      // Validate incident data
      if (!incident._id || !incident.lat || !incident.lng) {
        console.warn('Invalid incident format:', incident);
        return;
      }

      geofences.forEach(geofence => {
        try {
          const incidentCoords = {
            latitude: parseFloat(incident.lat),
            longitude: parseFloat(incident.lng)
          };
          
          const distance = haversineDistance(geofence.coordinate, incidentCoords);
          const notificationId = `${geofence._id}-${incident._id}`;

          if (distance <= geofence.radius && !shownNotifications.has(notificationId)) {
            sendNotification(geofence, incident, distance);
            setShownNotifications(prev => new Set([...prev, notificationId]));
          }
        } catch (e) {
          console.error('Error checking incident:', e);
        }
      });
    });
  };

  const sendNotification = async (geofence, incident, distance) => {
    try {
      // System notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🚨 Alert in ${geofence.name}!`,
          body: `${incident.type || 'Incident'} detected ${Math.round(distance)}km away`,
          sound: true,
          data: { incident }
        },
        trigger: null
      });

      // In-app alert
      Alert.alert(
        `Geofence Alert: ${geofence.name}`,
        `New incident detected within your safety zone:
        
Type: ${incident.type || 'Unknown'}
Severity: ${incident.severity || 'Medium'}
Distance: ${Math.round(distance)}km`,
        [
          { text: 'OK', onPress: () => console.log('Alert dismissed') },
          {
            text: 'View Details',
            onPress: () => {
              // Add navigation logic here if needed
            }
          }
        ]
      );
    } catch (error) {
      console.error('Notification error:', error);
    }
  };


  const handleMapPress = (e) => {
    const { coordinate } = e.nativeEvent;
    if (geofenceName && geofenceRadius) {
      setCurrentGeofence({
        coordinate,
        radius: parseInt(geofenceRadius),
        name: geofenceName,
      });
    }
  };

  const addGeofence = async () => {
    if (!currentGeofence) {
      Alert.alert('Error', 'Please select location first');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/citizen/geofencing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: geofenceName,
          radius: currentGeofence.radius,
          coordinate: currentGeofence.coordinate
        })
      });

      if (response.ok) {
        await fetchGeofences();
        setCurrentGeofence(null);
        setGeofenceName('');
        setGeofenceRadius('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save geofence');
    }
  };

  const clearGeofences = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/citizen/geofencing`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setGeofences([]);
        setShownNotifications(new Set());
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to clear geofences');
    }
  };

  const getGeofenceColor = (geofence) => {
    const hasSeverity = (severity) => incidents.some(incident => {
      try {
        const incidentCoords = {
          latitude: parseFloat(incident.lat),
          longitude: parseFloat(incident.lng)
        };
        const distance = haversineDistance(geofence.coordinate, incidentCoords);
        return distance <= geofence.radius && incident.severity === severity;
      } catch (e) {
        return false;
      }
    });

    if (hasSeverity('high')) return '#ff000088';
    if (hasSeverity('medium')) return '#ffff0088';
    return '#88888888'; // Gray for no incidents
  };


  return (
    <Layout>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.container, isDarkMode && styles.darkContainer]}>
          <Text style={[styles.title, isDarkMode && styles.darkText]}>
            🏠 Set Safety Zones
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, isDarkMode && styles.darkInput]}
              placeholder="Zone Name"
              value={geofenceName}
              onChangeText={setGeofenceName}
            />
            <TextInput
              style={[styles.input, isDarkMode && styles.darkInput]}
              placeholder="Radius (km)"
              keyboardType="numeric"
              value={geofenceRadius}
              onChangeText={setGeofenceRadius}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.addButton]}
              onPress={addGeofence}
            >
              <Text style={styles.buttonText}>Add Zone</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.clearButton]}
              onPress={clearGeofences}
            >
              <Text style={styles.buttonText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 19.0760,
              longitude: 72.8777,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onPress={handleMapPress}
          >
            {geofences.map((geofence, index) => (
              <Circle
                key={index}
                center={geofence.coordinate}
                radius={geofence.radius * 1000} // Convert km to meters
                strokeColor={getGeofenceColor(geofence)}
                fillColor={getGeofenceColor(geofence)}
                strokeWidth={2}
              />
            ))}
            {currentGeofence && (
              <Circle
                center={currentGeofence.coordinate}
                radius={currentGeofence.radius * 1000}
                strokeColor="#0000ff"
                fillColor="#0000ff22"
                strokeWidth={2}
              />
            )}
          </MapView>
        </View>
      </ScrollView>
    </Layout>
  );
};

// Keep the same styles as previous GeoFancing.js

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    darkContainer: {
        backgroundColor: '#1a1a1a',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    darkText: {
        color: '#fff',
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    darkInput: {
        borderColor: '#444',
        backgroundColor: '#333',
        color: '#fff',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    addButton: {
        backgroundColor: '#4CAF50',
    },
    clearButton: {
        backgroundColor: '#f44336',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    map: {
        width: '100%',
        height: 400,
        borderRadius: 12,
    },
});

export default GeofencingScreen;