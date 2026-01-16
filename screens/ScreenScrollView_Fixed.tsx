// screens/ScreenScrollView_Fixed.tsx
import React, {
  ReactNode,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
  RefreshControlProps,
  Keyboard,
  Animated,
} from 'react-native';
import { BaseColors, BasePaddingsMargins } from '../hooks/Template';
import GlobalDoneBar from '../components/UI/GlobalDoneBar';

type Props = {
  children: ReactNode;
  contentContainerStyle?: any;
  /** If your custom header overlaps inputs on iOS, bump this (e.g., 44 or 64) */
  keyboardVerticalOffsetIOS?: number;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Controls whether the ScrollView is scrollable */
  scrollEnabled?: boolean;
};

export interface ScreenScrollViewRef {
  scrollToTop: (animated?: boolean) => void;
}

const ScreenScrollView = forwardRef<ScreenScrollViewRef, Props>(
  (
    {
      children,
      contentContainerStyle,
      keyboardVerticalOffsetIOS = 0,
      refreshControl,
      scrollEnabled = true,
    },
    ref,
  ) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const keyboardHeight = useRef(new Animated.Value(0)).current;

    // Expose scrollToTop method to parent components
    useImperativeHandle(ref, () => ({
      scrollToTop: (animated = false) => {
        scrollViewRef.current?.scrollTo({
          y: 0,
          animated,
        });
      },
    }));

    useEffect(() => {
      const keyboardWillShowListener = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        (event) => {
          Animated.timing(keyboardHeight, {
            duration: Platform.OS === 'ios' ? event.duration : 250,
            toValue: event.endCoordinates.height,
            useNativeDriver: false,
          }).start();
        },
      );

      const keyboardWillHideListener = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        (event) => {
          Animated.timing(keyboardHeight, {
            duration: Platform.OS === 'ios' ? event.duration : 250,
            toValue: 0,
            useNativeDriver: false,
          }).start();
        },
      );

      return () => {
        keyboardWillShowListener.remove();
        keyboardWillHideListener.remove();
      };
    }, [keyboardHeight]);

    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: BaseColors.backgroundColor }}
        behavior={Platform.OS === 'ios' ? 'height' : 'height'} // Changed from 'padding' to 'height'
        keyboardVerticalOffset={keyboardVerticalOffsetIOS}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, backgroundColor: BaseColors.backgroundColor }}
          contentContainerStyle={[
            {
              paddingHorizontal: BasePaddingsMargins.m10,
              paddingBottom: BasePaddingsMargins.m30,
              minHeight: '100%', // Ensure content takes full height
            },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
          overScrollMode="never"
          bounces={false} // Disable bounces to prevent jumping
          scrollEventThrottle={16}
          refreshControl={refreshControl}
          scrollEnabled={scrollEnabled}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={false} // Disable automatic adjustment
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never" // Prevent content inset adjustments
        >
          {children}
        </ScrollView>

        {/* iOS-only; renders above the keyboard via InputAccessoryView */}
        {/* <GlobalDoneBar /> */}
      </KeyboardAvoidingView>
    );
  },
);

ScreenScrollView.displayName = 'ScreenScrollView';

export default ScreenScrollView;
