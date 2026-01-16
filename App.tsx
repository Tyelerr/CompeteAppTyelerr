// App.tsx
// Polyfills are now handled in index.js

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Platform,
  KeyboardAvoidingView,
  View,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AppNavigator from './navigation/AppNavigator';
import AuthProvider, { useContextAuth } from './context/ContextAuth';
import { FeaturedContentProvider } from './context/ContextFeaturedContent';
import { enableFreeze } from 'react-native-screens';
import { useKeepAwake } from 'expo-keep-awake';
import GlobalDoneBar from './components/UI/GlobalDoneBar';
import { BaseColors } from './hooks/Template';
import DeepLinkingService from './services/DeepLinkingService';

enableFreeze(true);

// Configure foreground notification handler
// This allows notifications to show even when the app is open
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    } as any),
});

// Loading component to show while auth is initializing
const LoadingScreen = () => (
  <View
    style={{
      flex: 1,
      backgroundColor: BaseColors.backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <ActivityIndicator size="large" color={BaseColors.primary} />
    <Text
      style={{
        color: '#fff',
        marginTop: 20,
        fontSize: 16,
      }}
    >
      Loading...
    </Text>
  </View>
);

// Main app content component
const AppContent = () => {
  const { isLoading } = useContextAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: BaseColors.backgroundColor }}>
      <AppNavigator />
    </View>
  );
};

export default function App() {
  useKeepAwake();

  useEffect(() => {
    // Set up notification received listener for foreground notifications
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📱 Notification received while app is in foreground:', {
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
        });

        // Show in-app alert to confirm notification is received
        Alert.alert(
          notification.request.content.title ?? 'Notification',
          notification.request.content.body ?? '',
        );
      },
    );

    // Temporarily disable deep linking initialization to fix app startup issue
    // TODO: Re-enable once the "readonly" property error is resolved
    // const subscription = DeepLinkingService.initializeDeepLinking();

    return () => {
      // Clean up the notification listener when component unmounts
      notificationListener.remove();

      // Clean up the deep linking subscription when component unmounts
      // subscription?.remove();
    };
  }, []);

  return (
    <>
      <AuthProvider>
        <FeaturedContentProvider>
          {/* {Platform.OS === "ios" && <GlobalDoneBar />} */}
          <AppContent />
        </FeaturedContentProvider>
      </AuthProvider>
      <StatusBar style="light" />
    </>
  );
}
