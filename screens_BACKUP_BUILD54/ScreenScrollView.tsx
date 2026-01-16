// screens/ScreenScrollView.tsx
import React, {
  ReactNode,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
  RefreshControlProps,
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

    // Expose scrollToTop method to parent components
    useImperativeHandle(ref, () => ({
      scrollToTop: (animated = false) => {
        scrollViewRef.current?.scrollTo({
          y: 0,
          animated,
        });
      },
    }));
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: BaseColors.backgroundColor }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardVerticalOffsetIOS}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, backgroundColor: BaseColors.backgroundColor }}
          contentContainerStyle={[
            {
              paddingHorizontal: BasePaddingsMargins.m10,
              paddingBottom: BasePaddingsMargins.m30,
            },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
          overScrollMode="never"
          bounces={Platform.OS === 'ios' && !!refreshControl} // Enable bounces on iOS when refresh control is present
          scrollEventThrottle={16}
          refreshControl={refreshControl}
          scrollEnabled={scrollEnabled}
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
