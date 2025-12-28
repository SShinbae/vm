/**
 * Web Polyfill for react-native-reanimated
 *
 * This provides stub implementations for Reanimated on web platform
 * to prevent build errors when bundling for web.
 */

import { useRef, useCallback, useMemo } from "react";

// Re-export React Native components as-is for web
import {
  View as RNView,
  Text as RNText,
  ScrollView as RNScrollView,
  Image as RNImage,
} from "react-native";

// Mock shared values
export function useSharedValue(initialValue) {
  const ref = useRef({ value: initialValue });
  return ref.current;
}

export function useDerivedValue(fn) {
  const value = useMemo(() => fn(), [fn]);
  return { value };
}

// Mock animations
export const withTiming = (value, config) => value;
export const withSpring = (value, config) => value;
export const withDecay = (value, config) => value;
export const withDelay = (delay, value) => value;
export const withRepeat = (value, count) => value;
export const withSequence = (...values) => values[values.length - 1];

export const cancelAnimation = (sharedValue) => {};

// Mock animated styles
export function useAnimatedStyle(fn) {
  return useMemo(() => fn(), [fn]);
}

export function useAnimatedProps(fn) {
  return useMemo(() => fn(), [fn]);
}

// Mock animated refs
export function useAnimatedRef() {
  return useRef(null);
}

// Mock gesture handlers
export function useAnimatedGestureHandler(handlers) {
  return useCallback(
    (event) => {
      if (handlers.onStart) handlers.onStart(event);
      if (handlers.onActive) handlers.onActive(event);
      if (handlers.onEnd) handlers.onEnd(event);
    },
    [handlers],
  );
}

// Mock scroll handlers
export function useAnimatedScrollHandler(handler) {
  return useCallback(
    (event) => {
      if (typeof handler === "function") {
        handler(event);
      } else if (handler.onScroll) {
        handler.onScroll(event);
      }
    },
    [handler],
  );
}

// Mock worklet runtime functions
export const runOnJS =
  (fn) =>
  (...args) =>
    fn(...args);
export const runOnUI =
  (fn) =>
  (...args) =>
    fn(...args);

// Mock createSerializable - this is what's causing the error
export const createSerializable = (obj) => obj;

// Mock makeShareable
export const makeShareable = (value) => value;

// Mock interpolate functions
export function interpolate(value, inputRange, outputRange, config) {
  return value;
}

export function interpolateColor(value, inputRange, outputRange, config) {
  return outputRange[0];
}

export function Extrapolate() {
  return {
    CLAMP: "clamp",
    EXTEND: "extend",
    IDENTITY: "identity",
  };
}

// Mock measure
export function measure(ref) {
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    pageX: 0,
    pageY: 0,
  };
}

// Mock scrollTo
export function scrollTo(ref, x, y, animated) {
  if (ref.current && ref.current.scrollTo) {
    ref.current.scrollTo({ x, y, animated });
  }
}

// Mock Easing
export const Easing = {
  linear: (t) => t,
  ease: (t) => t,
  quad: (t) => t * t,
  cubic: (t) => t * t * t,
  poly: (n) => (t) => Math.pow(t, n),
  sin: (t) => 1 - Math.cos((t * Math.PI) / 2),
  circle: (t) => 1 - Math.sqrt(1 - t * t),
  exp: (t) => Math.pow(2, 10 * (t - 1)),
  elastic:
    (bounciness = 1) =>
    (t) =>
      t,
  back:
    (s = 1.70158) =>
    (t) =>
      t * t * ((s + 1) * t - s),
  bounce: (t) => t,
  bezier: (x1, y1, x2, y2) => (t) => t,
  in: (easing) => easing,
  out: (easing) => (t) => 1 - easing(1 - t),
  inOut: (easing) => (t) =>
    t < 0.5 ? easing(t * 2) / 2 : 1 - easing((1 - t) * 2) / 2,
};

export const Animated = {
  View: RNView,
  Text: RNText,
  ScrollView: RNScrollView,
  Image: RNImage,
  FlatList: require("react-native").FlatList,
  createAnimatedComponent: (Component) => Component,
};

// Default export
export default {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withSpring,
  withDecay,
  withDelay,
  withRepeat,
  withSequence,
  cancelAnimation,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedRef,
  useAnimatedGestureHandler,
  useAnimatedScrollHandler,
  runOnJS,
  runOnUI,
  createSerializable,
  makeShareable,
  interpolate,
  interpolateColor,
  Extrapolate,
  measure,
  scrollTo,
  Easing,
  Animated,
};
