// various libraries and components
import React, { useState, useEffect } from "react";
import {
  Alert,
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { styles } from "../../assets/styles/LoginScreen.style";

// The main authentication component
export default function Auth() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Check if the user is already signed in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          router.push("/authenticated");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };
    checkSession();
  }, []);

  // Function to handle signing in
  async function signInWithEmail() {
    setLoading(true);
    try {
      const {
        error,
        data: { session },
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        Alert.alert("Sign-In Error", error.message);
      } else if (session) {
        router.push("/authenticated");
      }
    } finally {
      setLoading(false);
    }
  }

  // Function to handle signing up
  async function signUpWithEmail() {
    setLoading(true);
    try {
      const {
        error,
        data: { session },
      } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        Alert.alert("Sign-Up Error", error.message);
      } else if (!session) {
        Alert.alert("Almost there!", "Check your inbox for a verification email.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.background}>
      {/* Card replacement */}
      <View style={styles.card}>
        <Image
          source={require("../../assets/images/logo.jpg")}
          style={styles.logo}
        />

        {/* Email input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.inputText}
            placeholder="email@address.com"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.inputText}
            placeholder="Password"
            autoCapitalize="none"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Buttons container with spacing */}
        <View style={{ marginTop: 16, gap: 12 }}>
          {/* Sign In button */}
          <TouchableOpacity
            style={styles.signInButton}
            onPress={signInWithEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up button */}
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={signUpWithEmail}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
