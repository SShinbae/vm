npx tsc --noEmit
app/(tabs)/index.tsx:50:19 - error TS2345: Argument of type 'VehicleWithDetails[]' is not assignable to parameter of type 'SetStateAction<VehicleWithLogs[]>'.
  Type 'VehicleWithDetails[]' is not assignable to type 'VehicleWithLogs[]'.
    Property 'shared_with_groups' is missing in type 'VehicleWithDetails' but required in type 'VehicleWithLogs'.

50       setVehicles(data);
                     ~~~~

  types/database.ts:41:11
    41           shared_with_groups: boolean;
                 ~~~~~~~~~~~~~~~~~~
    'shared_with_groups' is declared here.

components/navigation/WebNavbar.tsx:36:40 - error TS2339: Property 'useStyles' does not exist on type '{ new (): StyleSheet; prototype: StyleSheet; }'.

36   const { styles, theme } = StyleSheet.useStyles(stylesheet);
                                          ~~~~~~~~~

components/parallax-scroll-view.tsx:9:10 - error TS2305: Module '"react-native-unistyles"' has no exported member 'StyleSheet'.

9 import { StyleSheet } from "react-native-unistyles";
           ~~~~~~~~~~

components/parallax-scroll-view.tsx:68:21 - error TS7006: Parameter 'theme' implicitly has an 'any' type.

68 const stylesheet = (theme) => ({
                       ~~~~~

components/themed-text.tsx:2:10 - error TS2305: Module '"react-native-unistyles"' has no exported member 'StyleSheet'.

2 import { StyleSheet, useUnistyles } from "react-native-unistyles";
           ~~~~~~~~~~

components/themed-text.tsx:2:22 - error TS2724: '"react-native-unistyles"' has no exported member named 'useUnistyles'. Did you mean 'useStyles'?

2 import { StyleSheet, useUnistyles } from "react-native-unistyles";
                       ~~~~~~~~~~~~

components/themed-text.tsx:28:21 - error TS7006: Parameter 'theme' implicitly has an 'any' type.

28 const stylesheet = (theme) => ({
                       ~~~~~

components/themed-text.tsx:45:17 - error TS2304: Cannot find name 'a'.

45     fontWeight: a,
                   ~

components/themed-view.tsx:2:10 - error TS2724: '"react-native-unistyles"' has no exported member named 'useUnistyles'. Did you mean 'useStyles'?

2 import { useUnistyles } from "react-native-unistyles";
           ~~~~~~~~~~~~

components/ui/ImagePicker.tsx:339:11 - error TS2322: Type '(croppedImageUri: string) => void' is not assignable to type '(croppedFile: File) => void'.
  Types of parameters 'croppedImageUri' and 'croppedFile' are incompatible.
    Type 'File' is not assignable to type 'string'.

339           onCropComplete={handleCropComplete}
              ~~~~~~~~~~~~~~

  components/ui/ImageCropModal.tsx:45:3
    45   onCropComplete: (croppedFile: File) => void;
         ~~~~~~~~~~~~~~
    The expected type comes from property 'onCropComplete' which is declared here on type 'IntrinsicAttributes & ImageCropModalProps'

components/ui/ImageUpload.tsx:174:59 - error TS2339: Property 'image_url' does not exist on type 'string | { id: string; vehicle_id: string; image_url: string; image_type: "profile_avatar" | "vehicle_main" | "vehicle_gallery"; caption: string | null; display_order: number; uploaded_by: string | null; created_at: string; updated_at: string; }'.
  Property 'image_url' does not exist on type 'string'.

174           type === "avatar" ? result.data! : result.data!.image_url;
                                                              ~~~~~~~~~

components/ui/ImageUpload.tsx:268:59 - error TS2339: Property 'image_url' does not exist on type 'string | { id: string; vehicle_id: string; image_url: string; image_type: "profile_avatar" | "vehicle_main" | "vehicle_gallery"; caption: string | null; display_order: number; uploaded_by: string | null; created_at: string; updated_at: string; }'.
  Property 'image_url' does not exist on type 'string'.

268           type === "avatar" ? result.data! : result.data!.image_url;
                                                              ~~~~~~~~~

components/ui/LoadingSpinner.tsx:40:24 - error TS2345: Argument of type '{ paddingVertical: number; paddingHorizontal: number; }' is not assignable to parameter of type '{ alignItems: "center"; justifyContent: "center"; }'.
  Type '{ paddingVertical: number; paddingHorizontal: number; }' is missing the following properties from type '{ alignItems: "center"; justifyContent: "center"; }': alignItems, justifyContent

40         baseStyle.push(styles.overlayContainer);
                          ~~~~~~~~~~~~~~~~~~~~~~~

components/ui/LoadingSpinner.tsx:43:24 - error TS2345: Argument of type '{ flexDirection: "row"; alignItems: "center"; paddingVertical: number; gap: number; }' is not assignable to parameter of type '{ alignItems: "center"; justifyContent: "center"; }'.
  Property 'justifyContent' is missing in type '{ flexDirection: "row"; alignItems: "center"; paddingVertical: number; gap: number; }' but required in type '{ alignItems: "center"; justifyContent: "center"; }'.

43         baseStyle.push(styles.inlineContainer);
                          ~~~~~~~~~~~~~~~~~~~~~~

  components/ui/LoadingSpinner.tsx:104:5
    104     justifyContent: "center",
            ~~~~~~~~~~~~~~~~~~~~~~~~
    'justifyContent' is declared here.

components/ui/LoadingSpinner.tsx:46:24 - error TS2345: Argument of type '{ flex: number; paddingVertical: number; }' is not assignable to parameter of type '{ alignItems: "center"; justifyContent: "center"; }'.
  Type '{ flex: number; paddingVertical: number; }' is missing the following properties from type '{ alignItems: "center"; justifyContent: "center"; }': alignItems, justifyContent

46         baseStyle.push(styles.defaultContainer);
                          ~~~~~~~~~~~~~~~~~~~~~~~

components/ui/LoadingSpinner.tsx:50:22 - error TS2345: Argument of type 'ViewStyle' is not assignable to parameter of type '{ alignItems: "center"; justifyContent: "center"; }'.
  Types of property 'alignItems' are incompatible.
    Type 'FlexAlignType | undefined' is not assignable to type '"center"'.
      Type 'undefined' is not assignable to type '"center"'.

50       baseStyle.push(style);
                        ~~~~~

components/ui/LoadingSpinner.tsx:60:22 - error TS2345: Argument of type 'TextStyle' is not assignable to parameter of type '{ marginTop: number; fontSize: number; fontWeight: "500"; textAlign: "center"; } | { color: string; }'.
  Type 'TextStyle' is not assignable to type '{ marginTop: number; fontSize: number; fontWeight: "500"; textAlign: "center"; }'.
    Types of property 'marginTop' are incompatible.
      Type 'DimensionValue | undefined' is not assignable to type 'number'.
        Type 'undefined' is not assignable to type 'number'.

60       baseStyle.push(textStyle);
                        ~~~~~~~~~

components/ui/MetricCard.tsx:137:17 - error TS2322: Type 'string' is not assignable to type 'SFSymbols6_0'.

137                 name={icon}
                    ~~~~

  components/ui/icon-symbol.tsx:88:3
    88   name: IconSymbolName;
         ~~~~
    The expected type comes from property 'name' which is declared here on type 'IntrinsicAttributes & { name: SFSymbols6_0; size?: number | undefined; color: string | OpaqueColorValue; style?: StyleProp<TextStyle>; weight?: SymbolWeight | undefined; }'

components/ui/Modal.tsx:280:22 - error TS2345: Argument of type '{ padding: number; }' is not assignable to parameter of type '{ flex: number; justifyContent: "center"; alignItems: "center"; padding: number; }'.
  Type '{ padding: number; }' is missing the following properties from type '{ flex: number; justifyContent: "center"; alignItems: "center"; padding: number; }': flex, justifyContent, alignItems

280       baseStyle.push(styles.fullscreenContainer);
                         ~~~~~~~~~~~~~~~~~~~~~~~~~~

components/ui/Modal.tsx:282:22 - error TS2345: Argument of type '{ justifyContent: "flex-end"; padding: number; }' is not assignable to parameter of type '{ flex: number; justifyContent: "center"; alignItems: "center"; padding: number; }'.
  Type '{ justifyContent: "flex-end"; padding: number; }' is missing the following properties from type '{ flex: number; justifyContent: "center"; alignItems: "center"; padding: number; }': flex, alignItems

282       baseStyle.push(styles.bottomSheetContainer);
                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~

components/ui/Modal.tsx:286:22 - error TS2345: Argument of type 'ViewStyle' is not assignable to parameter of type '{ flex: number; justifyContent: "center"; alignItems: "center"; padding: number; }'.
  Types of property 'flex' are incompatible.
    Type 'number | undefined' is not assignable to type 'number'.
      Type 'undefined' is not assignable to type 'number'.

286       baseStyle.push(containerStyle);
                         ~~~~~~~~~~~~~~

components/ui/Modal.tsx:302:22 - error TS2345: Argument of type '{ width: "100%"; height: "100%"; borderRadius: number; borderWidth: number; }' is not assignable to parameter of type '{ borderRadius: number; borderWidth: number; overflow: "hidden"; minWidth: number; maxWidth: "100%"; } | { backgroundColor: string; borderColor: string; }'.
  Type '{ width: "100%"; height: "100%"; borderRadius: number; borderWidth: number; }' is missing the following properties from type '{ borderRadius: number; borderWidth: number; overflow: "hidden"; minWidth: number; maxWidth: "100%"; }': overflow, minWidth, maxWidth

302       baseStyle.push(styles.fullscreenContent);
                         ~~~~~~~~~~~~~~~~~~~~~~~~

components/ui/Modal.tsx:304:22 - error TS2345: Argument of type '{ width: "100%"; borderTopLeftRadius: number; borderTopRightRadius: number; borderBottomLeftRadius: number; borderBottomRightRadius: number; maxHeight: number; }' is not assignable to parameter of type '{ borderRadius: number; borderWidth: number; overflow: "hidden"; minWidth: number; maxWidth: "100%"; } | { backgroundColor: string; borderColor: string; }'.

304       baseStyle.push(styles.bottomSheetContent);
                         ~~~~~~~~~~~~~~~~~~~~~~~~~

components/ui/Modal.tsx:310:13 - error TS2322: Type 'number' is not assignable to type '"100%"'.

310             maxWidth: screenWidth * 0.8,
                ~~~~~~~~

components/ui/Modal.tsx:316:13 - error TS2322: Type 'number' is not assignable to type '"100%"'.

316             maxWidth: screenWidth * 0.95,
                ~~~~~~~~

components/ui/Modal.tsx:322:13 - error TS2322: Type 'number' is not assignable to type '"100%"'.

322             maxWidth: screenWidth * 0.9,
                ~~~~~~~~

components/ui/Modal.tsx:329:22 - error TS2345: Argument of type 'ViewStyle' is not assignable to parameter of type '{ borderRadius: number; borderWidth: number; overflow: "hidden"; minWidth: number; maxWidth: "100%"; } | { backgroundColor: string; borderColor: string; }'.
  Type 'ViewStyle' is not assignable to type '{ borderRadius: number; borderWidth: number; overflow: "hidden"; minWidth: number; maxWidth: "100%"; }'.
    Types of property 'borderRadius' are incompatible.
      Type 'string | AnimatableNumericValue | undefined' is not assignable to type 'number'.
        Type 'undefined' is not assignable to type 'number'.

329       baseStyle.push(contentStyle);
                         ~~~~~~~~~~~~

components/ui/Modal.tsx:339:22 - error TS2345: Argument of type 'TextStyle' is not assignable to parameter of type '{ fontSize: number; fontWeight: "600"; flex: number; } | { color: string; }'.
  Type 'TextStyle' is not assignable to type '{ fontSize: number; fontWeight: "600"; flex: number; }'.
    Types of property 'fontSize' are incompatible.
      Type 'number | undefined' is not assignable to type 'number'.
        Type 'undefined' is not assignable to type 'number'.

339       baseStyle.push(titleStyle);
                         ~~~~~~~~~~

components/ui/NotificationBell.tsx:25:9 - error TS2322: Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'string | OpaqueColorValue | undefined'.
  Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'string | OpaqueColorValue | undefined'.

25         color={iconColor}
           ~~~~~

  node_modules/@expo/vector-icons/build/createIconSet.d.ts:23:5
    23     color?: string | OpaqueColorValue;
           ~~~~~
    The expected type comes from property 'color' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Component<IconProps<"search" | "repeat" | "link" | "at" | "body" | "code" | "map" | "menu" | "time" | "ellipse" | "filter" | "image" | "stop" | ... 1343 more ... | "woman-sharp">, {}, any>> & Pick<...> & InexactPartial<...> & InexactPartial<...>'

components/ui/NotificationBell.tsx:30:11 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: ViewProps): View', gave the following error.
    Type '{ backgroundColor: string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly [...]; card: readonly [...]; } | { ...; } | { ...; }; }' is not assignable to type 'StyleProp<ViewStyle>'.
      Types of property 'backgroundColor' are incompatible.
        Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'ColorValue | undefined'.
          Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'ColorValue | undefined'.
  Overload 2 of 2, '(props: ViewProps, context: any): View', gave the following error.
    Type '{ backgroundColor: string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly [...]; card: readonly [...]; } | { ...; } | { ...; }; }' is not assignable to type 'StyleProp<ViewStyle>'.
      Types of property 'backgroundColor' are incompatible.
        Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'ColorValue | undefined'.
          Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'ColorValue | undefined'.

30           style={{ backgroundColor: badgeColor }}
             ~~~~~

  node_modules/react-native/Libraries/Components/View/ViewPropTypes.d.ts:212:3
    212   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<View> & Readonly<ViewProps>'
  node_modules/react-native/Libraries/Components/View/ViewPropTypes.d.ts:212:3
    212   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<View> & Readonly<ViewProps>'

components/ui/NotificationToast.tsx:79:7 - error TS2322: Type 'number' is not assignable to type 'Timeout'.

79       timeoutRef.current = setTimeout(() => {
         ~~~~~~~~~~~~~~~~~~

components/ui/NotificationToast.tsx:156:9 - error TS2322: Type '{ backgroundColor: string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly [...]; card: readonly [...]; } | { ...; } | { ...; }; borderWidth: number; borderColor: string | ... 3 ...' is not assignable to type 'StyleProp<ViewStyle>'.
  Types of property 'backgroundColor' are incompatible.
    Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'ColorValue | undefined'.
      Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'ColorValue | undefined'.

156         style={{
            ~~~~~

  node_modules/react-native/Libraries/Components/Touchable/TouchableWithoutFeedback.d.ts:122:3
    122   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'

components/ui/NotificationToast.tsx:168:17 - error TS2322: Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'string | OpaqueColorValue | undefined'.
  Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'string | OpaqueColorValue | undefined'.

168                 color={getIconColor()}
                    ~~~~~

  node_modules/@expo/vector-icons/build/createIconSet.d.ts:23:5
    23     color?: string | OpaqueColorValue;
           ~~~~~
    The expected type comes from property 'color' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Component<IconProps<"search" | "repeat" | "link" | "at" | "body" | "code" | "map" | "menu" | "time" | "ellipse" | "filter" | "image" | "stop" | ... 1343 more ... | "woman-sharp">, {}, any>> & Pick<...> & InexactPartial<...> & InexactPartial<...>'

components/ui/NotificationToast.tsx:175:17 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: TextProps): Text', gave the following error.
    Type '{ color: string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }; }' is not assignable to type 'StyleProp<TextStyle>'.
      Types of property 'color' are incompatible.
        Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'ColorValue | undefined'.
          Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'ColorValue | undefined'.
  Overload 2 of 2, '(props: TextProps, context: any): Text', gave the following error.
    Type '{ color: string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }; }' is not assignable to type 'StyleProp<TextStyle>'.
      Types of property 'color' are incompatible.
        Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'ColorValue | undefined'.
          Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'ColorValue | undefined'.

175                 style={{ color: textColor }}
                    ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/ui/NotificationToast.tsx:182:17 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: TextProps): Text', gave the following error.
    Type '{ color: string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }; opacity: number; }' is not assignable to type 'StyleProp<TextStyle>'.
      Types of property 'color' are incompatible.
        Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'ColorValue | undefined'.
          Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'ColorValue | undefined'.
  Overload 2 of 2, '(props: TextProps, context: any): Text', gave the following error.
    Type '{ color: string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }; opacity: number; }' is not assignable to type 'StyleProp<TextStyle>'.
      Types of property 'color' are incompatible.
        Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'ColorValue | undefined'.
          Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'ColorValue | undefined'.

182                 style={{ color: textColor, opacity: 0.8 }}
                    ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/ui/NotificationToast.tsx:197:17 - error TS2322: Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'string | OpaqueColorValue | undefined'.
  Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'string | OpaqueColorValue | undefined'.

197                 color={textColor}
                    ~~~~~

  node_modules/@expo/vector-icons/build/createIconSet.d.ts:23:5
    23     color?: string | OpaqueColorValue;
           ~~~~~
    The expected type comes from property 'color' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Component<IconProps<"search" | "repeat" | "link" | "at" | "body" | "code" | "map" | "menu" | "time" | "ellipse" | "filter" | "image" | "stop" | ... 1343 more ... | "woman-sharp">, {}, any>> & Pick<...> & InexactPartial<...> & InexactPartial<...>'

components/ui/Skeleton.tsx:61:9 - error TS2322: Type '{ width: string | number; height: number; borderRadius: number; backgroundColor: string | Animated.AnimatedInterpolation<string | number>; }' is not assignable to type 'false | "" | RegisteredStyle<ViewStyle> | Value | AnimatedInterpolation<string | number> | WithAnimatedObject<ViewStyle> | WithAnimatedArray<...> | readonly (false | ... 6 more ... | undefined)[] | null | undefined'.
  Types of property 'width' are incompatible.
    Type 'string | number' is not assignable to type 'number | "auto" | `${number}%` | Value | AnimatedInterpolation<string | number> | WithAnimatedObject<AnimatedNode> | null | undefined'.
      Type 'string' is not assignable to type 'number | "auto" | `${number}%` | Value | AnimatedInterpolation<string | number> | WithAnimatedObject<AnimatedNode> | null | undefined'.

 61         {
            ~
 62           width,
    ~~~~~~~~~~~~~~~~
...
 65           backgroundColor,
    ~~~~~~~~~~~~~~~~~~~~~~~~~~
 66         },
    ~~~~~~~~~

components/ui/TrendCard.tsx:129:29 - error TS2322: Type 'string' is not assignable to type 'SFSymbols6_0'.

129                 <IconSymbol name={icon} size={20} color="#FFFFFF" />
                                ~~~~

  components/ui/icon-symbol.tsx:88:3
    88   name: IconSymbolName;
         ~~~~
    The expected type comes from property 'name' which is declared here on type 'IntrinsicAttributes & { name: SFSymbols6_0; size?: number | undefined; color: string | OpaqueColorValue; style?: StyleProp<TextStyle>; weight?: SymbolWeight | undefined; }'

components/VehicleDetail.tsx:501:17 - error TS2322: Type '{ children: Element[]; style: (false | { shadowColor?: string | undefined; shadowOffset?: { width: number; height: number; } | undefined; shadowOpacity?: number | undefined; shadowRadius?: number | undefined; ... 10 more ...; borderColor: string; } | { ...; })[]; onMouseEnter: (() => void) | undefined; onMouseLeave:...' is not assignable to type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'.
  Property 'onMouseEnter' does not exist on type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'.

501                 onMouseEnter={
                    ~~~~~~~~~~~~

components/VehicleDetail.tsx:535:17 - error TS2322: Type '{ children: Element[]; style: (false | { shadowColor?: string | undefined; shadowOffset?: { width: number; height: number; } | undefined; shadowOpacity?: number | undefined; shadowRadius?: number | undefined; ... 10 more ...; borderColor: string; } | { ...; })[]; onMouseEnter: (() => void) | undefined; onMouseLeave:...' is not assignable to type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'.
  Property 'onMouseEnter' does not exist on type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'.

535                 onMouseEnter={isWeb ? () => setHoveredItem("fuel") : undefined}
                    ~~~~~~~~~~~~

components/VehicleDetail.tsx:579:17 - error TS2322: Type '{ children: Element[]; style: (false | { shadowColor?: string | undefined; shadowOffset?: { width: number; height: number; } | undefined; shadowOpacity?: number | undefined; shadowRadius?: number | undefined; ... 10 more ...; borderColor: string; } | { ...; })[]; onMouseEnter: (() => void) | undefined; onMouseLeave:...' is not assignable to type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'.
  Property 'onMouseEnter' does not exist on type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'.

579                 onMouseEnter={
                    ~~~~~~~~~~~~

components/VehicleDetail.tsx:626:17 - error TS2322: Type '{ children: Element[]; style: (false | { shadowColor?: string | undefined; shadowOffset?: { width: number; height: number; } | undefined; shadowOpacity?: number | undefined; shadowRadius?: number | undefined; ... 10 more ...; borderColor: string; } | { ...; })[]; onMouseEnter: (() => void) | undefined; onMouseLeave:...' is not assignable to type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'.
  Property 'onMouseEnter' does not exist on type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'.

626                 onMouseEnter={
                    ~~~~~~~~~~~~

lib/contexts/AuthContext.tsx:56:9 - error TS2741: Property 'username' is missing in type '{ id: string; email: string; }' but required in type 'AuthUser'.

56         return { id: user.id, email: user.email || "" };
           ~~~~~~

  types/index.ts:187:3
    187   username: string;
          ~~~~~~~~
    'username' is declared here.

lib/contexts/AuthContext.tsx:59:7 - error TS2741: Property 'username' is missing in type '{ id: string; email: string; profile: undefined; }' but required in type 'AuthUser'.

59       return {
         ~~~~~~

  types/index.ts:187:3
    187   username: string;
          ~~~~~~~~
    'username' is declared here.

lib/contexts/AuthContext.tsx:66:7 - error TS2741: Property 'username' is missing in type '{ id: string; email: string; }' but required in type 'AuthUser'.

66       return { id: user.id, email: user.email || "" };
         ~~~~~~

  types/index.ts:187:3
    187   username: string;
          ~~~~~~~~
    'username' is declared here.

lib/contexts/AuthContext.tsx:242:15 - error TS2558: Expected 2 type arguments, but got 1.

242         .from<Profile>("profiles")
                  ~~~~~~~

lib/contexts/AuthContext.tsx:243:17 - error TS2345: Argument of type 'Partial<{ id: string; email: string; full_name: string | null; username: string | null; avatar_url: string | null; created_at: string; updated_at: string; }>' is not assignable to parameter of type 'never[TableName] extends { Update: unknown; } ? never[TableName]["Update"] : never'.

243         .update({
                    ~
244           ...updates,
    ~~~~~~~~~~~~~~~~~~~~~
245           updated_at: new Date().toISOString(),
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
246         } as Partial<Profile>)
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

lib/contexts/AuthContext.tsx:247:19 - error TS2345: Argument of type 'string' is not assignable to parameter of type '("id" extends keyof never[TableName]["Row"] ? never[TableName]["Row"][keyof never[TableName]["Row"] & "id"] : (ContainsNull<never[TableName]["Row"]> extends true ? ContainsNull<...> extends true ? ContainsNull<...> extends true ? ContainsNull<...> extends true ? ContainsNull<...> extends true ? ContainsNull<...> ext...'.

247         .eq("id", state.user.id);
                      ~~~~~~~~~~~~~

lib/services/analyticsService.ts:255:15 - error TS2339: Property 'vehicles' does not exist on type '{ id: string; vehicle_id: string; user_id: string; liters_filled: number; cost: number | null; date: string; odometer_reading: number; location: string | null; created_at: string; }'.

255       if (log.vehicles) {
                  ~~~~~~~~

lib/services/analyticsService.ts:257:36 - error TS2339: Property 'vehicles' does not exist on type '{ id: string; vehicle_id: string; user_id: string; liters_filled: number; cost: number | null; date: string; odometer_reading: number; location: string | null; created_at: string; }'.

257         const vehicleName = `${log.vehicles.year} ${log.vehicles.make} ${log.vehicles.model}`;
                                       ~~~~~~~~

lib/services/analyticsService.ts:257:57 - error TS2339: Property 'vehicles' does not exist on type '{ id: string; vehicle_id: string; user_id: string; liters_filled: number; cost: number | null; date: string; odometer_reading: number; location: string | null; created_at: string; }'.

257         const vehicleName = `${log.vehicles.year} ${log.vehicles.make} ${log.vehicles.model}`;
                                                            ~~~~~~~~

lib/services/analyticsService.ts:257:78 - error TS2339: Property 'vehicles' does not exist on type '{ id: string; vehicle_id: string; user_id: string; liters_filled: number; cost: number | null; date: string; odometer_reading: number; location: string | null; created_at: string; }'.

257         const vehicleName = `${log.vehicles.year} ${log.vehicles.make} ${log.vehicles.model}`;
                                                                                 ~~~~~~~~

lib/services/analyticsService.ts:274:15 - error TS2339: Property 'vehicles' does not exist on type '{ id: string; vehicle_id: string; user_id: string; service_type: string; description: string; cost: number | null; date: string; odometer_reading: number; next_service_due: string | null; receipt_image_url: string | null; ocr_extracted_data: any; auto_filled: boolean | null; created_at: string; }'.

274       if (log.vehicles) {
                  ~~~~~~~~

lib/services/analyticsService.ts:276:36 - error TS2339: Property 'vehicles' does not exist on type '{ id: string; vehicle_id: string; user_id: string; service_type: string; description: string; cost: number | null; date: string; odometer_reading: number; next_service_due: string | null; receipt_image_url: string | null; ocr_extracted_data: any; auto_filled: boolean | null; created_at: string; }'.

276         const vehicleName = `${log.vehicles.year} ${log.vehicles.make} ${log.vehicles.model}`;
                                       ~~~~~~~~

lib/services/analyticsService.ts:276:57 - error TS2339: Property 'vehicles' does not exist on type '{ id: string; vehicle_id: string; user_id: string; service_type: string; description: string; cost: number | null; date: string; odometer_reading: number; next_service_due: string | null; receipt_image_url: string | null; ocr_extracted_data: any; auto_filled: boolean | null; created_at: string; }'.

276         const vehicleName = `${log.vehicles.year} ${log.vehicles.make} ${log.vehicles.model}`;
                                                            ~~~~~~~~

lib/services/analyticsService.ts:276:78 - error TS2339: Property 'vehicles' does not exist on type '{ id: string; vehicle_id: string; user_id: string; service_type: string; description: string; cost: number | null; date: string; odometer_reading: number; next_service_due: string | null; receipt_image_url: string | null; ocr_extracted_data: any; auto_filled: boolean | null; created_at: string; }'.

276         const vehicleName = `${log.vehicles.year} ${log.vehicles.make} ${log.vehicles.model}`;
                                                                                 ~~~~~~~~

lib/services/pushNotificationService.ts:103:62 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "push_tokens", never, "POST">', gave the following error.
    Argument of type '{ user_id: string; token: string; platform: "ios" | "android" | "windows" | "macos" | "web"; device_name: string; }' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "push_tokens", never, "POST">', gave the following error.
    Object literal may only specify known properties, and 'user_id' does not exist in type 'never[]'.

103         const { error } = await supabase.from("push_tokens").insert({
                                                                 ~~~~~~


lib/services/vehicleService-fallback.ts:45:58 - error TS2339: Property 'group_id' does not exist on type 'never'.

45         const groupIds = groupMemberships.map((gm) => gm.group_id);
                                                            ~~~~~~~~

lib/services/vehicleService-fallback.ts:56:55 - error TS2339: Property 'user_id' does not exist on type 'never'.

56             ...new Set(allGroupMembers.map((gm) => gm.user_id)),
                                                         ~~~~~~~

lib/services/vehicleService-fallback.ts:93:15 - error TS2698: Spread types may only be created from object types.

93               ...vehicle,
                 ~~~~~~~~~~

lib/services/vehicleService-fallback.ts:95:46 - error TS2339: Property 'id' does not exist on type 'never'.

95                 ownerProfiles?.find((p) => p.id === vehicle.user_id) || null,
                                                ~~

lib/services/vehicleService-fallback.ts:95:61 - error TS2339: Property 'user_id' does not exist on type 'never'.

95                 ownerProfiles?.find((p) => p.id === vehicle.user_id) || null,
                                                               ~~~~~~~

lib/services/vehicleService-fallback.ts:105:11 - error TS2698: Spread types may only be created from object types.

105           ...vehicle,
              ~~~~~~~~~~

lib/services/vehicleService-fallback.ts:269:17 - error TS2345: Argument of type '{ updated_at: string; make?: string; model?: string; year?: number; license_plate?: string; vin?: string | null; main_image_url?: string | null; color?: string | null; current_mileage?: number | null; shared_with_groups?: boolean; }' is not assignable to parameter of type 'never'.

269         .update({
                    ~
270           ...updates,
    ~~~~~~~~~~~~~~~~~~~~~
271           updated_at: new Date().toISOString(),
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
272         })
    ~~~~~~~~~

lib/services/vehicleService-fallback.ts:333:45 - error TS2339: Property 'odometer_reading' does not exist on type 'never'.

333         currentMileage: latestMileage?.[0]?.odometer_reading || 0,
                                                ~~~~~~~~~~~~~~~~

lib/services/vehicleService-fallback.ts:373:19 - error TS2339: Property 'user_id' does not exist on type 'never'.

373       if (vehicle.user_id !== user.id) {
                      ~~~~~~~

lib/services/vehicleService-fallback.ts:391:19 - error TS2345: Argument of type '{ shared_with_groups: boolean; updated_at: string; }' is not assignable to parameter of type 'never'.

391           .update({
                      ~
392             shared_with_groups: shared,
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
393             updated_at: new Date().toISOString(),
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
394           })
    ~~~~~~~~~~~


Found 67 errors in 19 files.

Errors  Files
     1  app/(tabs)/index.tsx:50
     1  components/navigation/WebNavbar.tsx:36
     2  components/parallax-scroll-view.tsx:9
     4  components/themed-text.tsx:2
     1  components/themed-view.tsx:2
     1  components/ui/ImagePicker.tsx:339
     2  components/ui/ImageUpload.tsx:174
     5  components/ui/LoadingSpinner.tsx:40
     1  components/ui/MetricCard.tsx:137
    10  components/ui/Modal.tsx:280
     2  components/ui/NotificationBell.tsx:25
     6  components/ui/NotificationToast.tsx:79
     1  components/ui/Skeleton.tsx:61
     1  components/ui/TrendCard.tsx:129
     4  components/VehicleDetail.tsx:501
     6  lib/contexts/AuthContext.tsx:56
     8  lib/services/analyticsService.ts:255
     1  lib/services/pushNotificationService.ts:103
    10  lib/services/vehicleService-fallback.ts:45