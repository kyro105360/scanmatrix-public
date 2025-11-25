import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, Animated, Easing } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import styles from "../../assets/styles/BarcodeView.styles";

const SUPABASE_BUCKET_NAME =
  process.env.EXPO_PUBLIC_SUPABASE_BUCKET_NAME || "photos";

/* Icon Components */
const FlipCameraIcon = ({ color = "#00e6e6" }) => (
  <Text style={{ color, fontSize: 24 }}>🔄</Text>
);
const ScanIcon = ({ color = "#fff" }) => <Text style={{ color, fontSize: 26 }}></Text>;
const MenuIcon = ({ color = "#fff" }) => (
  <View>
    <View style={{ width: 18, height: 2, backgroundColor: color, marginBottom: 3 }} />
    <View style={{ width: 18, height: 2, backgroundColor: color, marginBottom: 3 }} />
    <View style={{ width: 18, height: 2, backgroundColor: color }} />
  </View>
);

export default function HomeScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [torch, setTorch] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [showStabilizing, setShowStabilizing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [zoom, setZoom] = useState(0); // Zoom state (0-1)

  const cameraRef = useRef<CameraView | null>(null);
  const router = useRouter();

  // Animated values for emoji popup
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  /* === Get Current User === */
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserEmail(data.user.email ?? null);
        setUserId(data.user.id);
      }
    };
    getUser();
  }, []);

  const toggleCameraFacing = () =>
    setFacing((cur) => (cur === "back" ? "front" : "back"));

  const animateSuccessPopup = () => {
    scaleAnim.setValue(0);
    opacityAnim.setValue(0);

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 2000);
    });
  };

  const handleScanBarcode = async () => {
    if (isCapturing || !cameraRef.current || !userId) return;

    try {
      setIsCapturing(true);
      setShowStabilizing(true);

      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowStabilizing(false);

      const photos = [];
      const numberOfPhotos = 3;

      for (let i = 0; i < numberOfPhotos; i++) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 1.0,
            base64: false,
            exif: false,
            skipProcessing: false,
          });

          if (photo && photo.uri) {
            const fileInfo = await FileSystem.getInfoAsync(photo.uri);
            photos.push({ uri: photo.uri, size: fileInfo.size || 0 });
          }

          if (i < numberOfPhotos - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (photoError) {
          console.warn(`Failed to take photo ${i + 1}:`, photoError);
        }
      }

      if (photos.length === 0) {
        Alert.alert("Error", "Failed to capture any photos");
        return;
      }

      const bestPhoto = photos.reduce((best, current) =>
        current.size > best.size ? current : best
      );

      console.log(`Selected best photo: ${bestPhoto.size} bytes out of ${photos.length} photos`);

      for (const photo of photos) {
        if (photo.uri !== bestPhoto.uri) {
          try {
            await FileSystem.deleteAsync(photo.uri, { idempotent: true });
          } catch (deleteError) {
            console.warn("Failed to delete temporary photo:", deleteError);
          }
        }
      }

      await uploadImageToSupabase(bestPhoto.uri);

    } catch (error) {
      console.error("Error in barcode capture process:", error);
      Alert.alert("Error", "Failed to capture barcode image");
    } finally {
      setIsCapturing(false);
      setShowStabilizing(false);
    }
  };

  const uploadImageToSupabase = async (uri: string) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const fileName = `barcode_${Date.now()}.jpg`;
      const filePath = `barcodes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(SUPABASE_BUCKET_NAME)
        .upload(filePath, byteArray, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from(SUPABASE_BUCKET_NAME).getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;

      const { error: insertError } = await supabase.from("barcodes").insert({
        user_id: userId,
        email: userEmail,
        filename: fileName,
        storage_path: filePath,
        image_url: publicUrl,
      });
      if (insertError) throw insertError;

      const edgeResponse = await fetch("https://rouyhbmwrldpeyxlibvj.supabase.co/functions/v1/send_to_colab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_path: filePath }),
      });

      const edgeResult = await edgeResponse.json();
      if (!edgeResponse.ok) {
        console.error("Edge Function error:", edgeResult);
        //Alert.alert("Processing Error", edgeResult.error || "Failed to decode barcode");
        return;
      }

      const barcode = edgeResult.barcode;
      console.log("Decoded barcode:", barcode);
      Alert.alert("Success", `Barcode decoded: ${barcode}`);

      setScanSuccess(true);
      animateSuccessPopup();

      // Update the row with new barcode
      const { error: updateError } = await supabase
        .from("barcodes")
        .update({ decoded_barcode: barcode })
        .eq("filename", fileName);   // Matching the correct row

      if (updateError) throw updateError;

    } catch (e: any) {
      console.error(e);
      Alert.alert("Upload/Processing Error", e.message);
    }
  };

  if (!permission) return <View />;
  if (!permission.granted)
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#0f2027", "#203a43", "#2c5364"]}
          style={styles.gradientBackground}
        />
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Camera access is required to scan barcodes
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );

  const Avatar = ({ email }: { email: string }) => {
    if (!email) return null;
    const letter = email.charAt(0).toUpperCase();
    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{letter}</Text>
        </View>
        <Text style={[styles.sidebarUserEmail, { marginLeft: 12 }]}>{email}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0f2027", "#203a43", "#2c5364"]}
        style={styles.gradientBackground}
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Ready to Scan</Text>
          <Text style={styles.subtitle}>Position barcode within the frame</Text>
        </View>
        <TouchableOpacity onPress={() => setShowSidebar(true)} style={styles.menuButton}>
          <MenuIcon color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Sidebar */}
      {showSidebar && (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity
            style={styles.sidebarBackground}
            onPress={() => setShowSidebar(false)}
          />
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              {userEmail && <Avatar email={userEmail} />}
            </View>

            <TouchableOpacity
              style={styles.sidebarItem}
              onPress={() => {
                setShowSidebar(false);
                router.push("/admin");
              }}
            >
              <Text style={styles.sidebarItemText}>⚙️  Admin Portal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sidebarItem}
              onPress={async () => {
                setShowSidebar(false);
                await supabase.auth.signOut();
                router.push("/(login)");
              }}
            >
              <Text style={[styles.sidebarItemText, { color: "#ff6b6b" }]}>↗ Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          enableTorch={torch}
          zoom={zoom}  // <-- Added zoom here
        />

        {/* Scanning Overlay */}
        <View style={styles.scanningOverlay}>
          <View style={styles.scanningFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {showStabilizing && (
            <View style={styles.stabilizationIndicator}>
              <View style={styles.stabilizationDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
              <Text style={styles.stabilizationText}>Hold Still...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          onPress={() => setZoom(prev => Math.max(0, prev - 0.1))}
          style={styles.zoomButton}
        >
          <Text style={styles.zoomButtonText}>➖</Text>
        </TouchableOpacity>

        <Text style={styles.zoomLevelText}>{Math.round(zoom * 100)}%</Text>

        <TouchableOpacity
          onPress={() => setZoom(prev => Math.min(1, prev + 0.1))}
          style={styles.zoomButton}
        >
          <Text style={styles.zoomButtonText}>➕</Text>
        </TouchableOpacity>
      </View>

      {/* Animated Scan Success Emoji */}
      {scanSuccess && (
        <Animated.View
          style={{
            position: "absolute",
            top: "40%",
            left: 0,
            right: 0,
            alignItems: "center",
            zIndex: 100,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <Text style={{ fontSize: 50, color: "#00e6e6" }}>📦</Text>
          <Text style={{ color: "#00e6e6", fontWeight: "700", marginTop: 5 }}>
            Barcode Scanned!
          </Text>
        </Animated.View>
      )}

      {/* Bottom Controls */}
      <View style={styles.bottomControlBar}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
          <FlipCameraIcon />
          <Text style={styles.controlButtonText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.scanButton,
            isCapturing && styles.scanButtonDisabled
          ]}
          onPress={handleScanBarcode}
          disabled={isCapturing}
        >
          <View style={styles.scanButtonInner}>
            {isCapturing ? (
              <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: '600' }}>
                📷
              </Text>
            ) : (
              <ScanIcon />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={() => setTorch(prev => !prev)}>
          <Text style={{ color: "#00e6e6", fontSize: 22 }}>
            {torch ? "💡" : "🔦"}
          </Text>
          <Text style={styles.controlButtonText}>Flash</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
