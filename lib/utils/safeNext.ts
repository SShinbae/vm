import { Platform } from "react-native";

const KEY = "postLoginNext";

/** An in-app path to continue to after sign-in, or null. Never another site. */
export function safeNext(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  )
    return null;
  return value;
}

// A Google sign-in on web is a full-page redirect that drops ?next=, so
// keep it for the trip.
export function rememberNext(next: string | null): void {
  if (Platform.OS !== "web") return;
  try {
    // Clear on null so an abandoned attempt can't steer a later login.
    if (next) window.sessionStorage.setItem(KEY, next);
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // storage blocked: the user lands in the app instead
  }
}

export function takeRememberedNext(): string | null {
  if (Platform.OS !== "web") return null;
  try {
    const v = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    return safeNext(v);
  } catch {
    return null;
  }
}
