import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDarkMode } from '../context/DarkModeContext';
import { useNavigation } from "@react-navigation/native";
import Layout from '../components/Layout';

const Rewards = () => {
    const navigation = useNavigation();
    const { isDarkMode } = useDarkMode();
    const [guardianLevel, setGuardianLevel] = useState('Novice');
    const [guardianPoints, setGuardianPoints] = useState(150);
    const [trainingModules, setTrainingModules] = useState([
        { id: 'conflict-deescalation', title: 'Conflict De-escalation', progress: 2, total: 5 },
        { id: 'emergency-reporting', title: 'Emergency Reporting', progress: 3, total: 5 },
        { id: 'first-aid', title: 'First Aid Basics', progress: 1, total: 5 },
    ]);
    const [overallProgress, setOverallProgress] = useState({ currentXP: 450, nextLevelXP: 1000 });
    const [leaderboardData, setLeaderboardData] = useState([
        { rank: 1, guardian: 'Rahul S.', points: 2500 },
        { rank: 2, guardian: 'Priya M.', points: 2350 },
        { rank: 3, guardian: 'Amit K.', points: 2200 },
        { rank: 4, guardian: 'Sneha P.', points: 2100 },
        { rank: 5, guardian: 'Vikram D.', points: 2050 },
    ]);

    useEffect(() => {
        // Initialize components or fetch data if needed
    }, []);

    const updateTrainingProgress = (moduleId, progress) => {
        setTrainingModules(modules =>
            modules.map(module =>
                module.id === moduleId ? { ...module, progress } : module
            )
        );
    };

    const updateGuardianStats = (level, points) => {
        setGuardianLevel(level);
        setGuardianPoints(points);
    };

    const updateOverallProgress = (currentXP, nextLevelXP) => {
        setOverallProgress({ currentXP, nextLevelXP });
    };

    const startPatrol = () => {
        alert('Starting patrol mode...');
        // Implement patrol mode logic here
    };

    const reportIncident = () => {
        alert('Opening incident report form...');
        navigation.navigate('IncidentReports')
    };

    // Combine all sections into a single data array for FlatList
    const renderItem = ({ item }) => {
        switch (item.type) {
            case 'header':
                return (
                    <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>{item.title}</Text>
                );
            case 'stats':
                return (
                    <View style={styles.statsContainer}>
                        <View>
                            <Text style={[styles.statTitle, isDarkMode ? styles.darkText : styles.lightText]}>
                                Guardian Level: <Text style={styles.primaryText}>{guardianLevel}</Text>
                            </Text>
                            <Text style={[styles.statDescription, isDarkMode ? styles.darkText : styles.lightText]}>Keep participating to level up!</Text>
                        </View>
                        <View style={styles.statRight}>
                            <Text style={[styles.statTitle, isDarkMode ? styles.darkText : styles.lightText]}>
                                Points: <Text style={styles.primaryText}>{guardianPoints}</Text>
                            </Text>
                            <Text style={[styles.statDescription, isDarkMode ? styles.darkText : styles.lightText]}>Earn more to unlock rewards!</Text>
                        </View>
                    </View>
                );
            case 'progress':
                return (
                    <View style={styles.progressContainer}>
                        <Text style={[styles.progressTitle, isDarkMode ? styles.darkText : styles.lightText]}>Overall Progress</Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${(overallProgress.currentXP / overallProgress.nextLevelXP) * 100}%` }]} />
                        </View>
                        <View style={styles.progressTextContainer}>
                            <Text style={[styles.progressText, isDarkMode ? styles.darkText : styles.lightText]}>Current: {overallProgress.currentXP} XP</Text>
                            <Text style={[styles.progressText, isDarkMode ? styles.darkText : styles.lightText]}>Next Level: {overallProgress.nextLevelXP} XP</Text>
                        </View>
                    </View>
                );
            case 'quickActions':
                return (
                    <View style={styles.quickActions}>
                        <TouchableOpacity onPress={startPatrol} style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>Start Patrol</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={reportIncident} style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>Report Incident</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'trainingModules':
                return (
                    <View>
                        <Text style={[styles.modulesTitle, isDarkMode ? styles.darkText : styles.lightText]}>Training Modules</Text>
                        <FlatList
                            data={trainingModules}
                            renderItem={({ item }) => (
                                <View style={[styles.moduleCard, isDarkMode ? { backgroundColor: '#000000' } : { backgroundColor: '#FFFFFF' }]}>
                                    <Text style={[styles.moduleTitle, isDarkMode ? { color: '#FFFFFF' } : { color: '#000000' }]}>{item.title}</Text>
                                    <View style={styles.moduleProgressBar}>
                                        <View style={[styles.moduleProgressFill, { width: `${(item.progress / item.total) * 100}%` }]} />
                                    </View>
                                    <View style={styles.moduleProgressTextContainer}>
                                        <Text style={[styles.moduleProgressText, isDarkMode ? { color: '#FFFFFF' } : { color: '#000000' }]}>Progress: {item.progress}/{item.total}</Text>
                                        <TouchableOpacity
                                            onPress={() => updateTrainingProgress(item.id, item.progress + 1)}
                                            style={styles.continueButton}
                                        >
                                            <Text style={styles.continueButtonText}>
                                                {item.progress === item.total ? 'Completed' : 'Continue'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                            keyExtractor={item => item.id}
                        />
                    </View>
                );
            case 'leaderboard':
                return (
                    <View style={[styles.leaderboardCard, isDarkMode ? { backgroundColor: '#000000' } : { backgroundColor: '#FFFFFF' }]}>
                        <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>Leaderboard</Text>
                        <View style={styles.leaderboardHeader}>
                            <Text style={[styles.leaderboardHeaderCell, isDarkMode ? { color: '#FFFFFF' } : { color: '#000000' }]}>Rank</Text>
                            <Text style={[styles.leaderboardHeaderCell, isDarkMode ? { color: '#FFFFFF' } : { color: '#000000' }]}>Guardian</Text>
                            <Text style={[styles.leaderboardHeaderCell, isDarkMode ? { color: '#FFFFFF' } : { color: '#000000' }]}>Points</Text>
                        </View>
                        <FlatList
                            data={leaderboardData}
                            renderItem={({ item }) => (
                                <View style={[styles.leaderboardRow, isDarkMode ? { borderBottomColor: '#FFFFFF' } : { borderBottomColor: '#000000' }]}>
                                    <Text style={[styles.leaderboardCell, isDarkMode ? { color: '#FFFFFF' } : { color: '#000000' }]}>{item.rank}</Text>
                                    <Text style={[styles.leaderboardCell, isDarkMode ? { color: '#FFFFFF' } : { color: '#000000' }]}>{item.guardian}</Text>
                                    <Text style={[styles.leaderboardCell, isDarkMode ? { color: '#FFFFFF' } : { color: '#000000' }]}>{item.points}</Text>
                                </View>
                            )}
                            keyExtractor={item => item.rank.toString()}
                        />
                    </View>
                );
            case 'achievements':
                return (
                    <View style={styles.achievementsContainer}>
                        <Text style={[styles.modulesTitle, isDarkMode ? styles.darkText : styles.lightText]}>Achievements & Rewards</Text>
                        <View style={styles.achievementsGrid}>
                            <View style={[styles.achievementCard, isDarkMode ? { backgroundColor: '#000000' } : { backgroundColor: '#FFFFFF' }]}>
                                <View style={styles.achievementIconContainer}>
                                    <Text style={styles.achievementIcon}>🏅</Text>
                                </View>
                                <Text style={[styles.achievementText, isDarkMode ? { color: '#FFFFFF' } : { color: '#000000' }]}>Night Patrol Hero</Text>
                            </View>
                            <View style={[styles.achievementCard, isDarkMode ? { backgroundColor: '#000000' } : { backgroundColor: '#FFFFFF' }]}>
                                <View style={styles.achievementIconContainer}>
                                    <Text style={styles.achievementIcon}>⚡</Text>
                                </View>
                                <Text style={[styles.achievementText, isDarkMode ? { color: '#FFFFFF' } : { color: '#000000' }]}>Quick Responder</Text>
                            </View>
                            <View style={[styles.achievementCard, isDarkMode ? { backgroundColor: '#000000' } : { backgroundColor: '#FFFFFF' }]}>
                                <View style={styles.achievementIconContainer}>
                                    <Text style={styles.achievementIcon}>👥</Text>
                                </View>
                                <Text style={[styles.achievementText, isDarkMode ? { color: '#FFFFFF' } : { color: '#000000' }]}>Community Leader</Text>
                            </View>
                            <View style={[styles.achievementCard, isDarkMode ? { backgroundColor: '#000000' } : { backgroundColor: '#FFFFFF' }]}>
                                <View style={styles.achievementIconContainer}>
                                    <Text style={styles.achievementIcon}>📚</Text>
                                </View>
                                <Text style={[styles.achievementText, isDarkMode ? { color: '#FFFFFF' } : { color: '#000000' }]}>Training Expert</Text>
                            </View>
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    // Data for FlatList
    const sections = [
        { type: 'header', title: 'Community Guardians Program' },
        { type: 'stats' },
        { type: 'progress' },
        { type: 'quickActions' },
        { type: 'trainingModules' },
        { type: 'leaderboard' },
        { type: 'achievements' },
    ];

    return (
        <Layout>
            <View style={[styles.container, isDarkMode ? styles.darkBackground : styles.lightBackground]}>
                <FlatList
                    data={sections}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => index.toString()}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container1: {
        flex: 1,
    },
    container: {
        padding: 20,
    },
    darkBackground: {
        backgroundColor: '#000000',
    },
    lightBackground: {
        backgroundColor: '#FFFFFF',
    },
    darkText: {
        color: 'white',
    },
    lightText: {
        color: 'black',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 20,
    },
    description: {
        fontSize: 16,
        color: 'black',
        marginBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    primaryText: {
        color: '#ff6b00',
    },
    statDescription: {
        fontSize: 12,
        color: '#6b7280',
    },
    progressContainer: {
        marginBottom: 20,
    },
    progressTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    progressBar: {
        height: 10,
        backgroundColor: '#e5e7eb',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#ff6b00',
    },
    progressTextContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#1d4ed8',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modulesTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    moduleCard: {
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    moduleTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    moduleProgressBar: {
        height: 10,
        backgroundColor: '#e5e7eb',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 5,
    },
    moduleProgressFill: {
        height: '100%',
        backgroundColor: '#ff6b00',
    },
    moduleProgressTextContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    moduleProgressText: {
        fontSize: 12,
    },
    continueButton: {
        backgroundColor: '#ff6b00',
        padding: 5,
        borderRadius: 5,
    },
    continueButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    leaderboardCard: {
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    leaderboardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    leaderboardHeaderCell: {
        flex: 1,
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
    leaderboardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    leaderboardCell: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
    },
    achievementsContainer: {
        marginTop: 20,
    },
    achievementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    achievementCard: {
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        alignItems: 'center',
        width: '48%', // Adjust width for responsiveness
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    achievementIconContainer: {
        backgroundColor: '#fbbf24',
        borderRadius: 50,
        padding: 10,
        marginBottom: 5,
    },
    achievementIcon: {
        fontSize: 30,
    },
    achievementText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default Rewards;