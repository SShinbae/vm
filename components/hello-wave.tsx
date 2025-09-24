import { Animated, Text } from 'react-native';
import { useEffect, useRef } from 'react';

export function HelloWave() {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 25,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: -25,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 25,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={[{
        fontSize: 28,
        lineHeight: 32,
        marginTop: -6,
        transform: [{ rotate: rotateAnim.interpolate({
          inputRange: [-25, 25],
          outputRange: ['-25deg', '25deg'],
        }) }],
      }]}>
      👋
    </Animated.Text>
  );
}