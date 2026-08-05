import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // Function to check if the user is already logged in
  const checkAuthStatus = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      router.replace('/home'); // Redirect to home page if already logged in
    }
  };

  useEffect(() => {
    checkAuthStatus(); // Check if the user is authenticated when the screen loads
  }, []);

  const handleAuth = async () => {
    if (isLogin) {
      // Login
      try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Login Successful!');
        await AsyncStorage.setItem('userToken', 'your_token_here'); // Store the token
        router.replace('/home'); // Redirect to the home page after successful login
      } catch (error) {
        if (error instanceof Error) {
          alert(error.message); // Show the error message
        } else {
          console.error('An unknown error occurred');
        }
      }
    } else {
      // Sign Up
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Account created successfully! You can now log in.');
        setIsLogin(true); // Switch to the login screen after sign up
      } catch (error) {
        if (error instanceof Error) {
          alert(error.message); // Show the error message
        } else {
          console.error('An unknown error occurred');
        }
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert('Enter your email to reset password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent! Check your inbox.');
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message); // Show the error message
      } else {
        console.error('An unknown error occurred');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Sign in to continue' : 'Sign up to get started'}
            </Text>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholderTextColor="#A9A9A9"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#A9A9A9"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#A9A9A9"
              />
            </View>

            {isLogin && (
              <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
              <Text style={styles.authButtonText}>
                {isLogin ? 'Login' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.toggleButton} onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.toggleButtonText}>
                {isLogin ? 'Need an account? ' : 'Already have an account? '}
                <Text style={styles.toggleButtonHighlight}>
                  {isLogin ? 'Sign Up' : 'Login'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E6E6FA' },
  keyboardAvoid: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#4B0082', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#9370DB', marginBottom: 25, textAlign: 'center' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 8, color: '#4B0082', fontWeight: '500' },
  input: { borderWidth: 1.5, borderColor: '#D8BFD8', borderRadius: 12, padding: 15, fontSize: 16, backgroundColor: '#FFFFFF', color: '#4B0082' },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotPasswordText: { color: '#9370DB', fontSize: 14 },
  authButton: { borderRadius: 12, marginTop: 10, padding: 15, alignItems: 'center', backgroundColor: '#8A2BE2', elevation: 5 },
  authButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#D8BFD8' },
  dividerText: { color: '#9370DB', paddingHorizontal: 15, fontSize: 14 },
  toggleButton: { alignItems: 'center' },
  toggleButtonText: { color: '#696969', fontSize: 16 },
  toggleButtonHighlight: { color: '#8A2BE2', fontWeight: 'bold' },
});
