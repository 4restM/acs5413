import { useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Spring scale-down feedback for pressables. Returns an animated
 * transform style plus press handlers to wire onto a Pressable.
 * 
 * Experimental addition for UX.
 */
export function usePressScale(scaleTo = 0.95) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  return {
    animatedStyle: { transform: [{ scale }] },
    onPressIn,
    onPressOut,
  };
}
