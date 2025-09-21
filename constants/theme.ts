/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Facebook-inspired color palette
const facebookBlue = '#1877F2';
const facebookBlueHover = '#166FE5';
const facebookGreen = '#42B883';
const facebookGray = '#8A8D91';
const facebookLightGray = '#F5F6F7';

const tintColorLight = facebookBlue;
const tintColorDark = '#4A9EFF';

export const Colors = {
  light: {
    text: '#1C1E21',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: facebookGray,
    tabIconDefault: facebookGray,
    tabIconSelected: tintColorLight,
    // Facebook-inspired semantic colors
    surface: facebookLightGray,
    border: '#DADDE1',
    link: facebookBlue,
    // Facebook-specific colors
    facebook: {
      primary: facebookBlue,
      primaryHover: facebookBlueHover,
      secondary: facebookGreen,
      gray: facebookGray,
      lightGray: facebookLightGray,
      background: '#F0F2F5',
      card: '#FFFFFF',
      divider: '#DADDE1',
      placeholder: '#8A8D91',
      error: '#F02849',
      success: facebookGreen,
    },
  },
  dark: {
    text: '#E4E6EA',
    background: '#18191A',
    tint: tintColorDark,
    icon: '#B0B3B8',
    tabIconDefault: '#B0B3B8',
    tabIconSelected: tintColorDark,
    // Facebook-inspired dark mode colors
    surface: '#242526',
    border: '#3A3B3C',
    link: '#4A9EFF',
    // Facebook-specific dark colors
    facebook: {
      primary: tintColorDark,
      primaryHover: '#3A8BFF',
      secondary: facebookGreen,
      gray: '#B0B3B8',
      lightGray: '#3A3B3C',
      background: '#18191A',
      card: '#242526',
      divider: '#3A3B3C',
      placeholder: '#B0B3B8',
      error: '#F02849',
      success: facebookGreen,
    },
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
