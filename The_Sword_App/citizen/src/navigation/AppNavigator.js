import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../Screens/HomeScreen'; 
import Alerts from '../Screens/Alerts';
import SOS from '../Screens/SOS';
import SafeWalk from '../Screens/SafeWalk';
import Rewards from '../Screens/Rewards';
import GeoFancing from '../Screens/GeoFancing';
import RealtimeMap from '../Screens/RealtimeMap';
import CrimeHeatMap from '../Screens/CrimeHeatMap';
import IncidentAlerts from '../Screens/IncidentAlerts';
import IncidentReports from '../Screens/IncidentReports';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator 
                initialRouteName="Home"
                screenOptions={{
                    headerShown: false, // Hide header globally since we handle it in screens
                }}
            >
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Alerts" component={Alerts} />
                <Stack.Screen name="SOS" component={SOS} />
                <Stack.Screen name="SafeWalk" component={SafeWalk} />
                <Stack.Screen name="Community Engagement" component={Rewards} />
                <Stack.Screen name="GeoFancing" component={GeoFancing} />
                <Stack.Screen name="RealtimeMap" component={RealtimeMap} />
                <Stack.Screen name="CrimeHeatMap" component={CrimeHeatMap} />
                <Stack.Screen name="IncidentAlerts" component={IncidentAlerts} />
                <Stack.Screen name="IncidentReports" component={IncidentReports} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;