// Test 2: Add Template import (suspected issue)
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Platform,
  KeyboardAvoidingView,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { BaseColors } from './hooks/Template';

export default function App() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: BaseColors.backgroundColor,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 20 }}>
        Test 2: Template import working!
      </Text>
      <StatusBar style="light" />
    </View>
  );
}
