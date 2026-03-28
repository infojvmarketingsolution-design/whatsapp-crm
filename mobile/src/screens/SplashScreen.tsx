import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.content,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        {/* Placeholder image path - will be replaced by the asset in production */}
        <View style={styles.logoContainer}>
           <Image 
             source={require('../assets/logo.png')} 
             style={styles.logo}
             resizeMode="contain"
           />
        </View>
        <Text variant="headlineMedium" style={styles.brandName}>Pulse CRM</Text>
        <Text variant="bodySmall" style={styles.tagline}>Intelligent Lead Hub</Text>
      </Animated.View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by J.V Marketing</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  logo: {
    width: 80,
    height: 80,
  },
  brandName: {
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  tagline: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  }
});
