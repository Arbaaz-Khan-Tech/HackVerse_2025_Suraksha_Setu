import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useDarkMode } from '../context/DarkModeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config/api';
import Layout from '../components/Layout';

const IncidentAlertsScreen = () => {
    const { isDarkMode } = useDarkMode();
    const [incidents, setIncidents] = useState([]);
    const [expandedIncidentId, setExpandedIncidentId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchIncidents();
    }, []);

    const fetchIncidents = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/citizen/incident-alerts`);
            const data = await response.json();
            setIncidents(data.incidents);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching incidents:', error);
        }
    };

    const toggleDetails = (id) => {
        setExpandedIncidentId(expandedIncidentId === id ? null : id);
    };

    if (loading) {
        return (
            <Layout>
                <View style={[styles.container, { backgroundColor: isDarkMode ? 'black' : '#F5F5F5' }]}>
                    <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Incident Alerts</Text>
                    <View style={styles.fallbackMessage}>
                        <Text style={[styles.fallbackText, { color: isDarkMode ? '#FFFFFF' : '#666666' }]}>
                            Loading alerts...
                        </Text>
                    </View>
                </View>
            </Layout>
        );
    }

    return (
        <Layout>
            <View style={[styles.container, { backgroundColor: isDarkMode ? 'black' : '#F5F5F5' }]}>
                <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Incident Alerts</Text>
                {incidents.length === 0 ? (
                    <View style={styles.fallbackMessage}>
                        <Text style={[styles.fallbackText, { color: isDarkMode ? 'gray' : '#666666' }]}>
                            No incidents reported yet.
                        </Text>
                    </View>
                ) : (
                    <ScrollView>
                        {incidents.map((incident) => (
                            <View
                                key={incident._id}
                                style={[
                                    styles.incidentContainer,
                                    { 
                                        backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF',
                                        borderColor: isDarkMode ? '#404040' : '#E0E0E0',
                                    },
                                    incident.priority_type === 'high' && [styles.highPriority, isDarkMode && styles.highPriorityDark],
                                    incident.priority_type === 'medium' && [styles.mediumPriority, isDarkMode && styles.mediumPriorityDark],
                                    incident.priority_type === 'low' && [styles.lowPriority, isDarkMode && styles.lowPriorityDark],
                                ]}
                            >
                                <View style={styles.header}>
                                    <Text style={[styles.incidentType, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                                        {incident.incident_type}
                                        <Text style={[
                                            styles.statusBadge(incident.status_type),
                                            isDarkMode && styles.statusBadgeDark(incident.status_type)
                                        ]}>
                                            {incident.status_type.charAt(0).toUpperCase() + incident.status_type.slice(1)}
                                        </Text>
                                    </Text>
                                    <Text style={[
                                        styles.priorityBadge(incident.priority_type),
                                        isDarkMode && styles.priorityBadgeDark(incident.priority_type)
                                    ]}>
                                        {incident.priority_type.charAt(0).toUpperCase() + incident.priority_type.slice(1)}
                                    </Text>
                                </View>

                                <Text style={[styles.detailText, { color: isDarkMode ? '#E0E0E0' : '#555555' }]}>
                                    Location: {incident.location}
                                </Text>
                                <Text style={[styles.detailText, { color: isDarkMode ? '#E0E0E0' : '#555555' }]}>
                                    Date/Time: {incident.date_time}
                                </Text>
                                <Text style={[styles.detailText, { color: isDarkMode ? '#E0E0E0' : '#555555' }]}>
                                    Reporting Officer: {incident.reporting_officer || incident.reporting_citizen || 'Unknown'}
                                </Text>
                                <Text style={[styles.detailText, { color: isDarkMode ? '#E0E0E0' : '#555555' }]}>
                                    Notice: {incident.notice}
                                </Text>
                                <TouchableOpacity 
                                    onPress={() => toggleDetails(incident._id)} 
                                    style={[styles.toggleButton, { borderColor: isDarkMode ? '#404040' : '#E0E0E0' }]}
                                >
                                    <Text style={[styles.toggleButtonText, { color: isDarkMode ? '#4C9EFF' : '#007bff' }]}>
                                        {expandedIncidentId === incident._id ? 'Less Details ↑' : 'More Details ↓'}
                                    </Text>
                                </TouchableOpacity>

                                {expandedIncidentId === incident._id && (
                                    <View style={styles.details}>
                                        <Text style={[styles.detailText, { color: isDarkMode ? '#E0E0E0' : '#555555' }]}>
                                            Description: {incident.description}
                                        </Text>
                                        <Text style={[styles.evidenceTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                                            Evidence Files:
                                        </Text>
                                        <View style={[styles.evidenceContainer, { borderColor: isDarkMode ? '#404040' : '#E0E0E0' }]}>
                                            {incident.evidence_files.map((file, index) => {
                                                const fileExtension = file.split('.').pop().toLowerCase();
                                                if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                                                    return <Image key={index} source={{ uri: file }} style={styles.evidenceImage} />;
                                                } else if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
                                                    return (
                                                        <Video
                                                            key={index}
                                                            source={{ uri: file }}
                                                            style={styles.evidenceVideo}
                                                            controls
                                                        />
                                                    );
                                                }
                                                return null;
                                            })}
                                        </View>
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                )}
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
        padding: 16,
        backgroundColor: '#f3f4f6',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    fallbackMessage: {
        alignItems: 'center',
        padding: 20,
    },
    fallbackText: {
        fontSize: 18,
        color: '#666',
    },
    incidentContainer: {
        borderLeftWidth: 4,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    highPriority: {
        borderColor: 'red',
        backgroundColor: '#f8d7da',
    },
    mediumPriority: {
        borderColor: 'orange',
        backgroundColor: '#fff3cd',
    },
    lowPriority: {
        borderColor: 'green',
        backgroundColor: '#d4edda',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    incidentType: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statusBadge: (status) => ({
        backgroundColor: status === 'pending' ? '#f8d7da' : status === 'ongoing' ? '#fff3cd' : '#d4edda',
        color: status === 'pending' ? '#721c24' : status === 'ongoing' ? '#856404' : '#155724',
        padding: 4,
        borderRadius: 4,
        marginLeft: 8,
    }),
    priorityBadge: (priority) => ({
        backgroundColor: priority === 'high' ? '#f8d7da' : priority === 'medium' ? '#fff3cd' : '#d4edda',
        color: priority === 'high' ? '#721c24' : priority === 'medium' ? '#856404' : '#155724',
        padding: 4,
        borderRadius: 4,
    }),
    detailText: {
        marginTop: 4,
        color: '#555',
    },
    toggleButton: {
        marginTop: 8,
    },
    toggleButtonText: {
        color: '#007bff',
        textDecorationLine: 'underline',
    },
    details: {
        marginTop: 8,
    },
    evidenceTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 8,
    },
    evidenceContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    evidenceImage: {
        width: 100,
        height: 100,
        marginRight: 8,
        marginBottom: 8,
        borderRadius: 8,
    },
    evidenceVideo: {
        width: 100,
        height: 100,
        marginRight: 8,
        marginBottom: 8,
        borderRadius: 8,
    },
    highPriorityDark: {
        borderColor: '#FF4444',
        backgroundColor: '#3A1D1F',
    },
    mediumPriorityDark: {
        borderColor: '#FFA500',
        backgroundColor: '#3A2E1D',
    },
    lowPriorityDark: {
        borderColor: '#4CAF50',
        backgroundColor: '#1D3A1E',
    },
    statusBadgeDark: (status) => ({
        backgroundColor: status === 'pending' ? '#3A1D1F' : status === 'ongoing' ? '#3A2E1D' : '#1D3A1E',
        color: status === 'pending' ? '#FF4444' : status === 'ongoing' ? '#FFA500' : '#4CAF50',
    }),
    priorityBadgeDark: (priority) => ({
        backgroundColor: priority === 'high' ? '#3A1D1F' : priority === 'medium' ? '#3A2E1D' : '#1D3A1E',
        color: priority === 'high' ? '#FF4444' : priority === 'medium' ? '#FFA500' : '#4CAF50',
    }),
});

export default IncidentAlertsScreen;