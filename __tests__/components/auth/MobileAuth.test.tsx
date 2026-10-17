import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AuthLayout,
  AuthInput,
  AuthButton,
  AuthCheckbox,
  AuthHeader,
} from "@/components/auth";

let mockWidth = 390;
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({ width: mockWidth, height: 844, scale: 1, fontScale: 1 }),
}));
jest.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-unistyles", () => ({
  useStyles: () => ({ theme: require("@/src/design-system").lightTheme }),
}));
function contentStyle() {
  return screen
    .UNSAFE_getAllByType(View)
    .map((node) => StyleSheet.flatten(node.props.style))
    .find((style) => style?.width === "100%" && style?.alignSelf === "center")!;
}
beforeEach(() => {
  mockWidth = 390;
});
afterEach(() => jest.restoreAllMocks());

it.each(["ios", "android", "web"] as const)(
  "keeps compact auth scrollable with native-only keyboard avoidance on %s",
  (os) => {
    jest.replaceProperty(Platform, "OS", os);
    render(
      <AuthLayout>
        <Text>Form</Text>
      </AuthLayout>,
    );
    const scroll = screen.UNSAFE_getByType(ScrollView);
    expect(scroll.props.keyboardShouldPersistTaps).toBe("handled");
    expect(scroll.props.keyboardDismissMode).toBe("on-drag");
    expect(screen.UNSAFE_getByType(KeyboardAvoidingView).props.enabled).toBe(
      os !== "web",
    );
    expect(contentStyle().paddingHorizontal).toBe(16);
    expect(contentStyle().justifyContent).toBe("flex-start");
  },
);

it("adapts the form width after a resize", () => {
  jest.replaceProperty(Platform, "OS", "web");
  const view = render(
    <AuthLayout>
      <Text>Form</Text>
    </AuthLayout>,
  );
  mockWidth = 1200;
  view.rerender(
    <AuthLayout>
      <Text>Form</Text>
    </AuthLayout>,
  );
  expect(contentStyle().maxWidth).toBe(450);
  expect(contentStyle().justifyContent).toBe("center");
});

it("labels inputs, forwards Next, supports password autofill and announces inline errors", () => {
  const next = jest.fn();
  const ref = React.createRef<TextInput>();
  render(
    <AuthInput
      ref={ref}
      label="Password"
      placeholder="Password"
      type="password"
      value="draft"
      onChangeText={jest.fn()}
      autoComplete="current-password"
      textContentType="password"
      returnKeyType="next"
      onSubmitEditing={next}
      error="Try another password"
    />,
  );
  const input = screen.getByLabelText("Password");
  expect(input.props.autoComplete).toBe("current-password");
  expect(input.props.textContentType).toBe("password");
  expect(input.props.returnKeyType).toBe("next");
  expect(input.props.secureTextEntry).toBe(true);
  fireEvent(input, "submitEditing");
  expect(next).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByRole("button", { name: "Show password" }));
  expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(false);
  expect(screen.getByRole("alert").props.children).toBe("Try another password");
  expect(ref.current).toBeTruthy();
});

it("keeps loading buttons labelled and disabled, and exposes checkbox state", () => {
  render(
    <View>
      <AuthButton title="Sign in" loading onPress={jest.fn()} />
      <AuthCheckbox
        label="Accept terms"
        checked
        onToggle={jest.fn()}
        disabled
      />
    </View>,
  );
  expect(
    screen.getByRole("button", { name: "Sign in" }).props.accessibilityState,
  ).toEqual({ disabled: true, busy: true });
  expect(
    screen.getByRole("checkbox", { name: "Accept terms" }).props
      .accessibilityState,
  ).toEqual({ checked: true, disabled: true });
});

it("uses a compact shared heading on mobile", () => {
  render(
    <AuthHeader icon="lock-closed" title="Welcome Back" subtitle="Sign in" />,
  );
  expect(screen.getByRole("header", { name: "Welcome Back" })).toBeTruthy();
});
