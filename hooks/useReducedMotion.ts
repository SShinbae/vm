import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Hook to detect if the user has enabled reduced motion preferences
 * Respects system accessibility settings for motion sensitivity
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Check initial state
    AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
      setReduceMotion(isEnabled ?? false);
    });

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (isEnabled) => {
        setReduceMotion(isEnabled);
      },
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  return reduceMotion;
}
