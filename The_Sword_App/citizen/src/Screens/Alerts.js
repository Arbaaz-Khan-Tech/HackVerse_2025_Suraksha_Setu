import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDarkMode } from '../context/DarkModeContext';
import { API_BASE_URL } from '../config/api';
import Layout from '../components/Layout';

const Alerts = () => {
    const { isDarkMode } = useDarkMode();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchIncidents();
    }, []);

    const fetchIncidents = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/citizen/alerts`);
            const data = await response.json();
            setIncidents(data.alerts);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching incidents:', error);
        }
    };

    const renderIncident = ({ item }) => {
        return (
            <View style={[styles.incidentCard, isDarkMode ? styles.darkCard : styles.lightCard]}>
                <Text style={isDarkMode ? styles.darkText : styles.lightText}>{item.alertTitle}</Text>
                <Text style={isDarkMode ? styles.darkText : styles.lightText}>{item.alertMessage}</Text>
                <View style={styles.incidentDetails}>
                    <Text style={isDarkMode ? styles.darkDetail : styles.lightDetail}>
                        <Text style={styles.incidentDetailLabel}>Location:</Text> {item.location}
                    </Text>
                    <Text style={isDarkMode ? styles.darkDetail : styles.lightDetail}>
                        <Text style={styles.incidentDetailLabel}>Duration:</Text> {item.alertDuration} hours
                    </Text>
                    <Text style={isDarkMode ? styles.darkDetail : styles.lightDetail}>
                        <Text style={styles.incidentDetailLabel}>Target Audience:</Text> {item.targetAudience?.join(', ') || 'All'}
                    </Text>
                    <Text style={isDarkMode ? styles.darkDetail : styles.lightDetail}>
                        <Text style={styles.incidentDetailLabel}>Type:</Text> {item.alertType}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <Layout>
            <View style={[styles.container, isDarkMode ? styles.darkBackground : styles.lightBackground]}>
                {loading ? (
                    <Text style={isDarkMode ? styles.darkText : styles.lightText}>Loading...</Text>
                ) : incidents.length === 0 ? (
                    <View style={styles.noIncidentsContainer}>
                        <Text style={isDarkMode ? styles.darkText : styles.lightText}>No incidents available.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={incidents}
                        renderItem={renderIncident}
                        keyExtractor={(item) => item._id.toString()}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    darkBackground: {
        backgroundColor: '#000000',
    },
    lightBackground: {
        backgroundColor: '#FFFFFF',
    },
    listContent: {
        padding: 20,
    },
    incidentCard: {
        borderRadius: 10,
        padding: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    darkCard: {
        backgroundColor: '#2D3748',
    },
    lightCard: {
        backgroundColor: '#FFFFFF',
    },
    darkText: {
        color: '#FFFFFF',
    },
    lightText: {
        color: '#000000',
    },
    incidentDetails: {
        marginTop: 10,
    },
    darkDetail: {
        color: '#AAAAAA',
    },
    lightDetail: {
        color: '#666666',
    },
    incidentDetailLabel: {
        fontWeight: 'bold',
    },
    noIncidentsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Alerts;