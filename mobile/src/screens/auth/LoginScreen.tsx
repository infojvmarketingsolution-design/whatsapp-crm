import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const theme = useTheme();

  const handleLogin = async () => {
    try {
      setLoading(true);
      const res = await apiClient.post('/auth/login', { email, password });
      await login(res.data.token, res.data.user);
    } catch (error) {
      console.warn('Login failed', error);
      // Show snackbar / error state
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>J.V CRM</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>Sign in to continue</Text>
        
        <TextInput
          mode="outlined"
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        
        <TextInput
          mode="outlined"
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        
        <Button 
          mode="contained" 
          onPress={handleLogin} 
          loading={loading}
          disabled={loading || !email || !password}
          style={styles.button}
        >
          Login
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#075E54',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#667781',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
});
