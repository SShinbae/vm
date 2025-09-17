import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { useEffect } from 'react';

export function HelloWave() {
  const rotateAnimation = useSharedValue(0);

  useEffect(() => {
    rotateAnimation.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 150 }),
        withTiming(-25, { duration: 150 }),
        withTiming(25, { duration: 150 }),
        withTiming(0, { duration: 150 })
      ),
      1
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnimation.value}deg` }],
  }));

  return (
    <Animated.Text
      style={[{
        fontSize: 28,
        lineHeight: 32,
        marginTop: -6,
      }, animatedStyle]}>
      👋
    </Animated.Text>
  );
}
