import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "../../assets/styles/LoginScreen.styles";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) router.push("/authenticated");
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };
    checkSession();
  }, []);

  const signInWithEmail = async () => {
    setLoading(true);
    try {
      const {
        error,
        data: { session },
      } = await supabase.auth.signInWithPassword({ email, password });

      if (error) alert(error.message);
      else if (session) router.push("/authenticated");
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async () => {
    setLoading(true);
    try {
      const {
        error,
        data: { session },
      } = await supabase.auth.signUp({ email, password });

      if (error) alert(error.message);
      else if (!session)
        alert("Check your inbox for a verification email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#000000", "#1c1c1c"]} // dark background for logo pop
      style={styles.background}
    >
      <View style={styles.card}>
        {/* Logo */}
        <Image
          source={require("../../assets/images/logo.jpg")}
          style={styles.logoImage}
          resizeMode="contain"
        />

        {/* Welcome text */}
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {/* Inputs */}
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#d0cfff"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#d0cfff"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Buttons */}
        <TouchableOpacity
          style={styles.signInButton}
          onPress={signInWithEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.signUpButton} onPress={signUpWithEmail}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
