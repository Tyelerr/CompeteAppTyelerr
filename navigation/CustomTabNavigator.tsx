// navigation/CustomTabNavigator.tsx
import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Keyboard,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  BaseColors,
  BasePaddingsMargins,
  BottomBarTab,
} from '../hooks/Template';

/* ---------- Animated Icon ---------- */
export function TabBarIconElement({
  focused,
  icon,
}: {
  focused: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const animatedScale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.spring(animatedScale, {
      toValue: focused ? 1.3 : 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <View
      style={{
        padding: BasePaddingsMargins.m10,
        paddingBottom: BasePaddingsMargins.m10,
      }}
    >
      <Animated.View style={{ transform: [{ scale: animatedScale }] }}>
        <Ionicons
          name={icon}
          size={BottomBarTab.iconSizeBigger}
          color={focused ? BaseColors.primary : BaseColors.othertexts}
        />
      </Animated.View>
    </View>
  );
}

/* ---------- Custom Tab Bar (hides on keyboard) ---------- */
export default function CustomTabNavigator({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const showEvt =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvt, () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(hideEvt, () =>
      setKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ✅ Hide the whole bar while the keyboard is open
  // DISABLED: This was causing keyboard to close in modals
  // if (keyboardVisible) return null;

  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? (options.tabBarLabel as string)
            : options.title !== undefined
            ? (options.title as string)
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate({ name: route.name, merge: true } as any);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
          >
            {/* Use the tabBarIcon from options if available, otherwise fallback to TabBarIconElement */}
            {options.tabBarIcon ? (
              options.tabBarIcon({
                focused: isFocused,
                color: isFocused ? BaseColors.primary : BaseColors.othertexts,
                size: 24,
              })
            ) : (
              <TabBarIconElement icon={undefined} focused={isFocused} />
            )}
            <Text
              style={[
                styles.tabLabel,
                isFocused && styles.tabLabelFocused,
                { marginTop: 0 },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 100,
    backgroundColor: BaseColors.dark,
    borderTopWidth: 1,
    borderTopColor: BaseColors.secondary,
    paddingTop: 0,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#8E8E93',
    fontFamily: 'Inter',
  },
  tabLabelFocused: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
