import ScreenScrollView, { ScreenScrollViewRef } from '../ScreenScrollView';
import ScreenHomeSubNavigation from './ScreenHomeSubNavigation';
import { View, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef } from 'react';

export default function ScreenHomePlayerSpotlight() {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScreenScrollViewRef>(null);

  // Reset scroll position when user navigates away from this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Immediately scroll to top when leaving the screen
      scrollViewRef.current?.scrollToTop(false);
    });

    return unsubscribe;
  }, [navigation]);

  // // // // // // // // // // // console.log('BBBB');
  // Alert.alert('BBBBBB');

  return (
    <ScreenScrollView ref={scrollViewRef}>
      <ScreenHomeSubNavigation />

      <View>
        <Text>ScreenHomePlayerSpotlight</Text>
      </View>
    </ScreenScrollView>
  );
}
