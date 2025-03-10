import { View, Text, Button, TouchableOpacity, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import styles from '../../assets/styles/HomeScreen.styles';
import React from 'react';

export default function HomeScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const router = useRouter();

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>We need your permission to access the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  // Toggle between front and back camera
  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // Capture a photo
  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      // Ensure alert message 
      Alert.alert("Picture Taken!");
    }
  };

  // Logout function
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      // Ensure error message is inside Text component
      Alert.alert("Error", error.message);
    } else {
      router.push('/authenticated'); // Redirect to the authentication screen
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Scan your barcode here:</Text>
      </View>

      {/* Camera Preview Section */}
      <View style={[styles.cameraContainer, { width: '100%' }]}>
        <CameraView
          ref={cameraRef}
          style={[styles.camera, { width: '100%', height: 400 }]}
          facing={facing}
        >
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
              <Text style={styles.text}>Flip Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={takePicture}>
              <Text style={styles.text}>Take Picture</Text>
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
