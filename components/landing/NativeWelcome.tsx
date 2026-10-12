import { AuthButton } from "@/components/auth/AuthButton";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { darkTheme, lightTheme } from "@/src/design-system";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";

// Keep the finished welcome when returning from an auth route in the same launch.
let welcomeRevealed = false;

export function skipWelcomeAnimation() {
  welcomeRevealed = true;
}

export function NativeWelcome() {
  const { theme } = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { isLoading: themeLoading } = useTheme();
  const [themeReady, setThemeReady] = useState(!themeLoading);
  const systemScheme = useColorScheme();
  const splashBackground =
    systemScheme === "dark"
      ? darkTheme.colors.background
      : lightTheme.colors.background;
  const initialDone = welcomeRevealed;
  const motion = useRef(new Animated.Value(initialDone ? 1 : 0)).current;
  const surface = useRef(new Animated.Value(initialDone ? 1 : 0)).current;
  const [revealed, setRevealed] = useState(initialDone);
  const [staticLogo, setStaticLogo] = useState(initialDone);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [rootSize, setRootSize] = useState<{ width: number; height: number }>();
  const [targetLaidOut, setTargetLaidOut] = useState(false);
  const [destination, setDestination] = useState({ x: 0, y: 0 });
  const rootRef = useRef<View>(null);
  const targetRef = useRef<View>(null);
  const started = useRef(initialDone);
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(true);

  useEffect(() => {
    if (!themeLoading) {
      setThemeReady(true);
      return;
    }
    const fallback = setTimeout(() => setThemeReady(true), 2000);
    return () => clearTimeout(fallback);
  }, [themeLoading]);

  useEffect(
    () => () => {
      active.current = false;
      animation.current?.stop();
    },
    [],
  );

  const finish = useCallback(() => {
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    welcomeRevealed = true;
    motion.setValue(1);
    surface.setValue(1);
    setRevealed(true);
    setStaticLogo(true);
    requestAnimationFrame(() => void SplashScreen.hideAsync().catch(() => {}));
  }, [motion, surface]);

  useEffect(() => {
    if (started.current || !imageFailed || !themeReady) return;
    started.current = true;
    finish();
  }, [imageFailed, themeReady, finish]);

  useEffect(() => {
    if (started.current) return;
    fallbackTimer.current = setTimeout(
      () => setImageFailed(true),
      imageLoaded ? 2200 : 1500,
    );
    return () => {
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    };
  }, [imageLoaded]);

  useEffect(() => {
    if (
      started.current ||
      !imageLoaded ||
      !rootSize ||
      !targetLaidOut ||
      !themeReady
    )
      return;
    rootRef.current?.measureInWindow((rx, ry) => {
      targetRef.current?.measureInWindow((tx, ty, width, height) => {
        if (started.current) return;
        started.current = true;
        if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
        setDestination({
          x: tx + width / 2 - rx - rootSize.width / 2,
          y: ty + height / 2 - ry - rootSize.height / 2,
        });
        if (reduceMotion) {
          finish();
          return;
        }
        requestAnimationFrame(() => {
          void SplashScreen.hideAsync()
            .then(() => {
              if (!active.current) return;
              animation.current = Animated.parallel([
                Animated.timing(motion, {
                  toValue: 1,
                  duration: 450,
                  useNativeDriver: true,
                }),
                Animated.timing(surface, {
                  toValue: 1,
                  duration: 450,
                  useNativeDriver: false,
                }),
              ]);
              animation.current.start(({ finished }) => {
                if (finished && active.current) {
                  welcomeRevealed = true;
                  setRevealed(true);
                  setStaticLogo(true);
                }
              });
            })
            .catch(() => {
              if (active.current) finish();
            });
        });
      });
    });
  }, [
    imageLoaded,
    rootSize,
    targetLaidOut,
    reduceMotion,
    themeReady,
    finish,
    motion,
    surface,
  ]);

  const onRootLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (
      !staticLogo &&
      rootSize &&
      (rootSize.width !== width || rootSize.height !== height)
    ) {
      started.current = true;
      animation.current?.stop();
      finish();
    }
    setRootSize({ width, height });
  };

  const logoSource =
    systemScheme === "dark"
      ? require("@/assets/images/splash-icon-dark.png")
      : require("@/assets/images/splash-icon-light.png");

  return (
    <Animated.View
      ref={rootRef}
      testID="native-welcome-root"
      onLayout={onRootLayout}
      style={{
        flex: 1,
        backgroundColor: surface.interpolate({
          inputRange: [0, 1],
          outputRange: [splashBackground, theme.colors.background],
        }),
      }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 24,
          paddingLeft: Math.max(insets.left, 24),
          paddingRight: Math.max(insets.right, 24),
        }}
      >
        <Animated.View
          importantForAccessibility={revealed ? "auto" : "no-hide-descendants"}
          accessibilityElementsHidden={!revealed}
          pointerEvents={revealed ? "auto" : "none"}
          style={{
            width: "100%",
            maxWidth: 440,
            alignSelf: "center",
            opacity: motion.interpolate({
              inputRange: [0, 0.44, 1],
              outputRange: [0, 0, 1],
            }),
          }}
        >
          <View
            ref={targetRef}
            testID="welcome-logo-target"
            onLayout={() => setTargetLaidOut(true)}
            style={{ width: 120, height: 64, marginBottom: 24 }}
          >
            {imageFailed ? (
              <Image
                source={require("@/assets/images/vm_logo.webp")}
                style={{ width: 64, height: 64 }}
                contentFit="contain"
                accessible={false}
              />
            ) : staticLogo ? (
              <Animated.Image
                source={logoSource}
                style={{
                  position: "absolute",
                  width: 120,
                  height: 120,
                  top: -28,
                }}
                accessible={false}
              />
            ) : null}
          </View>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: 16,
              marginBottom: 20,
            }}
          >
            Vehicle Management
          </Text>
          <Text
            accessibilityRole="header"
            style={{
              color: theme.colors.text,
              fontSize: 38,
              lineHeight: 44,
              fontWeight: "800",
              letterSpacing: -1,
              marginBottom: 16,
            }}
          >
            Your vehicles. One clear picture.
          </Text>
          <Text
            style={{
              color: theme.colors.text,
              opacity: 0.8,
              fontSize: 17,
              lineHeight: 26,
              marginBottom: 40,
            }}
          >
            Keep fuel, services and expenses together. Know what every family
            vehicle really costs.
          </Text>
          <AuthButton
            title="Create account"
            variant="secondary"
            disabled={!revealed}
            onPress={() => router.push("/(auth)/register")}
          />
          <AuthButton
            title="Sign in"
            variant="outline"
            disabled={!revealed}
            onPress={() => router.push("/(auth)/login")}
            style={{ marginBottom: 16 }}
          />
          <View
            style={{ flexDirection: "row", justifyContent: "center", gap: 24 }}
          >
            <TouchableOpacity
              disabled={!revealed}
              accessibilityRole="link"
              onPress={() => router.push("/privacy")}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Text style={{ color: theme.colors.text, fontSize: 14 }}>
                Privacy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!revealed}
              accessibilityRole="link"
              onPress={() => router.push("/terms")}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Text style={{ color: theme.colors.text, fontSize: 14 }}>
                Terms
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
      {!staticLogo && !imageFailed && !!rootSize && (
        <Animated.Image
          testID="welcome-splash-logo"
          source={logoSource}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageFailed(true)}
          accessible={false}
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            left: rootSize.width / 2 - 100,
            top: rootSize.height / 2 - 100,
            transform: [
              {
                translateX: motion.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, destination.x],
                }),
              },
              {
                translateY: motion.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, destination.y],
                }),
              },
              {
                scale: motion.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.6],
                }),
              },
            ],
          }}
        />
      )}
    </Animated.View>
  );
}
