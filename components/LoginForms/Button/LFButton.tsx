import {
  Alert,
  Animated,
  Easing,
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { StyleZ } from '../../../assets/css/styles';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { BaseColors } from '../../../hooks/Template';

export default function LFButton({
  label = '',
  type = 'primary',
  onPress,
  loading,
  icon,
  size = 'default',
  marginbottom,
  disabled,
  StyleProp,
}: {
  label?: string;
  type:
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'dark'
    | 'outline-dark'
    | 'success';
  onPress?: () => void;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'small' | 'compact' | 'default' | 'bigger' | 'big';
  marginbottom?: number;
  disabled?: boolean;
  StyleProp?: StyleProp<ViewStyle>;
}) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const spin = rotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });

  const [isPressed, set_isPressed] = useState<boolean>(false);

  const color = () => {
    if (type === 'primary') return StyleZ.LFButtonPrimary.color;
    else if (type === 'danger') return StyleZ.LFButtonDanger.color;
    else if (type === 'outline-dark') return StyleZ.LFButtonOutlineDark.color;
    else if (type === 'secondary') return StyleZ.LFButtonSecondary.color;
    else if (type === 'success') return StyleZ.LFButtonSuccess.color;
    return BaseColors.othertexts;
  };
  const colorPressed = () => color();

  const style = () => {
    if (type === 'primary') return StyleZ.LFButtonPrimary;
    else if (type === 'danger') return StyleZ.LFButtonDanger;
    else if (type === 'dark') return StyleZ.LFButtonDark;
    else if (type === 'outline-dark') return StyleZ.LFButtonOutlineDark;
    else if (type === 'secondary') return StyleZ.LFButtonSecondary;
    else if (type === 'success') return StyleZ.LFButtonSuccess;
    return null;
  };
  const stylePressed = () => {
    if (type === 'primary') return StyleZ.LFButtonPrimaryPressed;
    else if (type === 'danger') return StyleZ.LFButtonDangerPressed;
    else if (type === 'outline-dark') return StyleZ.LFButtonOutlineDarkPressed;
    else if (type === 'success') return StyleZ.LFButtonSuccessPressed; // ✅ add pressed style for green
    return null;
  };
  const styleSize = () => {
    if (size === 'small') return StyleZ.LFBUtton_Small;
    else if (size === 'compact') return StyleZ.LFBUtton_Compact;
    else if (size == 'bigger') return StyleZ.LFBUtton_Bigger;
    return null;
  };
  const fontSize = (): number => {
    if (size === 'small') return StyleZ.LFBUtton_Small.fontSize;
    else if (size === 'compact') return StyleZ.LFBUtton_Compact.fontSize;
    else if (size === 'bigger') return StyleZ.LFBUtton_Bigger.fontSize;
    return StyleZ.LFBUtton.fontSize;
  };

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
    return () => {
      rotateAnim.stopAnimation();
    };
  }, [rotateAnim]);

  return (
    <View
      style={[
        StyleZ.LFButtonContainer,
        { width: '100%' },
        loading === true ? { pointerEvents: 'none', opacity: 0.7 } : null,
        marginbottom !== undefined
          ? { marginBottom: marginbottom, marginBlockEnd: marginbottom }
          : null,
        StyleProp !== undefined ? StyleProp : {},
      ]}
    >
      <TouchableOpacity
        disabled={disabled === true}
        activeOpacity={1}
        style={[
          {
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          },
          StyleZ.LFBUtton,
          style(),
          styleSize(),
          isPressed ? stylePressed() : null,
          isPressed ? { transform: [{ scale: 0.95 }] } : null,
          disabled === true ? { opacity: 0.5 } : {},
        ]}
        onPressIn={() => set_isPressed(true)}
        onPressOut={() => set_isPressed(false)}
        onPress={() => {
          if (onPress) onPress();
        }}
      >
        {icon !== undefined ? (
          <Ionicons
            name={icon}
            style={{
              fontSize: fontSize(),
              color: color(),
              marginRight: label !== '' ? 5 : 0,
              display: 'flex',
              justifyContent: 'center',
            }}
          />
        ) : null}
        {label !== '' ? (
          <Text
            style={{
              display: 'flex',
              fontSize: StyleZ.LFBUtton.fontSize,
              color: isPressed ? colorPressed() : color(),
              textAlign: 'center',
            }}
          >
            {label}
          </Text>
        ) : null}
      </TouchableOpacity>

      {loading === true ? (
        <Animated.View
          style={{
            opacity: spin,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              width: 16,
              height: 16,
              borderRadius: 8,
            }}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}
