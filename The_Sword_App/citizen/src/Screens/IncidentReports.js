import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Modal, TouchableOpacity, Alert, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { useDarkMode } from '../context/DarkModeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';
import { API_BASE_URL } from '../config/api';
import Layout from '../components/Layout';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const IncidentReports = () => {
    const { isDarkMode } = useDarkMode();
    const [incidentType, setIncidentType] = useState('');
    const [dateTime, setDateTime] = useState(new Date());
    const [isDateTimePickerVisible, setDateTimePickerVisible] = useState(false);
    const [location, setLocation] = useState('');
    const [reportingCitizen, setReportingCitizen] = useState('');
    const [priorityType, setPriorityType] = useState('');
    const [notice, setNotice] = useState('');
    const [description, setDescription] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [incidentId, setIncidentId] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);
    const [geoData, setGeoData] = useState(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(null);
    const [hasLocationPermission, setHasLocationPermission] = useState(null);
    const [statusType, setStatusType] = useState('');
    

    useEffect(() => {
        (async () => {
            const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
            setHasCameraPermission(cameraStatus.status === 'granted');

            const locationStatus = await Location.requestForegroundPermissionsAsync();
            setHasLocationPermission(locationStatus.status === 'granted');
        })();
    }, []);

    const showDateTimePicker = () => {
        setDateTimePickerVisible(true);
    };
    
    const hideDateTimePicker = () => {
        setDateTimePickerVisible(false);
    };
    
    const handleDatePicked = (date) => {
        setDateTime(date);
        hideDateTimePicker();
    };

    const handleCaptureImage = async () => {
        if (!hasCameraPermission || !hasLocationPermission) {
            Alert.alert('Permissions required', 'Camera and location permissions are needed');
            return;
        }
    
        try {
            const locationData = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });
    
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images, // Fixed this line
                allowsEditing: false,
                quality: 0.8,
                exif: true
            });
    
            if (!result.canceled) {
                setCapturedImage(result.assets[0].uri);
                setGeoData({
                    latitude: locationData.coords.latitude,
                    longitude: locationData.coords.longitude,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Error capturing image:', error);
            Alert.alert('Error', 'Failed to capture evidence');
        }
    };

    // ... (keep other existing functions like showDateTimePicker, handleDatePicked, etc.)

    const handleSubmit = async () => {
        if (!capturedImage) {
            Alert.alert('Error', 'Please capture evidence first');
            return;
        }

        const formData = new FormData();
        
        // Add text fields
        formData.append('incidentType', incidentType);
        formData.append('dateTime', dateTime.toISOString());
        formData.append('location', location);
        formData.append('reportingCitizen', reportingCitizen);
        formData.append('priorityType', priorityType);
        formData.append('notice', notice);
        formData.append('description', description);

        // Prepare image file
        const filename = `evidence_${Date.now()}.jpg`;
        const file = {
            uri: capturedImage,
            name: filename,
            type: 'image/jpeg'
        };
        formData.append('evidence', file);

        // Add geo data
        if (geoData) {
            formData.append('latitude', geoData.latitude.toString());
            formData.append('longitude', geoData.longitude.toString());
            formData.append('timestamp', geoData.timestamp);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/citizen/incident-report`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Submission failed');
            }

            setIncidentId(data.alert_id);
            setModalVisible(true);
            
        } catch (error) {
            console.error('Submission error:', error);
            Alert.alert('Error', error.message || 'Failed to submit report');
        }
    };

    return (
        <Layout>
            <View style={[styles.container, { backgroundColor: isDarkMode ? 'black' : '#F5F5F5' }]}>
                <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Incident Report</Text>
                <ScrollView>
                    <View style={[styles.formContainer, { 
                        backgroundColor: isDarkMode ? 'black' : '#FFFFFF',
                        borderColor: isDarkMode ? '#333333' : '#E0E0E0',
                        borderWidth: 0
                    }]}>
                        <Picker
                            selectedValue={incidentType}
                            onValueChange={(itemValue) => setIncidentType(itemValue)}
                            style={[styles.picker, { 
                                color: isDarkMode ? '#FFFFFF' : '#000000',
                                backgroundColor: isDarkMode ? '#2C2C2C' : '#F8F8F8'
                            }]}
                            dropdownIconColor={isDarkMode ? '#FFFFFF' : '#000000'}
                        >
                            <Picker.Item label="Select Incident Type" value="" />
                            <Picker.Item label="Theft" value="theft" />
                            <Picker.Item label="Assault" value="assault" />
                            <Picker.Item label="Burglary" value="burglary" />
                            <Picker.Item label="Vandalism" value="vandalism" />
                            <Picker.Item label="Other" value="other" />
                        </Picker>

                        <TouchableOpacity 
                            onPress={showDateTimePicker} 
                            style={[styles.input, { 
                                backgroundColor: isDarkMode ? '#2C2C2C' : '#F8F8F8',
                                borderColor: isDarkMode ? '#404040' : '#E0E0E0',
                                color: isDarkMode ? '#FFFFFF' : '#000000'
                            }]}
                        >
                            <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}>
                                {dateTime.toLocaleString()}
                            </Text>
                        </TouchableOpacity>
                        <DateTimePicker
                            isVisible={isDateTimePickerVisible}
                            mode="datetime"
                            onConfirm={handleDatePicked}
                            onCancel={hideDateTimePicker}
                        />

                        <TextInput
                            placeholder="Location"
                            value={location}
                            onChangeText={setLocation}
                            placeholderTextColor={isDarkMode ? '#808080' : '#666666'}
                            style={[styles.input, { 
                                backgroundColor: isDarkMode ? '#2C2C2C' : '#F8F8F8',
                                borderColor: isDarkMode ? '#404040' : '#E0E0E0',
                                color: isDarkMode ? '#FFFFFF' : '#000000'
                            }]}
                        />
                        <TextInput
                            placeholder="Reporting Citizen Name"
                            value={reportingCitizen}
                            onChangeText={setReportingCitizen}
                            placeholderTextColor={isDarkMode ? '#808080' : '#666666'}
                            style={[styles.input, { 
                                backgroundColor: isDarkMode ? '#2C2C2C' : '#F8F8F8',
                                borderColor: isDarkMode ? '#404040' : '#E0E0E0',
                                color: isDarkMode ? '#FFFFFF' : '#000000'
                            }]}
                        />
                        <Picker
                            selectedValue={statusType}
                            onValueChange={(itemValue) => setStatusType(itemValue)}
                            style={[styles.picker, { 
                                color: isDarkMode ? '#FFFFFF' : '#000000',
                                backgroundColor: isDarkMode ? '#2C2C2C' : '#F8F8F8'
                            }]}
                            dropdownIconColor={isDarkMode ? '#FFFFFF' : '#000000'}
                        >
                            <Picker.Item label="Select Status Type" value="" />
                            <Picker.Item label="Ongoing" value="ongoing" />
                            <Picker.Item label="Solved" value="solved" />
                            <Picker.Item label="Pending" value="pending" />
                        </Picker>
                        <Picker
                            selectedValue={priorityType}
                            onValueChange={(itemValue) => setPriorityType(itemValue)}
                            style={[styles.picker, { 
                                color: isDarkMode ? '#FFFFFF' : '#000000',
                                backgroundColor: isDarkMode ? '#2C2C2C' : '#F8F8F8'
                            }]}
                            dropdownIconColor={isDarkMode ? '#FFFFFF' : '#000000'}
                        >
                            <Picker.Item label="Select Priority Type" value="" />
                            <Picker.Item label="High" value="high" />
                            <Picker.Item label="Medium" value="medium" />
                            <Picker.Item label="Low" value="low" />
                        </Picker>

                        <TextInput
                            placeholder="Incident Notice"
                            value={notice}
                            onChangeText={setNotice}
                            placeholderTextColor={isDarkMode ? '#808080' : '#666666'}
                            style={[styles.input, { 
                                backgroundColor: isDarkMode ? '#2C2C2C' : '#F8F8F8',
                                borderColor: isDarkMode ? '#404040' : '#E0E0E0',
                                color: isDarkMode ? '#FFFFFF' : '#000000',
                                height: 80
                            }]}
                            multiline
                        />
                        <TextInput
                            placeholder="Incident Description"
                            value={description}
                            onChangeText={setDescription}
                            placeholderTextColor={isDarkMode ? '#808080' : '#666666'}
                            style={[styles.input, { 
                                backgroundColor: isDarkMode ? '#2C2C2C' : '#F8F8F8',
                                borderColor: isDarkMode ? '#404040' : '#E0E0E0',
                                color: isDarkMode ? '#FFFFFF' : '#000000',
                                height: 100
                            }]}
                            multiline
                        />
                        <TouchableOpacity 
                            onPress={handleCaptureImage} 
                            style={[styles.fileButton, { 
                                backgroundColor: isDarkMode ? 'black' : 'white',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: 10
                            }]}
                        >
                            <FontAwesome name="camera" size={22} color={isDarkMode ? 'white' : 'black'} />
                            <Text style={[styles.fileButtonText, { color: isDarkMode ? 'white' : 'black' }]}>
                                Capture Evidence
                            </Text>
                        </TouchableOpacity>

                        {capturedImage && (
                            <View style={styles.imagePreviewContainer}>
                                <Image 
                                    source={{ uri: capturedImage }} 
                                    style={styles.imagePreview} 
                                />
                                {geoData && (
                                    <Text style={[styles.geoText, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
                                        📍 Location: {geoData.latitude.toFixed(6)}, {geoData.longitude.toFixed(6)}
                                        {'\n'}
                                        🕒 Captured: {geoData.timestamp}
                                    </Text>
                                )}
                            </View>
                        )}

                        <TouchableOpacity 
                            onPress={handleSubmit} 
                            style={[styles.submitButton, { 
                                backgroundColor: isDarkMode ? 'black' : 'white',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: 10
                            }]}
                        >
                            <Text style={[styles.submitButtonText, { color: isDarkMode ? 'white' : 'black' }]}>
                                Submit Report
                            </Text>
                            <AntDesign name="arrowright" size={22} color={isDarkMode ? 'white' : 'black' } />
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, {
                            backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                        }]}>
                            <TouchableOpacity 
                                onPress={() => setModalVisible(false)} 
                                style={styles.closeButton}
                            >
                                <Text style={[styles.closeButtonText, {
                                    color: isDarkMode ? '#FFFFFF' : '#000000'
                                }]}>✕</Text>
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, {
                                color: isDarkMode ? '#FFFFFF' : '#000000'
                            }]}>Report Pending Approval</Text>
                            <Text style={[styles.modalMessage, {
                                color: isDarkMode ? '#E0E0E0' : '#333333'
                            }]}>Your incident report has been submitted and is pending review by the police officer.</Text>
                            <Text style={[styles.alertIdText, {
                                color: isDarkMode ? '#0A84FF' : '#007AFF'
                            }]}>Alert ID: {incidentId}</Text>
                        </View>
                    </View>
                </Modal>
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
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        marginBottom: 16,
    },
    picker: {
        height: 50,
        width: '100%',
        marginBottom: 12,
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 8,
        marginBottom: 12,
        justifyContent: 'center',
    },
    fileButton: {
        padding: 15,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
    },
    fileButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    closeButtonText: {
        fontSize: 18,
        color: '#000',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalMessage: {
        textAlign: 'center',
        marginBottom: 10,
    },
    alertIdText: {
        fontWeight: 'bold',
    },
    submitButton: {
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
        borderWidth: 1,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    input: {
        height: 40,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 16,
        justifyContent: 'center',
    },
    picker: {
        height: 50,
        width: '100%',
        marginBottom: 16,
        borderRadius: 8,
    },
    modalContent: {
        width: '90%',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    imagePreviewContainer: {
        alignItems: 'center',
        marginVertical: 16,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    imagePreview: {
        width: 300,
        height: 300,
        borderRadius: 8,
        marginBottom: 8,
    },
    geoText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
    },
});

export default IncidentReports;