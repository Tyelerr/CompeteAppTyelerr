// Test 1: Add basic React Native imports
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Platform,
  KeyboardAvoidingView,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';

export default function App() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
      }}
    >
      <Text style={{ color: '#fff', fontSize: 20 }}>
        Test 1: Basic imports working!
      </Text>
      <StatusBar style="light" />
    </View>
  );
}
