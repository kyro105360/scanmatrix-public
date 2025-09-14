import React, { useState, useRef } from "react";
import { View, Text, Button, TouchableOpacity, Alert } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import styles from "../../assets/styles/HomeScreen.styles";

export default function HomeScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const router = useRouter();

  if (!permission) return <View />;

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

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

const takePicture = async () => {
  if (!cameraRef.current) return;

  try {
    const photo = await cameraRef.current.takePictureAsync({ skipProcessing: true });
    console.log("Photo URI:", photo.uri);

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(photo.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log("Base64 length:", base64.length);

    if (!base64 || base64.length === 0) {
      Alert.alert("Error", "Captured image is empty. Try again.");
      return;
    }

    // Convert base64 to Uint8Array
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    const fileName = `photo-${Date.now()}.jpg`;

    // Upload to Supabase
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("photos")
      .upload(fileName, byteArray, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      Alert.alert("Error", "Could not upload photo.");
      return;
    }

    console.log("Upload succeeded:", uploadData);

    // Get public URL
    const { data: publicUrlData, error: publicUrlError } = supabase.storage
      .from("photos")
      .getPublicUrl(fileName);

    if (publicUrlError) {
      console.error("Public URL error:", publicUrlError);
      return;
    }

    const publicUrl = publicUrlData.publicUrl;
    console.log("Public URL:", publicUrl);
    Alert.alert("Success!", `Photo uploaded!\nURL:\n${publicUrl}`);
  } catch (err) {
    console.error(err);
    Alert.alert("Error", "Something went wrong while capturing the photo.");
  }
};

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) Alert.alert("Error", error.message);
      else router.push("/(tabs)");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not log out. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Scan your barcode here:</Text>
      </View>

      <View style={[styles.cameraContainer, { width: "100%" }]}>
        <CameraView
          ref={cameraRef}
          style={[styles.camera, { width: "100%", height: 400 }]}
          facing={facing}
        >
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
