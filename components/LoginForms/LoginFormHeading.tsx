import { Text, View, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { StyleZ } from '../../assets/css/styles';
import { BasePaddingsMargins } from '../../hooks/Template';

export default function LoginFormHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={[StyleZ.loginFormHeading]}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignSelf: 'center',
        }}
      >
        {title.split('').map((char, index) => {
          const charAnimatedValue = useRef(new Animated.Value(0)).current;
          useEffect(() => {
            Animated.timing(charAnimatedValue, {
              toValue: 1,
              duration: 2000,
              delay: index * 150,
              useNativeDriver: false,
            }).start();
          }, []);
          const translateY = charAnimatedValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, -10, 0], // jump up 10 units and back
          });
          return (
            <Animated.Text
              key={index}
              style={[
                StyleZ.headerTitleStyle,
                {
                  color: '#007bff',
                  marginBottom: BasePaddingsMargins.titleMarginBottom,
                  fontSize: StyleZ.headerTitleStyle.fontSize * 1.4, // 40% bigger
                  transform: [{ translateY }],
                },
              ]}
            >
              {char}
            </Animated.Text>
          );
        })}
      </View>
      {subtitle !== undefined ? (
        <Text
          style={[
            StyleZ.headerSubtitleStyle,
            {
              textAlign: 'center',
            },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
