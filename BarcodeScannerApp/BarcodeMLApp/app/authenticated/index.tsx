// Bringing in the essentials from React Native and libraries
import { View, Text, Button, TouchableOpacity, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import styles from '../../assets/styles/HomeScreen.styles';
import React from 'react';

// The main screen component
export default function HomeScreen() {
  // State for the camera's facing direction (front or back)
  const [facing, setFacing] = useState<CameraType>('back');
  // Permission state for accessing the camera
  const [permission, requestPermission] = useCameraPermissions();
  // Reference to the camera view
  const cameraRef = useRef<CameraView | null>(null);
  // For navigation between screens
  const router = useRouter();

  // If camera permissions are still loading, just show an empty view
  if (!permission) {
    return <View />;
  }

  // If permissions haven't been granted yet, prompt the user to enable them
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>
          We need your permission to access the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  // Toggle between front and back camera when the button is pressed
  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // Take a picture when the "Scan Barcode" button is pressed
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        // Just let the user know the photo was taken (or barcode was scanned)
        Alert.alert("Barcode Taken!");
      } catch (error) {
        console.error("Error taking picture:", error);
        Alert.alert("Error", "Something went wrong while capturing the photo.");
      }
    }
  };

  // Log out the user when the "Logout" button is pressed
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        // Show an error message if something goes wrong
        Alert.alert("Error", error.message);
      } else {
        // Go back to the main screen after logging out
        router.push('/(tabs)');
      }
    } catch (err) {
      console.error("Error during logout:", err);
      Alert.alert("Error", "Could not log out. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Title at the top */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Scan your barcode here:</Text>
      </View>

      {/* Camera preview area */}
      <View style={[styles.cameraContainer, { width: '100%' }]}>
        <CameraView
          ref={cameraRef}
          style={[styles.camera, { width: '100%', height: 400 }]}
          facing={facing}
        >
          {/* Button container with flip, scan, and logout options */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
              <Text style={styles.text}>Flip Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={takePicture}>
              <Text style={styles.text}>Scan Barcode</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleLogout}>
              <Text style={styles.text}>Logout</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    </View>
  );
}
