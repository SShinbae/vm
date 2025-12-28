/**
 * Web Polyfill for react-native-worklets
 *
 * This provides stub implementations for worklets on web platform
 * to prevent build errors when bundling for web.
 */

// Mock worklet runtime for web
export const useWorklet = (fn: any) => fn;

export const runOnJS =
  (fn: any) =>
  (...args: any[]) => {
    return fn(...args);
  };

export const runOnWorklet =
  (fn: any) =>
  (...args: any[]) => {
    return fn(...args);
  };

export const useSharedValue = (initialValue: any) => {
  return { value: initialValue };
};

export const useDerivedValue = (fn: () => any) => {
  return { value: fn() };
};

export const withTiming = (value: any, _config?: any) => value;
export const withSpring = (value: any, _config?: any) => value;
export const withDecay = (value: any, _config?: any) => value;
export const withDelay = (_delay: number, value: any) => value;
export const withRepeat = (value: any, _count?: number) => value;
export const withSequence = (...values: any[]) => values[values.length - 1];

export const cancelAnimation = (_sharedValue: any) => {};

// Export a default no-op createWorkletRuntime
export const createWorkletRuntime = () => ({
  runOnRuntime: (fn: any) => fn,
});

// Mock createSerializable (used by reanimated spring animations)
export const createSerializable = (obj: any) => obj;

// Mock SerializableObject (alias)
export const createSerializableObject = (obj: any) => obj;

// Mock makeShareable
export const makeShareable = (value: any) => value;

// Mock runOnUI
export const runOnUI =
  (fn: any) =>
  (...args: any[]) => {
    return fn(...args);
  };

export default {
  useWorklet,
  runOnJS,
  runOnWorklet,
  useSharedValue,
  useDerivedValue,
  withTiming,
  withSpring,
  withDecay,
  withDelay,
  withRepeat,
  withSequence,
  cancelAnimation,
  createWorkletRuntime,
  createSerializable,
  createSerializableObject,
  makeShareable,
  runOnUI,
};
