// various libraries and components
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, Image } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Button, Input, Card } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { styles } from '../../assets/styles/LoginScreen.style';

// The main authentication component
export default function Auth() {
  // Setting up some state for email, password, and a loading indicator
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  // We'll use this to navigate between screens
  const router = useRouter();

  // Check if the user is already signed in as soon as the component loads
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        // If there's an active session, just go straight to the authenticated page
        if (session) {
          router.push('/authenticated');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };
    checkSession();
  }, []);

  // Function to handle signing in with email and password
  async function signInWithEmail() {
    setLoading(true); // Show the loading spinner while we try to log in

    try {
      const { error, data: { session } } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If there's an error, let the user know
      if (error) {
        Alert.alert('Sign-In Error', error.message);
      } 
      // If it worked, take them to the authenticated page
      else if (session) {
        router.push('/authenticated');
      }
    } catch (err) {
      //Alert.alert('Something went wrong', err.message);
    } finally {
      setLoading(false); // Hide the loading spinner 
    }
  }

  // Function to handle signing up with email and password
  async function signUpWithEmail() {
    setLoading(true); // Same deal, start the spinner while signing up

    try {
      const { error, data: { session } } = await supabase.auth.signUp({
        email,
        password,
      });

      // If something goes wrong, let the user know
      if (error) {
        Alert.alert('Sign-Up Error', error.message);
      } 
      // Sign-up was successful, but the user still needs to verify their email
      else if (!session) {
        Alert.alert('Almost there!', 'Check your inbox for a verification email.');
      }
    } catch (err) {
      //Alert.alert('Something went wrong', err.message);
    } finally {
      setLoading(false); // Turn off the spinner when done
    }
  }

  // The UI for the login/signup screen
  return (
    <View style={styles.background}>
      <Card containerStyle={styles.card}>
        {/* Logo at the top, just for branding */}
        <Image
          //source={require('../../assets/images/logo.jpg')}
          style={styles.logo}
        />

        {/* Email input field */}
        <View style={styles.inputContainer}>
          <Input
            label="Email"
            leftIcon={{ type: 'font-awesome', name: 'envelope', color: '#555' }}
            onChangeText={(text: string) => setEmail(text)}
            value={email}
            placeholder="email@address.com"
            autoCapitalize="none"
            inputStyle={styles.inputText}
          />
        </View>

        {/* Password input field */}
        <View style={styles.inputContainer}>
          <Input
            label="Password"
            leftIcon={{ type: 'font-awesome', name: 'lock', color: '#555' }}
            onChangeText={(text: string) => setPassword(text)}
            value={password}
            secureTextEntry
            placeholder="Password"
            autoCapitalize="none"
            inputStyle={styles.inputText}
          />
        </View>

        {/* Sign In button */}
        <Button
          title="Sign In"
          disabled={loading} // Disable the button if we're loading
          onPress={signInWithEmail}
          buttonStyle={styles.signInButton}
          titleStyle={styles.buttonText}
          containerStyle={styles.buttonContainer}
        />

        {/* Sign Up button */}
        <Button
          title="Sign Up"
          disabled={loading} // Same thing here
          onPress={signUpWithEmail}
          buttonStyle={styles.signUpButton}
          titleStyle={styles.buttonText}
          containerStyle={styles.buttonContainer}
        />
      </Card>
    </View>
  );
}
