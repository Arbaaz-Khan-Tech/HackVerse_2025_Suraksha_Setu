import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';

const Sidebar = ({ isExpanded, isDarkMode, currentTourTarget }) => {
    const navigation = useNavigation();
    const widthAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(widthAnim, {
            toValue: isExpanded ? 222 : 0, // Increased from 211 to 250
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [isExpanded]);

    const getMenuItemStyle = (target) => {
        const baseStyle = [styles.menuItem];
        if (currentTourTarget === target) {
            baseStyle.push([
                styles.highlightedMenuItem,
                {
                    backgroundColor: isDarkMode ? 'rgba(0, 122, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)',
                }
            ]);
        }
        return baseStyle;
    };

    return (
        <Animated.View style={[
            styles.sidebar,
            { width: widthAnim },
            isDarkMode ? styles.darkSidebar : styles.lightSidebar,
            !isExpanded && styles.hiddenSidebar // Add this line to hide content when collapsed
        ]}>
            {isExpanded && ( // Only render content when expanded
                <View style={styles.menuContainer}>
                    <TouchableOpacity 
                        style={getMenuItemStyle('SOS')} 
                        onPress={() => navigation.navigate('SOS')}
                    >
                        <View style={styles.iconContainer}>
                            <Icon name="exclamation-circle" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                        </View>
                        <Text style={[styles.menuText, isDarkMode ? styles.darkText : styles.lightText]}>SOS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={getMenuItemStyle('IncidentReports')} onPress={() => navigation.navigate('IncidentReports')}>
                        <View style={styles.iconContainer}>
                            <Icon name="flag" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                        </View>
                        <Text style={[styles.menuText, isDarkMode ? styles.darkText : styles.lightText]}>Report Incident</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={getMenuItemStyle('IncidentAlerts')} onPress={() => navigation.navigate('IncidentAlerts')}>
                        <View style={styles.iconContainer}>
                            <Icon name="bell" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                        </View>
                        <Text style={[styles.menuText, isDarkMode ? styles.darkText : styles.lightText]}>Incident Alerts</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={getMenuItemStyle('CrimeHeatMap')} onPress={() => navigation.navigate('CrimeHeatMap')}>
                        <View style={styles.iconContainer}>
                            <Icon name="map" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                        </View>
                        <Text style={[styles.menuText, isDarkMode ? styles.darkText : styles.lightText]}>Real-Time Map</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={getMenuItemStyle('GeoFancing')} onPress={() => navigation.navigate('GeoFancing')}>
                        <View style={styles.iconContainer}>
                            <Icon name="map-marker-alt" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                        </View>
                        <Text style={[styles.menuText, isDarkMode ? styles.darkText : styles.lightText]}>Geofencing</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={getMenuItemStyle('Alerts')} onPress={() => navigation.navigate('Alerts')}>
                        <View style={styles.iconContainer}>
                            <Icon name="exclamation-triangle" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                        </View>
                        <Text style={[styles.menuText, isDarkMode ? styles.darkText : styles.lightText]}>Alerts</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={getMenuItemStyle('SafeWalk')} onPress={() => navigation.navigate('SafeWalk')}>
                        <View style={styles.iconContainer}>
                            <Icon name="walking" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                        </View>
                        <Text style={[styles.menuText, isDarkMode ? styles.darkText : styles.lightText]}>Safewalk</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={getMenuItemStyle('Community Engagement')} onPress={() => navigation.navigate('Community Engagement')}>
                        <View style={styles.iconContainer}>
                            <Icon name="users" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                        </View>
                        <View style={styles.multilineTextContainer}>
                            <Text style={[styles.menuText, isDarkMode ? styles.darkText : styles.lightText]}>Community</Text>
                            <Text style={[styles.menuText, isDarkMode ? styles.darkText : styles.lightText]}>Engagement</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    sidebar: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '110%',
        shadowColor: 'transparent',
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        borderBottomWidth: 1,
        borderColor: 'gray',
        borderRadius: 0,
        zIndex: 10, // Ensure the sidebar is above the content
    },
    menuContainer: {
        paddingTop: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        minHeight: 50,
        paddingRight: 10,
    },
    iconContainer: {
        width: 30,
        alignItems: 'center',
        marginRight: 5,
    },
    multilineTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    menuText: {
        fontSize: 14,
        lineHeight: 20,
    },
    lightSidebar: {
        backgroundColor: '#FFFFFF',
    },
    darkSidebar: {
        backgroundColor: '#000000',
    },
    lightText: {
        color: '#000000',
        marginLeft: 10,
    },
    darkText: {
        color: '#FFFFFF',
        marginLeft: 10,
    },
    highlightedMenuItem: {
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#007AFF',
    },
    hiddenSidebar: {
        overflow: 'hidden', // Add this style to hide content when collapsed
    },
});

export default Sidebar;