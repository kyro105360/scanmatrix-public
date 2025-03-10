import React, { useState, useEffect } from 'react';
import { Alert, View, Text, Image } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Button, Input, Card } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { styles } from '../../assets/styles/LoginScreen.style';

export default function Auth() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/authenticated');
      }
    };
    checkSession();
  }, []);

  async function signInWithEmail() {
    setLoading(true);
    const { error, data: { session } } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Sign-In Error', error.message);
    } else if (session) {
      router.push('/authenticated');
    }

    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error, data: { session } } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert('Sign-Up Error', error.message);
    } else if (!session) {
      Alert.alert('Email Verification', 'Please check your inbox for verification!');
    }

    setLoading(false);
  }

  return (
    <View style={styles.background}>
      <Card containerStyle={styles.card}>
        {/* Logo */}
        <Image
          source={require('../../assets/images/logo.jpg')}
          style={styles.logo}
        />
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
        <Button
          title="Sign In"
          disabled={loading}
          onPress={signInWithEmail}
          buttonStyle={styles.signInButton}
          titleStyle={styles.buttonText}
          containerStyle={styles.buttonContainer}
        />
        <Button
          title="Sign Up"
          disabled={loading}
          onPress={signUpWithEmail}
          buttonStyle={styles.signUpButton}
          titleStyle={styles.buttonText}
          containerStyle={styles.buttonContainer}
        />
      </Card>
    </View>
  );
}
