import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { StyleZ } from '../../assets/css/styles';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';

export default function LFForgotPasswordLink({
  label,
  route,
  enhanced = false,
  type = 'primary',
}: {
  label: string;
  route: string;
  enhanced?: boolean;
  type?: 'primary' | 'danger';
}): React.JSX.Element {
  const [isPressed, setIsPressed] = useState(false);
  const navigation = useNavigation<any>();

  const getButtonStyle = (): ViewStyle => {
    let backgroundColor = '#2662d9'; // primary blue
    let borderColor = '#2662d9';

    if (type === 'danger') {
      backgroundColor = '#ef4444'; // danger red
      borderColor = '#ef4444';
    }

    if (isPressed) {
      backgroundColor = type === 'danger' ? '#e55c5c' : '#4179e7';
      borderColor = backgroundColor;
    }

    return {
      backgroundColor,
      borderColor,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 15,
      alignSelf: 'center',
      maxWidth: 200,
      minWidth: 120,
    };
  };

  const getTextStyle = (): TextStyle => {
    return {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 15,
      textAlign: 'center',
    };
  };

  return (
    <View style={StyleZ.LFForgotPasswordLink_Container}>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={() => {
          navigation.navigate(route as never);
        }}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        activeOpacity={0.8}
      >
        <Text style={getTextStyle()}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}
