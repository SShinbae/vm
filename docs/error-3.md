 npx tsc --noEmit
app/(tabs)/analytics.tsx:341:19 - error TS2322: Type 'readonly ["#948979", "#DFD0B8"] | readonly ["#DFD0B8", "#C4B5A0"]' is not assignable to type '[string, string] | undefined'.
  The type 'readonly ["#948979", "#DFD0B8"]' is 'readonly' and cannot be assigned to the mutable type '[string, string]'.

341                   gradientColors={colors.gradients.primary}
                      ~~~~~~~~~~~~~~

  components/ui/TrendCard.tsx:14:3
    14   gradientColors?: [string, string];
         ~~~~~~~~~~~~~~
    The expected type comes from property 'gradientColors' which is declared here on type 'IntrinsicAttributes & TrendCardProps'

app/(tabs)/index.tsx:407:19 - error TS2322: Type 'readonly ["#948979", "#DFD0B8"] | readonly ["#DFD0B8", "#C4B5A0"]' is not assignable to type '[string, string] | undefined'.
  The type 'readonly ["#948979", "#DFD0B8"]' is 'readonly' and cannot be assigned to the mutable type '[string, string]'.

407                   gradientColors={colors.gradients.primary}
                      ~~~~~~~~~~~~~~

  components/ui/TrendCard.tsx:14:3
    14   gradientColors?: [string, string];
         ~~~~~~~~~~~~~~
    The expected type comes from property 'gradientColors' which is declared here on type 'IntrinsicAttributes & TrendCardProps'

app/(tabs)/logs.tsx:99:41 - error TS18046: 'mileageResult.value' is of type 'unknown'.

99       if (isFulfilled(mileageResult) && mileageResult.value.data) {
                                           ~~~~~~~~~~~~~~~~~~~

app/(tabs)/logs.tsx:100:24 - error TS18046: 'mileageResult.value' is of type 'unknown'.

100         setMileageLogs(mileageResult.value.data);
                           ~~~~~~~~~~~~~~~~~~~

app/(tabs)/logs.tsx:112:21 - error TS18046: 'fuelResult.value' is of type 'unknown'.

112         setFuelLogs(fuelResult.value.data);
                        ~~~~~~~~~~~~~~~~

app/(tabs)/logs.tsx:122:24 - error TS18046: 'serviceResult.value' is of type 'unknown'.

122         setServiceLogs(serviceResult.value.data);
                           ~~~~~~~~~~~~~~~~~~~

app/groups/[id].tsx:79:25 - error TS2345: Argument of type 'VehicleWithDetails[]' is not assignable to parameter of type 'SetStateAction<VehicleWithGroupInfo[]>'.
  Type 'VehicleWithDetails[]' is not assignable to type 'VehicleWithGroupInfo[]'.
    Type 'VehicleWithDetails' is not assignable to type 'VehicleWithGroupInfo'.
      Types of property 'shared_groups' are incompatible.
        Type '{ id: string; name: string; description: string | null; owner_id: string; created_at: string; updated_at: string; }[]' is not assignable to type '{ id: string; name: string; description?: string | undefined; }[]'.
          Type '{ id: string; name: string; description: string | null; owner_id: string; created_at: string; updated_at: string; }' is not assignable to type '{ id: string; name: string; description?: string | undefined; }'.
            Types of property 'description' are incompatible.
              Type 'string | null' is not assignable to type 'string | undefined'.
                Type 'null' is not assignable to type 'string | undefined'.

79       setSharedVehicles(vehiclesResult.data.sharedVehicles || []);
                           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/logs/service/[id]/index.tsx:396:17 - error TS2322: Type 'string' is not assignable to type 'SFSymbols6_0'.

396                 name={
                    ~~~~

  components/ui/icon-symbol.tsx:88:3
    88   name: IconSymbolName;
         ~~~~
    The expected type comes from property 'name' which is declared here on type 'IntrinsicAttributes & { name: SFSymbols6_0; size?: number | undefined; color: string | OpaqueColorValue; style?: StyleProp<TextStyle>; weight?: SymbolWeight | undefined; }'

app/vehicles/[id].tsx:4:27 - error TS2307: Cannot find module '@/components/ui/symbol-types' or its corresponding type declarations.

4 import { SFSymbols } from "@/components/ui/symbol-types";
                            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/vehicles/[id].tsx:272:9 - error TS2451: Cannot redeclare block-scoped variable 'isWeb'.

272   const isWeb = Platform.OS === "web";
            ~~~~~

app/vehicles/[id].tsx:273:9 - error TS2451: Cannot redeclare block-scoped variable 'isMobileWeb'.

273   const isMobileWeb = isWeb && windowWidth < 768;
            ~~~~~~~~~~~

app/vehicles/[id].tsx:274:9 - error TS2451: Cannot redeclare block-scoped variable 'isDesktopWeb'.

274   const isDesktopWeb = isWeb && windowWidth >= 768;
            ~~~~~~~~~~~~

app/vehicles/[id].tsx:275:9 - error TS2451: Cannot redeclare block-scoped variable 'isMobile'.

275   const isMobile = !isWeb || isMobileWeb;
            ~~~~~~~~

app/vehicles/[id].tsx:513:9 - error TS2451: Cannot redeclare block-scoped variable 'isWeb'.

513   const isWeb = Platform.OS === "web";
            ~~~~~

app/vehicles/[id].tsx:514:9 - error TS2451: Cannot redeclare block-scoped variable 'isMobileWeb'.

514   const isMobileWeb = isWeb && windowWidth < 768;
            ~~~~~~~~~~~

app/vehicles/[id].tsx:515:9 - error TS2451: Cannot redeclare block-scoped variable 'isDesktopWeb'.

515   const isDesktopWeb = isWeb && windowWidth >= 768;
            ~~~~~~~~~~~~

app/vehicles/[id].tsx:516:9 - error TS2451: Cannot redeclare block-scoped variable 'isMobile'.

516   const isMobile = !isWeb || isMobileWeb;
            ~~~~~~~~

app/vehicles/[id].tsx:518:31 - error TS2345: Argument of type '{ text: string; textSecondary: string; textTertiary: string; background: string; backgroundSecondary: string; surface: string; tint: string; icon: string; tabIconDefault: string; tabIconSelected: string; ... 14 more ...; facebook: { ...; }; } | { ...; }' is not assignable to parameter of type '{ text: string; textSecondary: string; textTertiary: string; background: string; backgroundSecondary: string; surface: string; tint: string; icon: string; tabIconDefault: string; tabIconSelected: string; ... 14 more ...; facebook: { ...; }; }'.
  Type '{ text: string; textSecondary: string; textTertiary: string; background: string; backgroundSecondary: string; surface: string; tint: string; icon: string; tabIconDefault: string; tabIconSelected: string; ... 14 more ...; facebook: { ...; }; }' is not assignable to type '{ text: string; textSecondary: string; textTertiary: string; background: string; backgroundSecondary: string; surface: string; tint: string; icon: string; tabIconDefault: string; tabIconSelected: string; ... 14 more ...; facebook: { ...; }; }'. Two different types with this name exist, but they are unrelated.
    Type at position 0 in source is not compatible with type at position 0 in target.
      The types of 'gradients.primary' are incompatible between these types.
        Type '"#DFD0B8"' is not assignable to type '"#948979"'.

518   const styles = createStyles(colors, colorScheme, isDesktopWeb, isMobile);
                                  ~~~~~~

app/vehicles/[id].tsx:1047:6 - error TS2577: Return type annotation circularly references itself.

1047 ) => ReturnType<typeof createStyles>;
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

components/charts/BarChart.tsx:77:20 - error TS2339: Property 'length' does not exist on type 'string | number'.
  Property 'length' does not exist on type 'number'.

77       return label.length > 8 ? label.substring(0, 6) + "..." : label;
                      ~~~~~~

components/charts/BarChart.tsx:77:39 - error TS2339: Property 'substring' does not exist on type 'string | number'.
  Property 'substring' does not exist on type 'number'.

77       return label.length > 8 ? label.substring(0, 6) + "..." : label;
                                         ~~~~~~~~~

components/charts/BarChart.tsx:115:10 - error TS2769: No overload matches this call.
  Overload 2 of 2, '(props: AbstractChartProps & BarChartProps, context: any): BarChart', gave the following error.
    Type '{ labels: (string | number)[]; datasets: { data: number[]; }[]; }' is not assignable to type 'ChartData'.
      Types of property 'labels' are incompatible.
        Type '(string | number)[]' is not assignable to type 'string[]'.
          Type 'string | number' is not assignable to type 'string'.
            Type 'number' is not assignable to type 'string'.
  Overload 2 of 2, '(props: AbstractChartProps & BarChartProps, context: any): BarChart', gave the following error.
    Type '{ backgroundColor: string; backgroundGradientFrom: string; backgroundGradientTo: string; decimalPlaces: number; color: (opacity?: number) => string; labelColor: (opacity?: number) => string; style: { borderRadius: number; }; formatYLabel: (value: number) => string; }' is not assignable to type 'AbstractChartConfig'.
      Types of property 'formatYLabel' are incompatible.
        Type '(value: number) => string' is not assignable to type '(yLabel: string) => string'.
          Types of parameters 'value' and 'yLabel' are incompatible.
            Type 'string' is not assignable to type 'number'.

115         <RNBarChart
             ~~~~~~~~~~

  node_modules/react-native-chart-kit/dist/BarChart.d.ts:6:5
    6     data: ChartData;
          ~~~~
    The expected type comes from property 'data' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<BarChart> & Readonly<AbstractChartProps & BarChartProps>'
  node_modules/react-native-chart-kit/dist/AbstractChart.d.ts:6:5
    6     chartConfig?: AbstractChartConfig;
          ~~~~~~~~~~~
    The expected type comes from property 'chartConfig' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<BarChart> & Readonly<AbstractChartProps & BarChartProps>'

components/charts/LineChart.tsx:122:11 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: AbstractChartProps & LineChartProps): LineChart', gave the following error.
    Type '{ backgroundColor: string; backgroundGradientFrom: string; backgroundGradientTo: string; decimalPlaces: number; color: (opacity?: number) => string; labelColor: (opacity?: number) => string; style: { borderRadius: number; }; propsForDots: { ...; }; formatYLabel: (value: number) => string; }' is not assignable to type 'AbstractChartConfig'.
      Types of property 'formatYLabel' are incompatible.
        Type '(value: number) => string' is not assignable to type '(yLabel: string) => string'.
          Types of parameters 'value' and 'yLabel' are incompatible.
            Type 'string' is not assignable to type 'number'.
  Overload 2 of 2, '(props: AbstractChartProps & LineChartProps, context: any): LineChart', gave the following error.
    Type '{ backgroundColor: string; backgroundGradientFrom: string; backgroundGradientTo: string; decimalPlaces: number; color: (opacity?: number) => string; labelColor: (opacity?: number) => string; style: { borderRadius: number; }; propsForDots: { ...; }; formatYLabel: (value: number) => string; }' is not assignable to type 'AbstractChartConfig'.
      Types of property 'formatYLabel' are incompatible.
        Type '(value: number) => string' is not assignable to type '(yLabel: string) => string'.
          Types of parameters 'value' and 'yLabel' are incompatible.
            Type 'string' is not assignable to type 'number'.

122           chartConfig={chartConfig}
              ~~~~~~~~~~~

  node_modules/react-native-chart-kit/dist/AbstractChart.d.ts:6:5
    6     chartConfig?: AbstractChartConfig;
          ~~~~~~~~~~~
    The expected type comes from property 'chartConfig' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<LineChart> & Readonly<AbstractChartProps & LineChartProps>'
  node_modules/react-native-chart-kit/dist/AbstractChart.d.ts:6:5
    6     chartConfig?: AbstractChartConfig;
          ~~~~~~~~~~~
    The expected type comes from property 'chartConfig' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<LineChart> & Readonly<AbstractChartProps & LineChartProps>'

components/examples/UnistylesExample.tsx:10:39 - error TS2345: Argument of type '(theme: any) => { container: { flex: number; backgroundColor: any; }; header: { padding: any; backgroundColor: any; alignItems: string; }; title: { fontSize: any; fontWeight: any; color: any; marginBottom: any; }; ... 13 more ...; infoText: { ...; }; }' is not assignable to parameter of type 'StyleSheetWithSuperPowers | undefined'.
  Type '(theme: any) => { container: { flex: number; backgroundColor: any; }; header: { padding: any; backgroundColor: any; alignItems: string; }; title: { fontSize: any; fontWeight: any; color: any; marginBottom: any; }; ... 13 more ...; infoText: { ...; }; }' is not assignable to type '(theme: UnistylesTheme, miniRuntime: { contentSizeCategory: IOSContentSizeCategory | AndroidContentSizeCategory; ... 9 more ...; rtl: boolean; }) => StyleSheet'.
    Type '{ container: { flex: number; backgroundColor: any; }; header: { padding: any; backgroundColor: any; alignItems: string; }; title: { fontSize: any; fontWeight: any; color: any; marginBottom: any; }; subtitle: { ...; }; ... 12 more ...; infoText: { ...; }; }' is not assignable to type 'StyleSheet'.
      Property 'header' is incompatible with index signature.
        Type '{ padding: any; backgroundColor: any; alignItems: string; }' is not assignable to type 'UnistylesValues | ((...args: any) => UnistylesValues)'.
          Type '{ padding: any; backgroundColor: any; alignItems: string; }' is not assignable to type 'UnistylesValues'.
            Type '{ padding: any; backgroundColor: any; alignItems: string; }' is not assignable to type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 199 more ...; objectFit?: "fill" | .....'.
              Types of property 'alignItems' are incompatible.
                Type 'string' is not assignable to type 'FlexAlignType | { [x: symbol]: FlexAlignType | undefined; portrait?: FlexAlignType | undefined; landscape?: FlexAlignType | undefined; ... 4 more ...; xl?: FlexAlignType | undefined; } | undefined'.

10   const { styles, theme } = useStyles(stylesheet);
                                         ~~~~~~~~~~

components/examples/UnistylesExample.tsx:13:17 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: ScrollViewProps): ScrollView', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle'.
          Types of property 'backfaceVisibility' are incompatible.
            Type '"visible" | "hidden" | { [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 mo...' is not assignable to type '"visible" | "hidden" | undefined'.
              Type '{ [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 more ... | undefined; xl?...' is not assignable to type '"visible" | "hidden" | undefined'.
  Overload 2 of 2, '(props: ScrollViewProps, context: any): ScrollView', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle'.
          Types of property 'backfaceVisibility' are incompatible.
            Type '"visible" | "hidden" | { [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 mo...' is not assignable to type '"visible" | "hidden" | undefined'.
              Type '{ [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 more ... | undefined; xl?...' is not assignable to type '"visible" | "hidden" | undefined'.

13     <ScrollView style={styles.container}>
                   ~~~~~

  node_modules/react-native/Libraries/Components/ScrollView/ScrollView.d.ts:758:3
    758   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<ScrollView> & Readonly<ScrollViewProps>'
  node_modules/react-native/Libraries/Components/ScrollView/ScrollView.d.ts:758:3
    758   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<ScrollView> & Readonly<ScrollViewProps>'

components/examples/UnistylesExample.tsx:15:13 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: ViewProps): View', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle'.
          Types of property 'backfaceVisibility' are incompatible.
            Type '"visible" | "hidden" | { [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 mo...' is not assignable to type '"visible" | "hidden" | undefined'.
              Type '{ [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 more ... | undefined; xl?...' is not assignable to type '"visible" | "hidden" | undefined'.
  Overload 2 of 2, '(props: ViewProps, context: any): View', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle'.
          Types of property 'backfaceVisibility' are incompatible.
            Type '"visible" | "hidden" | { [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 mo...' is not assignable to type '"visible" | "hidden" | undefined'.
              Type '{ [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 more ... | undefined; xl?...' is not assignable to type '"visible" | "hidden" | undefined'.

15       <View style={styles.header}>
               ~~~~~

  node_modules/react-native/Libraries/Components/View/ViewPropTypes.d.ts:212:3
    212   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<View> & Readonly<ViewProps>'
  node_modules/react-native/Libraries/Components/View/ViewPropTypes.d.ts:212:3
    212   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<View> & Readonly<ViewProps>'

components/examples/UnistylesExample.tsx:16:15 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: TextProps): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.
  Overload 2 of 2, '(props: TextProps, context: any): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.

16         <Text style={styles.title}>Unistyles Example</Text>
                 ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/examples/UnistylesExample.tsx:17:15 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: TextProps): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.
  Overload 2 of 2, '(props: TextProps, context: any): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.

17         <Text style={styles.subtitle}>Modern styling for React Native</Text>
                 ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/examples/UnistylesExample.tsx:21:13 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: ViewProps): View', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle'.
          Types of property 'backfaceVisibility' are incompatible.
            Type '"visible" | "hidden" | { [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 mo...' is not assignable to type '"visible" | "hidden" | undefined'.
              Type '{ [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 more ... | undefined; xl?...' is not assignable to type '"visible" | "hidden" | undefined'.
  Overload 2 of 2, '(props: ViewProps, context: any): View', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle'.
          Types of property 'backfaceVisibility' are incompatible.
            Type '"visible" | "hidden" | { [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 mo...' is not assignable to type '"visible" | "hidden" | undefined'.
              Type '{ [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 more ... | undefined; xl?...' is not assignable to type '"visible" | "hidden" | undefined'.

21       <View style={styles.cardGrid}>
               ~~~~~

  node_modules/react-native/Libraries/Components/View/ViewPropTypes.d.ts:212:3
    212   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<View> & Readonly<ViewProps>'
  node_modules/react-native/Libraries/Components/View/ViewPropTypes.d.ts:212:3
    212   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<View> & Readonly<ViewProps>'

components/examples/UnistylesExample.tsx:22:15 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: ViewProps): View', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle'.
          Types of property 'backfaceVisibility' are incompatible.
            Type '"visible" | "hidden" | { [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 mo...' is not assignable to type '"visible" | "hidden" | undefined'.
              Type '{ [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 more ... | undefined; xl?...' is not assignable to type '"visible" | "hidden" | undefined'.
  Overload 2 of 2, '(props: ViewProps, context: any): View', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle'.
          Types of property 'backfaceVisibility' are incompatible.
            Type '"visible" | "hidden" | { [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 mo...' is not assignable to type '"visible" | "hidden" | undefined'.
              Type '{ [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 more ... | undefined; xl?...' is not assignable to type '"visible" | "hidden" | undefined'.

22         <View style={styles.card}>
                 ~~~~~

  node_modules/react-native/Libraries/Components/View/ViewPropTypes.d.ts:212:3
    212   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<View> & Readonly<ViewProps>'
  node_modules/react-native/Libraries/Components/View/ViewPropTypes.d.ts:212:3
    212   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<View> & Readonly<ViewProps>'

components/examples/UnistylesExample.tsx:23:17 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: TextProps): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.
  Overload 2 of 2, '(props: TextProps, context: any): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.

23           <Text style={styles.cardTitle}>Primary Card</Text>
                   ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/examples/UnistylesExample.tsx:24:17 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: TextProps): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.
  Overload 2 of 2, '(props: TextProps, context: any): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.

24           <Text style={styles.cardText}>
                   ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/examples/UnistylesExample.tsx:29:10 - error TS2769: No overload matches this call.
  Overload 2 of 2, '(props: ViewProps, context: any): View', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle'.
          Types of property 'backfaceVisibility' are incompatible.
            Type '"visible" | "hidden" | { [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 mo...' is not assignable to type '"visible" | "hidden" | undefined'.
              Type '{ [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 more ... | undefined; xl?...' is not assignable to type '"visible" | "hidden" | undefined'.
  Overload 2 of 2, '(props: ViewProps, context: any): View', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle'.
          Types of property 'backfaceVisibility' are incompatible.
            Type '"visible" | "hidden" | { [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 mo...' is not assignable to type '"visible" | "hidden" | undefined'.
              Type '{ [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 more ... | undefined; xl?...' is not assignable to type '"visible" | "hidden" | undefined'.

29         <View style={[styles.card, styles.cardSecondary]}>
            ~~~~


components/examples/UnistylesExample.tsx:30:17 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: TextProps): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.
  Overload 2 of 2, '(props: TextProps, context: any): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.

30           <Text style={styles.cardTitle}>Secondary Card</Text>
                   ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/examples/UnistylesExample.tsx:31:17 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: TextProps): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.
  Overload 2 of 2, '(props: TextProps, context: any): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.

31           <Text style={styles.cardText}>Styled with variants</Text>
                   ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/examples/UnistylesExample.tsx:36:13 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: ViewProps): View', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle'.
          Types of property 'backfaceVisibility' are incompatible.
            Type '"visible" | "hidden" | { [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 mo...' is not assignable to type '"visible" | "hidden" | undefined'.
              Type '{ [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 more ... | undefined; xl?...' is not assignable to type '"visible" | "hidden" | undefined'.
  Overload 2 of 2, '(props: ViewProps, context: any): View', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle'.
          Types of property 'backfaceVisibility' are incompatible.
            Type '"visible" | "hidden" | { [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 mo...' is not assignable to type '"visible" | "hidden" | undefined'.
              Type '{ [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 more ... | undefined; xl?...' is not assignable to type '"visible" | "hidden" | undefined'.

36       <View style={styles.buttonGroup}>
               ~~~~~

  node_modules/react-native/Libraries/Components/View/ViewPropTypes.d.ts:212:3
    212   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<View> & Readonly<ViewProps>'
  node_modules/react-native/Libraries/Components/View/ViewPropTypes.d.ts:212:3
    212   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<View> & Readonly<ViewProps>'

components/examples/UnistylesExample.tsx:37:27 - error TS2322: Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
  Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle'.
      Types of property 'backfaceVisibility' are incompatible.
        Type '"visible" | "hidden" | { [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 mo...' is not assignable to type '"visible" | "hidden" | undefined'.
          Type '{ [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 more ... | undefined; xl?...' is not assignable to type '"visible" | "hidden" | undefined'.

37         <TouchableOpacity style={styles.primaryButton}>
                             ~~~~~

  node_modules/react-native/Libraries/Components/Touchable/TouchableWithoutFeedback.d.ts:122:3
    122   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'

components/examples/UnistylesExample.tsx:38:17 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: TextProps): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.
  Overload 2 of 2, '(props: TextProps, context: any): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.

38           <Text style={styles.buttonText}>Primary Button</Text>
                   ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/examples/UnistylesExample.tsx:41:27 - error TS2322: Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
  Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle'.
      Types of property 'backfaceVisibility' are incompatible.
        Type '"visible" | "hidden" | { [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 mo...' is not assignable to type '"visible" | "hidden" | undefined'.
          Type '{ [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 more ... | undefined; xl?...' is not assignable to type '"visible" | "hidden" | undefined'.

41         <TouchableOpacity style={styles.secondaryButton}>
                             ~~~~~

  node_modules/react-native/Libraries/Components/Touchable/TouchableWithoutFeedback.d.ts:122:3
    122   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'

components/examples/UnistylesExample.tsx:42:17 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: TextProps): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.
  Overload 2 of 2, '(props: TextProps, context: any): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.

42           <Text style={styles.secondaryButtonText}>Secondary</Text>
                   ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/examples/UnistylesExample.tsx:47:13 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: ViewProps): View', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle'.
          Types of property 'backfaceVisibility' are incompatible.
            Type '"visible" | "hidden" | { [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 mo...' is not assignable to type '"visible" | "hidden" | undefined'.
              Type '{ [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 more ... | undefined; xl?...' is not assignable to type '"visible" | "hidden" | undefined'.
  Overload 2 of 2, '(props: ViewProps, context: any): View', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<ViewStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'ViewStyle'.
          Types of property 'backfaceVisibility' are incompatible.
            Type '"visible" | "hidden" | { [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 mo...' is not assignable to type '"visible" | "hidden" | undefined'.
              Type '{ [x: symbol]: "visible" | "hidden" | undefined; portrait?: "visible" | "hidden" | undefined; landscape?: "visible" | "hidden" | undefined; xs?: "visible" | "hidden" | undefined; sm?: "visible" | ... 1 more ... | undefined; md?: "visible" | ... 1 more ... | undefined; lg?: "visible" | ... 1 more ... | undefined; xl?...' is not assignable to type '"visible" | "hidden" | undefined'.

47       <View style={styles.infoBox}>
               ~~~~~

  node_modules/react-native/Libraries/Components/View/ViewPropTypes.d.ts:212:3
    212   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<View> & Readonly<ViewProps>'
  node_modules/react-native/Libraries/Components/View/ViewPropTypes.d.ts:212:3
    212   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<View> & Readonly<ViewProps>'

components/examples/UnistylesExample.tsx:48:15 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: TextProps): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.
  Overload 2 of 2, '(props: TextProps, context: any): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.

48         <Text style={styles.infoTitle}>💡 Theme Support</Text>
                 ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/examples/UnistylesExample.tsx:49:15 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: TextProps): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.
  Overload 2 of 2, '(props: TextProps, context: any): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.

49         <Text style={styles.infoText}>
                 ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/examples/UnistylesExample.tsx:53:15 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: TextProps): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.
  Overload 2 of 2, '(props: TextProps, context: any): Text', gave the following error.
    Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
      Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'StyleProp<TextStyle>'.
        Type '{ filter?: string | (readonly FilterFunction[] & string) | { [x: symbol]: string | (readonly FilterFunction[] & string) | undefined; portrait?: string | (readonly FilterFunction[] & string) | undefined; ... 5 more ...; xl?: string | ... 1 more ... | undefined; } | undefined; ... 203 more ...; textShadowOffset?: ToDe...' is not assignable to type 'TextStyle'.
          Types of property 'color' are incompatible.
            Type 'ColorValue | { [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; ... 4 more ...; xl?: ColorValue | undefined; } | undefined' is not assignable to type 'ColorValue | undefined'.
              Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'ColorValue | undefined'.
                Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'OpaqueColorValue'.
                  Type '{ [x: symbol]: ColorValue | undefined; portrait?: ColorValue | undefined; landscape?: ColorValue | undefined; xs?: ColorValue | undefined; sm?: ColorValue | undefined; md?: ColorValue | undefined; lg?: ColorValue | undefined; xl?: ColorValue | undefined; }' is not assignable to type 'symbol'.

53         <Text style={styles.infoText}>
                 ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/layout/WebLayout.tsx:25:21 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: ViewProps): View', gave the following error.
    Type 'ViewStyle | TextStyle | ImageStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Type 'TextStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
        Type 'TextStyle' is not assignable to type 'ViewStyle'.
          Types of property 'cursor' are incompatible.
            Type 'string | undefined' is not assignable to type 'CursorValue | undefined'.
              Type 'string' is not assignable to type 'CursorValue | undefined'.
  Overload 2 of 2, '(props: ViewProps, context: any): View', gave the following error.
    Type 'ViewStyle | TextStyle | ImageStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Type 'TextStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
        Type 'TextStyle' is not assignable to type 'ViewStyle'.
          Types of property 'cursor' are incompatible.
            Type 'string | undefined' is not assignable to type 'CursorValue | undefined'.
              Type 'string' is not assignable to type 'CursorValue | undefined'.

25       <View style={[styles.container, { backgroundColor: colors.background }]}>
                       ~~~~~~~~~~~~~~~~


components/layout/WebLayout.tsx:28:13 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: ViewProps): View', gave the following error.
    Type 'ViewStyle | TextStyle | ImageStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Type 'TextStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
        Type 'TextStyle' is not assignable to type 'ViewStyle'.
          Types of property 'cursor' are incompatible.
            Type 'string | undefined' is not assignable to type 'CursorValue | undefined'.
              Type 'string' is not assignable to type 'CursorValue | undefined'.
  Overload 2 of 2, '(props: ViewProps, context: any): View', gave the following error.
    Type 'ViewStyle | TextStyle | ImageStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Type 'TextStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
        Type 'TextStyle' is not assignable to type 'ViewStyle'.
          Types of property 'cursor' are incompatible.
            Type 'string | undefined' is not assignable to type 'CursorValue | undefined'.
              Type 'string' is not assignable to type 'CursorValue | undefined'.

28             styles.content,
               ~~~~~~~~~~~~~~


components/layout/WebLayout.tsx:43:19 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: ViewProps): View', gave the following error.
    Type 'ViewStyle | TextStyle | ImageStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Type 'TextStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
        Type 'TextStyle' is not assignable to type 'ViewStyle'.
          Types of property 'cursor' are incompatible.
            Type 'string | undefined' is not assignable to type 'CursorValue | undefined'.
              Type 'string' is not assignable to type 'CursorValue | undefined'.
  Overload 2 of 2, '(props: ViewProps, context: any): View', gave the following error.
    Type 'ViewStyle | TextStyle | ImageStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Type 'TextStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
        Type 'TextStyle' is not assignable to type 'ViewStyle'.
          Types of property 'cursor' are incompatible.
            Type 'string | undefined' is not assignable to type 'CursorValue | undefined'.
              Type 'string' is not assignable to type 'CursorValue | undefined'.

43     <View style={[styles.container, { backgroundColor: colors.background }]}>
                     ~~~~~~~~~~~~~~~~


components/layout/WebLayout.tsx:44:21 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: ViewProps): View', gave the following error.
    Type 'ViewStyle | TextStyle | ImageStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Type 'TextStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
        Type 'TextStyle' is not assignable to type 'ViewStyle'.
          Types of property 'cursor' are incompatible.
            Type 'string | undefined' is not assignable to type 'CursorValue | undefined'.
              Type 'string' is not assignable to type 'CursorValue | undefined'.
  Overload 2 of 2, '(props: ViewProps, context: any): View', gave the following error.
    Type 'ViewStyle | TextStyle | ImageStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Type 'TextStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
        Type 'TextStyle' is not assignable to type 'ViewStyle'.
          Types of property 'cursor' are incompatible.
            Type 'string | undefined' is not assignable to type 'CursorValue | undefined'.
              Type 'string' is not assignable to type 'CursorValue | undefined'.

44       <View style={[styles.webLayout, { maxWidth: layout.maxContentWidth }]}>
                       ~~~~~~~~~~~~~~~~


components/layout/WebLayout.tsx:48:15 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: ViewProps): View', gave the following error.
    Type 'ViewStyle | TextStyle | ImageStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Type 'TextStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
        Type 'TextStyle' is not assignable to type 'ViewStyle'.
          Types of property 'cursor' are incompatible.
            Type 'string | undefined' is not assignable to type 'CursorValue | undefined'.
              Type 'string' is not assignable to type 'CursorValue | undefined'.
  Overload 2 of 2, '(props: ViewProps, context: any): View', gave the following error.
    Type 'ViewStyle | TextStyle | ImageStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Type 'TextStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
        Type 'TextStyle' is not assignable to type 'ViewStyle'.
          Types of property 'cursor' are incompatible.
            Type 'string | undefined' is not assignable to type 'CursorValue | undefined'.
              Type 'string' is not assignable to type 'CursorValue | undefined'.

48               styles.sidebar,
                 ~~~~~~~~~~~~~~


components/layout/WebLayout.tsx:56:15 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: ScrollViewProps): ScrollView', gave the following error.
    Type 'ViewStyle | TextStyle | ImageStyle' is not assignable to type 'StyleProp<ViewStyle>'.
      Type 'TextStyle' is not assignable to type 'StyleProp<ViewStyle>'.
        Type 'TextStyle' is not assignable to type 'ViewStyle'.
          Types of property 'cursor' are incompatible.
            Type 'string | undefined' is not assignable to type 'CursorValue | undefined'.
              Type 'string' is not assignable to type 'CursorValue | undefined'.
  Overload 2 of 2, '(props: ScrollViewProps, context: any): ScrollView', gave the following error.
    Type 'ViewStyle | TextStyle | ImageStyle' is not assignable to type 'StyleProp<ViewStyle>'.
      Type 'TextStyle' is not assignable to type 'StyleProp<ViewStyle>'.
        Type 'TextStyle' is not assignable to type 'ViewStyle'.
          Types of property 'cursor' are incompatible.
            Type 'string | undefined' is not assignable to type 'CursorValue | undefined'.
              Type 'string' is not assignable to type 'CursorValue | undefined'.

56               contentContainerStyle={styles.sidebarContent}
                 ~~~~~~~~~~~~~~~~~~~~~

  node_modules/react-native/Libraries/Components/ScrollView/ScrollView.d.ts:611:3
    611   contentContainerStyle?: StyleProp<ViewStyle> | undefined;
          ~~~~~~~~~~~~~~~~~~~~~
    The expected type comes from property 'contentContainerStyle' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<ScrollView> & Readonly<ScrollViewProps>'
  node_modules/react-native/Libraries/Components/ScrollView/ScrollView.d.ts:611:3
    611   contentContainerStyle?: StyleProp<ViewStyle> | undefined;
          ~~~~~~~~~~~~~~~~~~~~~
    The expected type comes from property 'contentContainerStyle' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<ScrollView> & Readonly<ScrollViewProps>'

components/layout/WebLayout.tsx:65:13 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: ViewProps): View', gave the following error.
    Type 'ViewStyle | TextStyle | ImageStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Type 'TextStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
        Type 'TextStyle' is not assignable to type 'ViewStyle'.
          Types of property 'cursor' are incompatible.
            Type 'string | undefined' is not assignable to type 'CursorValue | undefined'.
              Type 'string' is not assignable to type 'CursorValue | undefined'.
  Overload 2 of 2, '(props: ViewProps, context: any): View', gave the following error.
    Type 'ViewStyle | TextStyle | ImageStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Type 'TextStyle' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
        Type 'TextStyle' is not assignable to type 'ViewStyle'.
          Types of property 'cursor' are incompatible.
            Type 'string | undefined' is not assignable to type 'CursorValue | undefined'.
              Type 'string' is not assignable to type 'CursorValue | undefined'.

65             styles.mainContent,
               ~~~~~~~~~~~~~~~~~~


components/layout/WebLayout.tsx:92:3 - error TS2322: Type '{ position?: any; top?: number | undefined; height?: "100vh" | undefined; width: number; borderRightWidth: number; }' is not assignable to type 'ViewStyle | TextStyle | ImageStyle'.
  Type '{ position?: any; top?: number | undefined; height?: "100vh" | undefined; width: number; borderRightWidth: number; }' is not assignable to type 'ImageStyle'.
    Types of property 'height' are incompatible.
      Type '"100vh" | undefined' is not assignable to type 'DimensionValue | undefined'.
        Type '"100vh"' is not assignable to type 'DimensionValue | undefined'.

92   sidebar: {
     ~~~~~~~

  components/layout/WebLayout.tsx:92:3
     92   sidebar: {
          ~~~~~~~~~~
     93     width: 280,
        ~~~~~~~~~~~~~~~
    ...
    101     }),
        ~~~~~~~
    102   },
        ~~~
    The expected type comes from property 'sidebar' which is declared here on type 'NamedStyles<any> | (NamedStyles<{ container: { flex: number; alignItems: "center"; }; content: { flex: number; width: "100%"; alignSelf: "center"; }; webLayout: { flex: number; flexDirection: "row"; width: "100%"; alignSelf: "center"; }; sidebar: { ...; }; sidebarContent: { ...; }; mainContent: { ...; }; }> & NamedS...'

components/navigation/WebNavbar.tsx:70:11 - error TS2322: Type 'string' is not assignable to type 'SFSymbols6_0'.

70           name={item.icon}
             ~~~~

  components/ui/icon-symbol.tsx:88:3
    88   name: IconSymbolName;
         ~~~~
    The expected type comes from property 'name' which is declared here on type 'IntrinsicAttributes & { name: SFSymbols6_0; size?: number | undefined; color: string | OpaqueColorValue; style?: StyleProp<TextStyle>; weight?: SymbolWeight | undefined; }'

components/parallax-scroll-view.tsx:54:7 - error TS2322: Type '{ backgroundColor: string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly [...]; card: readonly [...]; } | { ...; } | { ...; }; flex: number; }' is not assignable to type 'StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>'.
  Types of property 'backgroundColor' are incompatible.
    Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'ColorValue | SharedValueDisableContravariance<string> | SharedValueDisableContravariance<OpaqueColorValue> | { ...; } | undefined'.
      Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'ColorValue | SharedValueDisableContravariance<string> | SharedValueDisableContravariance<OpaqueColorValue> | { ...; } | undefined'.

54       style={{ backgroundColor, flex: 1 }}
         ~~~~~

  node_modules/react-native/Libraries/Components/ScrollView/ScrollView.d.ts:758:3
    758   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & AnimatedScrollViewProps'

components/themed-text.tsx:32:9 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: TextProps): Text', gave the following error.
    Type '{ color: string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }; }' is not assignable to type 'TextStyle | Falsy | RegisteredStyle<TextStyle> | RecursiveArray<TextStyle | Falsy | RegisteredStyle<TextStyle>> | readonly (TextStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Types of property 'color' are incompatible.
        Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'ColorValue | undefined'.
          Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'ColorValue | undefined'.
  Overload 2 of 2, '(props: TextProps, context: any): Text', gave the following error.
    Type '{ color: string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }; }' is not assignable to type 'TextStyle | Falsy | RegisteredStyle<TextStyle> | RecursiveArray<TextStyle | Falsy | RegisteredStyle<TextStyle>> | readonly (TextStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Types of property 'color' are incompatible.
        Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'ColorValue | undefined'.
          Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'ColorValue | undefined'.

32         { color },
           ~~~~~~~~~


components/themed-view.tsx:21:24 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: ViewProps): View', gave the following error.
    Type '{ backgroundColor: string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly [...]; card: readonly [...]; } | { ...; } | { ...; }; }' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Types of property 'backgroundColor' are incompatible.
        Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'ColorValue | undefined'.
          Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'ColorValue | undefined'.
  Overload 2 of 2, '(props: ViewProps, context: any): View', gave the following error.
    Type '{ backgroundColor: string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly [...]; card: readonly [...]; } | { ...; } | { ...; }; }' is not assignable to type 'ViewStyle | Falsy | RegisteredStyle<ViewStyle> | RecursiveArray<ViewStyle | Falsy | RegisteredStyle<ViewStyle>> | readonly (ViewStyle | ... 1 more ... | RegisteredStyle<...>)[]'.
      Types of property 'backgroundColor' are incompatible.
        Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'ColorValue | undefined'.
          Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'ColorValue | undefined'.

21   return <View style={[{ backgroundColor }, style]} {...otherProps} />;
                          ~~~~~~~~~~~~~~~~~~~


components/ui/Button.tsx:50:24 - error TS2345: Argument of type '{ paddingHorizontal: number; paddingVertical: number; }' is not assignable to parameter of type '{ flexDirection: "row"; alignItems: "center"; justifyContent: "center"; borderRadius: number; gap: number; }'.
  Type '{ paddingHorizontal: number; paddingVertical: number; }' is missing the following properties from type '{ flexDirection: "row"; alignItems: "center"; justifyContent: "center"; borderRadius: number; gap: number; }': flexDirection, alignItems, justifyContent, borderRadius, gap

50         baseStyle.push(styles.buttonSmall);
                          ~~~~~~~~~~~~~~~~~~

components/ui/Button.tsx:53:24 - error TS2345: Argument of type '{ paddingHorizontal: number; paddingVertical: number; }' is not assignable to parameter of type '{ flexDirection: "row"; alignItems: "center"; justifyContent: "center"; borderRadius: number; gap: number; }'.
  Type '{ paddingHorizontal: number; paddingVertical: number; }' is missing the following properties from type '{ flexDirection: "row"; alignItems: "center"; justifyContent: "center"; borderRadius: number; gap: number; }': flexDirection, alignItems, justifyContent, borderRadius, gap

53         baseStyle.push(styles.buttonLarge);
                          ~~~~~~~~~~~~~~~~~~

components/ui/Button.tsx:56:24 - error TS2345: Argument of type '{ paddingHorizontal: number; paddingVertical: number; }' is not assignable to parameter of type '{ flexDirection: "row"; alignItems: "center"; justifyContent: "center"; borderRadius: number; gap: number; }'.
  Type '{ paddingHorizontal: number; paddingVertical: number; }' is missing the following properties from type '{ flexDirection: "row"; alignItems: "center"; justifyContent: "center"; borderRadius: number; gap: number; }': flexDirection, alignItems, justifyContent, borderRadius, gap

56         baseStyle.push(styles.buttonMedium);
                          ~~~~~~~~~~~~~~~~~~~

components/ui/Button.tsx:63:11 - error TS2353: Object literal may only specify known properties, and 'backgroundColor' does not exist in type '{ flexDirection: "row"; alignItems: "center"; justifyContent: "center"; borderRadius: number; gap: number; }'.

63           backgroundColor: colors.icon + "20",
             ~~~~~~~~~~~~~~~

components/ui/Button.tsx:70:11 - error TS2353: Object literal may only specify known properties, and 'backgroundColor' does not exist in type '{ flexDirection: "row"; alignItems: "center"; justifyContent: "center"; borderRadius: number; gap: number; }'.

70           backgroundColor: "transparent",
             ~~~~~~~~~~~~~~~

components/ui/Button.tsx:77:11 - error TS2353: Object literal may only specify known properties, and 'backgroundColor' does not exist in type '{ flexDirection: "row"; alignItems: "center"; justifyContent: "center"; borderRadius: number; gap: number; }'.

77           backgroundColor: "#ff4444",
             ~~~~~~~~~~~~~~~

components/ui/Button.tsx:82:11 - error TS2353: Object literal may only specify known properties, and 'backgroundColor' does not exist in type '{ flexDirection: "row"; alignItems: "center"; justifyContent: "center"; borderRadius: number; gap: number; }'.

82           backgroundColor: colors.tint,
             ~~~~~~~~~~~~~~~

components/ui/Button.tsx:88:22 - error TS2345: Argument of type '{ width: "100%"; }' is not assignable to parameter of type '{ flexDirection: "row"; alignItems: "center"; justifyContent: "center"; borderRadius: number; gap: number; }'.
  Type '{ width: "100%"; }' is missing the following properties from type '{ flexDirection: "row"; alignItems: "center"; justifyContent: "center"; borderRadius: number; gap: number; }': flexDirection, alignItems, justifyContent, borderRadius, gap

88       baseStyle.push(styles.fullWidth);
                        ~~~~~~~~~~~~~~~~

components/ui/Button.tsx:93:22 - error TS2345: Argument of type '{ opacity: number; }' is not assignable to parameter of type '{ flexDirection: "row"; alignItems: "center"; justifyContent: "center"; borderRadius: number; gap: number; }'.
  Type '{ opacity: number; }' is missing the following properties from type '{ flexDirection: "row"; alignItems: "center"; justifyContent: "center"; borderRadius: number; gap: number; }': flexDirection, alignItems, justifyContent, borderRadius, gap

93       baseStyle.push(styles.disabled);
                        ~~~~~~~~~~~~~~~

components/ui/Button.tsx:98:22 - error TS2345: Argument of type 'ViewStyle' is not assignable to parameter of type '{ flexDirection: "row"; alignItems: "center"; justifyContent: "center"; borderRadius: number; gap: number; }'.
  Types of property 'flexDirection' are incompatible.
    Type '"row" | "column" | "row-reverse" | "column-reverse" | undefined' is not assignable to type '"row"'.
      Type 'undefined' is not assignable to type '"row"'.

98       baseStyle.push(style);
                        ~~~~~

components/ui/Button.tsx:110:24 - error TS2345: Argument of type '{ fontSize: number; }' is not assignable to parameter of type '{ fontWeight: "600"; textAlign: "center"; }'.
  Type '{ fontSize: number; }' is missing the following properties from type '{ fontWeight: "600"; textAlign: "center"; }': fontWeight, textAlign

110         baseStyle.push(styles.textSmall);
                           ~~~~~~~~~~~~~~~~

components/ui/Button.tsx:113:24 - error TS2345: Argument of type '{ fontSize: number; }' is not assignable to parameter of type '{ fontWeight: "600"; textAlign: "center"; }'.
  Type '{ fontSize: number; }' is missing the following properties from type '{ fontWeight: "600"; textAlign: "center"; }': fontWeight, textAlign

113         baseStyle.push(styles.textLarge);
                           ~~~~~~~~~~~~~~~~

components/ui/Button.tsx:116:24 - error TS2345: Argument of type '{ fontSize: number; }' is not assignable to parameter of type '{ fontWeight: "600"; textAlign: "center"; }'.
  Type '{ fontSize: number; }' is missing the following properties from type '{ fontWeight: "600"; textAlign: "center"; }': fontWeight, textAlign

116         baseStyle.push(styles.textMedium);
                           ~~~~~~~~~~~~~~~~~

components/ui/Button.tsx:122:26 - error TS2353: Object literal may only specify known properties, and 'color' does not exist in type '{ fontWeight: "600"; textAlign: "center"; }'.

122         baseStyle.push({ color: colors.text });
                             ~~~~~

components/ui/Button.tsx:125:26 - error TS2353: Object literal may only specify known properties, and 'color' does not exist in type '{ fontWeight: "600"; textAlign: "center"; }'.

125         baseStyle.push({ color: colors.tint });
                             ~~~~~

components/ui/Button.tsx:128:26 - error TS2353: Object literal may only specify known properties, and 'color' does not exist in type '{ fontWeight: "600"; textAlign: "center"; }'.

128         baseStyle.push({ color: "white" });
                             ~~~~~

components/ui/Button.tsx:132:26 - error TS2353: Object literal may only specify known properties, and 'color' does not exist in type '{ fontWeight: "600"; textAlign: "center"; }'.

132         baseStyle.push({ color: "white" });
                             ~~~~~

components/ui/Button.tsx:137:22 - error TS2345: Argument of type 'TextStyle' is not assignable to parameter of type '{ fontWeight: "600"; textAlign: "center"; }'.
  Types of property 'fontWeight' are incompatible.
    Type '"300" | "400" | "500" | "600" | "700" | "light" | "bold" | "normal" | 100 | 200 | "100" | "200" | "800" | "900" | 300 | 400 | 500 | 600 | 700 | 800 | 900 | "ultralight" | "thin" | "medium" | ... 6 more ... | undefined' is not assignable to type '"600"'.
      Type 'undefined' is not assignable to type '"600"'.

137       baseStyle.push(textStyle);
                         ~~~~~~~~~

components/ui/Button.tsx:183:19 - error TS2322: Type 'string' is not assignable to type 'SFSymbols6_0'.

183       <IconSymbol name={icon} size={getIconSize()} color={getIconColor()} />
                      ~~~~

  components/ui/icon-symbol.tsx:88:3
    88   name: IconSymbolName;
         ~~~~
    The expected type comes from property 'name' which is declared here on type 'IntrinsicAttributes & { name: SFSymbols6_0; size?: number | undefined; color: string | OpaqueColorValue; style?: StyleProp<TextStyle>; weight?: SymbolWeight | undefined; }'

components/ui/Card.tsx:21:11 - error TS2320: Interface 'TouchableCardProps' cannot simultaneously extend types 'CardProps' and 'Omit<TouchableOpacityProps, "children" | "style">'.
  Named property 'onPress' of types 'CardProps' and 'Omit<TouchableOpacityProps, "children" | "style">' are not identical.

21 interface TouchableCardProps
             ~~~~~~~~~~~~~~~~~~

components/ui/Card.tsx:43:11 - error TS2353: Object literal may only specify known properties, and 'backgroundColor' does not exist in type '{ borderRadius: number; overflow: "hidden"; }'.

43           backgroundColor: colors.background,
             ~~~~~~~~~~~~~~~

components/ui/Card.tsx:54:11 - error TS2353: Object literal may only specify known properties, and 'backgroundColor' does not exist in type '{ borderRadius: number; overflow: "hidden"; }'.

54           backgroundColor: colors.background,
             ~~~~~~~~~~~~~~~

components/ui/Card.tsx:61:11 - error TS2353: Object literal may only specify known properties, and 'backgroundColor' does not exist in type '{ borderRadius: number; overflow: "hidden"; }'.

61           backgroundColor: colors.icon + "05",
             ~~~~~~~~~~~~~~~

components/ui/Card.tsx:68:11 - error TS2353: Object literal may only specify known properties, and 'backgroundColor' does not exist in type '{ borderRadius: number; overflow: "hidden"; }'.

68           backgroundColor: colors.background,
             ~~~~~~~~~~~~~~~

components/ui/Card.tsx:79:24 - error TS2345: Argument of type '{ padding: number; }' is not assignable to parameter of type '{ borderRadius: number; overflow: "hidden"; }'.
  Type '{ padding: number; }' is missing the following properties from type '{ borderRadius: number; overflow: "hidden"; }': borderRadius, overflow

79         baseStyle.push(styles.paddingSmall);
                          ~~~~~~~~~~~~~~~~~~~

components/ui/Card.tsx:82:24 - error TS2345: Argument of type '{ padding: number; }' is not assignable to parameter of type '{ borderRadius: number; overflow: "hidden"; }'.
  Type '{ padding: number; }' is missing the following properties from type '{ borderRadius: number; overflow: "hidden"; }': borderRadius, overflow

82         baseStyle.push(styles.paddingLarge);
                          ~~~~~~~~~~~~~~~~~~~

components/ui/Card.tsx:85:24 - error TS2345: Argument of type '{ padding: number; }' is not assignable to parameter of type '{ borderRadius: number; overflow: "hidden"; }'.
  Type '{ padding: number; }' is missing the following properties from type '{ borderRadius: number; overflow: "hidden"; }': borderRadius, overflow

85         baseStyle.push(styles.paddingMedium);
                          ~~~~~~~~~~~~~~~~~~~~

components/ui/Card.tsx:90:22 - error TS2345: Argument of type '{ opacity: number; }' is not assignable to parameter of type '{ borderRadius: number; overflow: "hidden"; }'.
  Type '{ opacity: number; }' is missing the following properties from type '{ borderRadius: number; overflow: "hidden"; }': borderRadius, overflow

90       baseStyle.push(styles.disabled);
                        ~~~~~~~~~~~~~~~

components/ui/Card.tsx:95:22 - error TS2345: Argument of type 'ViewStyle' is not assignable to parameter of type '{ borderRadius: number; overflow: "hidden"; }'.
  Types of property 'borderRadius' are incompatible.
    Type 'string | AnimatableNumericValue | undefined' is not assignable to type 'number'.
      Type 'undefined' is not assignable to type 'number'.

95       baseStyle.push(style);
                        ~~~~~

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

components/ui/Input.tsx:74:24 - error TS2345: Argument of type 'ViewStyle' is not assignable to parameter of type '{ marginBottom: number; }'.
  Types of property 'marginBottom' are incompatible.
    Type 'DimensionValue | undefined' is not assignable to type 'number'.
      Type 'undefined' is not assignable to type 'number'.

74         baseStyle.push(containerStyle);
                          ~~~~~~~~~~~~~~

components/ui/Input.tsx:86:26 - error TS2345: Argument of type '{ minHeight: number; paddingHorizontal: number; }' is not assignable to parameter of type '{ flexDirection: "row"; alignItems: "center"; borderRadius: number; overflow: "hidden"; }'.
  Type '{ minHeight: number; paddingHorizontal: number; }' is missing the following properties from type '{ flexDirection: "row"; alignItems: "center"; borderRadius: number; overflow: "hidden"; }': flexDirection, alignItems, borderRadius, overflow

86           baseStyle.push(styles.inputContainerSmall);
                            ~~~~~~~~~~~~~~~~~~~~~~~~~~

components/ui/Input.tsx:89:26 - error TS2345: Argument of type '{ minHeight: number; paddingHorizontal: number; }' is not assignable to parameter of type '{ flexDirection: "row"; alignItems: "center"; borderRadius: number; overflow: "hidden"; }'.
  Type '{ minHeight: number; paddingHorizontal: number; }' is missing the following properties from type '{ flexDirection: "row"; alignItems: "center"; borderRadius: number; overflow: "hidden"; }': flexDirection, alignItems, borderRadius, overflow

89           baseStyle.push(styles.inputContainerLarge);
                            ~~~~~~~~~~~~~~~~~~~~~~~~~~

components/ui/Input.tsx:92:26 - error TS2345: Argument of type '{ minHeight: number; paddingHorizontal: number; }' is not assignable to parameter of type '{ flexDirection: "row"; alignItems: "center"; borderRadius: number; overflow: "hidden"; }'.
  Type '{ minHeight: number; paddingHorizontal: number; }' is missing the following properties from type '{ flexDirection: "row"; alignItems: "center"; borderRadius: number; overflow: "hidden"; }': flexDirection, alignItems, borderRadius, overflow

92           baseStyle.push(styles.inputContainerMedium);
                            ~~~~~~~~~~~~~~~~~~~~~~~~~~~

components/ui/Input.tsx:99:13 - error TS2353: Object literal may only specify known properties, and 'backgroundColor' does not exist in type '{ flexDirection: "row"; alignItems: "center"; borderRadius: number; overflow: "hidden"; }'.

99             backgroundColor: "transparent",
               ~~~~~~~~~~~~~~~

components/ui/Input.tsx:106:13 - error TS2353: Object literal may only specify known properties, and 'backgroundColor' does not exist in type '{ flexDirection: "row"; alignItems: "center"; borderRadius: number; overflow: "hidden"; }'.

106             backgroundColor: colors.icon + "10",
                ~~~~~~~~~~~~~~~

components/ui/Input.tsx:113:13 - error TS2353: Object literal may only specify known properties, and 'backgroundColor' does not exist in type '{ flexDirection: "row"; alignItems: "center"; borderRadius: number; overflow: "hidden"; }'.

113             backgroundColor: colors.background,
                ~~~~~~~~~~~~~~~

components/ui/Input.tsx:121:26 - error TS2353: Object literal may only specify known properties, and 'borderColor' does not exist in type '{ flexDirection: "row"; alignItems: "center"; borderRadius: number; overflow: "hidden"; }'.

121         baseStyle.push({ borderColor: "#ff4444" });
                             ~~~~~~~~~~~

components/ui/Input.tsx:123:26 - error TS2353: Object literal may only specify known properties, and 'borderColor' does not exist in type '{ flexDirection: "row"; alignItems: "center"; borderRadius: number; overflow: "hidden"; }'.

123         baseStyle.push({ borderColor: "#4CAF50" });
                             ~~~~~~~~~~~

components/ui/Input.tsx:127:24 - error TS2345: Argument of type '{ opacity: number; }' is not assignable to parameter of type '{ flexDirection: "row"; alignItems: "center"; borderRadius: number; overflow: "hidden"; }'.
  Type '{ opacity: number; }' is missing the following properties from type '{ flexDirection: "row"; alignItems: "center"; borderRadius: number; overflow: "hidden"; }': flexDirection, alignItems, borderRadius, overflow

127         baseStyle.push(styles.disabled);
                           ~~~~~~~~~~~~~~~

components/ui/Input.tsx:131:24 - error TS2345: Argument of type '{ minHeight: number; paddingVertical: number; alignItems: "flex-start"; }' is not assignable to parameter of type '{ flexDirection: "row"; alignItems: "center"; borderRadius: number; overflow: "hidden"; }'.
  Type '{ minHeight: number; paddingVertical: number; alignItems: "flex-start"; }' is missing the following properties from type '{ flexDirection: "row"; alignItems: "center"; borderRadius: number; overflow: "hidden"; }': flexDirection, borderRadius, overflow

131         baseStyle.push(styles.multiline);
                           ~~~~~~~~~~~~~~~~

components/ui/Input.tsx:143:26 - error TS2345: Argument of type '{ fontSize: number; }' is not assignable to parameter of type '{ flex: number; fontSize: number; paddingVertical: number; } | { color: string; }'.
  Type '{ fontSize: number; }' is missing the following properties from type '{ flex: number; fontSize: number; paddingVertical: number; }': flex, paddingVertical

143           baseStyle.push(styles.inputSmall);
                             ~~~~~~~~~~~~~~~~~

components/ui/Input.tsx:146:26 - error TS2345: Argument of type '{ fontSize: number; }' is not assignable to parameter of type '{ flex: number; fontSize: number; paddingVertical: number; } | { color: string; }'.
  Type '{ fontSize: number; }' is missing the following properties from type '{ flex: number; fontSize: number; paddingVertical: number; }': flex, paddingVertical

146           baseStyle.push(styles.inputLarge);
                             ~~~~~~~~~~~~~~~~~

components/ui/Input.tsx:149:26 - error TS2345: Argument of type '{ fontSize: number; }' is not assignable to parameter of type '{ flex: number; fontSize: number; paddingVertical: number; } | { color: string; }'.
  Type '{ fontSize: number; }' is missing the following properties from type '{ flex: number; fontSize: number; paddingVertical: number; }': flex, paddingVertical

149           baseStyle.push(styles.inputMedium);
                             ~~~~~~~~~~~~~~~~~~

components/ui/Input.tsx:153:24 - error TS2345: Argument of type '{ marginLeft: number; }' is not assignable to parameter of type '{ flex: number; fontSize: number; paddingVertical: number; } | { color: string; }'.

153         baseStyle.push(styles.inputWithLeftIcon);
                           ~~~~~~~~~~~~~~~~~~~~~~~~

components/ui/Input.tsx:157:24 - error TS2345: Argument of type '{ marginRight: number; }' is not assignable to parameter of type '{ flex: number; fontSize: number; paddingVertical: number; } | { color: string; }'.

157         baseStyle.push(styles.inputWithRightIcon);
                           ~~~~~~~~~~~~~~~~~~~~~~~~~

components/ui/Input.tsx:161:24 - error TS2345: Argument of type '{ textAlignVertical: "top"; paddingTop: number; }' is not assignable to parameter of type '{ flex: number; fontSize: number; paddingVertical: number; } | { color: string; }'.

161         baseStyle.push(styles.inputMultiline);
                           ~~~~~~~~~~~~~~~~~~~~~

components/ui/Input.tsx:165:24 - error TS2345: Argument of type 'TextStyle' is not assignable to parameter of type '{ flex: number; fontSize: number; paddingVertical: number; } | { color: string; }'.
  Type 'TextStyle' is not assignable to type '{ flex: number; fontSize: number; paddingVertical: number; }'.
    Types of property 'flex' are incompatible.
      Type 'number | undefined' is not assignable to type 'number'.
        Type 'undefined' is not assignable to type 'number'.

165         baseStyle.push(inputStyle);
                           ~~~~~~~~~~

components/ui/Input.tsx:175:24 - error TS2345: Argument of type '{}' is not assignable to parameter of type '{ fontSize: number; fontWeight: "500"; marginBottom: number; } | { color: string; }'.

175         baseStyle.push(styles.requiredLabel);
                           ~~~~~~~~~~~~~~~~~~~~

components/ui/Input.tsx:179:24 - error TS2345: Argument of type 'TextStyle' is not assignable to parameter of type '{ fontSize: number; fontWeight: "500"; marginBottom: number; } | { color: string; }'.
  Type 'TextStyle' is not assignable to type '{ fontSize: number; fontWeight: "500"; marginBottom: number; }'.
    Types of property 'fontSize' are incompatible.
      Type 'number | undefined' is not assignable to type 'number'.
        Type 'undefined' is not assignable to type 'number'.

179         baseStyle.push(labelStyle);
                           ~~~~~~~~~~

components/ui/Input.tsx:229:17 - error TS2322: Type 'string' is not assignable to type 'SFSymbols6_0'.

229                 name={leftIcon}
                    ~~~~

  components/ui/icon-symbol.tsx:88:3
    88   name: IconSymbolName;
         ~~~~
    The expected type comes from property 'name' which is declared here on type 'IntrinsicAttributes & { name: SFSymbols6_0; size?: number | undefined; color: string | OpaqueColorValue; style?: StyleProp<TextStyle>; weight?: SymbolWeight | undefined; }'

components/ui/Input.tsx:258:17 - error TS2322: Type 'string' is not assignable to type 'SFSymbols6_0'.

258                 name={rightIcon}
                    ~~~~

  components/ui/icon-symbol.tsx:88:3
    88   name: IconSymbolName;
         ~~~~
    The expected type comes from property 'name' which is declared here on type 'IntrinsicAttributes & { name: SFSymbols6_0; size?: number | undefined; color: string | OpaqueColorValue; style?: StyleProp<TextStyle>; weight?: SymbolWeight | undefined; }'

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

components/ui/NotificationList.tsx:81:7 - error TS2322: Type '{ backgroundColor: string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly [...]; card: readonly [...]; } | { ...; } | { ...; }; }' is not assignable to type 'StyleProp<ViewStyle>'.
  Types of property 'backgroundColor' are incompatible.
    Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'ColorValue | undefined'.
      Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'ColorValue | undefined'.

81       style={{ backgroundColor: cardBackground }}
         ~~~~~

  node_modules/react-native/Libraries/Components/Touchable/TouchableWithoutFeedback.d.ts:122:3
    122   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'

components/ui/NotificationList.tsx:89:15 - error TS2322: Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'string | OpaqueColorValue | undefined'.
  Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'string | OpaqueColorValue | undefined'.

89               color={getIconColor()}
                 ~~~~~

  node_modules/@expo/vector-icons/build/createIconSet.d.ts:23:5
    23     color?: string | OpaqueColorValue;
           ~~~~~
    The expected type comes from property 'color' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Component<IconProps<"search" | "repeat" | "link" | "at" | "body" | "code" | "map" | "menu" | "time" | "ellipse" | "filter" | "image" | "stop" | ... 1343 more ... | "woman-sharp">, {}, any>> & Pick<...> & InexactPartial<...> & InexactPartial<...>'

components/ui/NotificationList.tsx:97:17 - error TS2769: No overload matches this call.
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

97                 style={{ color: textColor }}
                   ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/ui/NotificationList.tsx:108:15 - error TS2769: No overload matches this call.
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

108               style={{ color: textColor }}
                  ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/ui/NotificationList.tsx:114:41 - error TS2769: No overload matches this call.
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

114               <Text className="text-xs" style={{ color: mutedTextColor }}>
                                            ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/ui/NotificationList.tsx:126:19 - error TS2322: Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'string | OpaqueColorValue | undefined'.
  Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'string | OpaqueColorValue | undefined'.

126                   color={mutedTextColor}
                      ~~~~~

  node_modules/@expo/vector-icons/build/createIconSet.d.ts:23:5
    23     color?: string | OpaqueColorValue;
           ~~~~~
    The expected type comes from property 'color' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Component<IconProps<"search" | "repeat" | "link" | "at" | "body" | "code" | "map" | "menu" | "time" | "ellipse" | "filter" | "image" | "stop" | ... 1343 more ... | "woman-sharp">, {}, any>> & Pick<...> & InexactPartial<...> & InexactPartial<...>'

components/ui/NotificationList.tsx:171:15 - error TS2769: No overload matches this call.
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

171         <Text style={{ color: mutedTextColor }}>Loading notifications...</Text>
                  ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/ui/NotificationList.tsx:182:11 - error TS2322: Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'string | OpaqueColorValue | undefined'.
  Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'string | OpaqueColorValue | undefined'.

182           color={mutedTextColor}
              ~~~~~

  node_modules/@expo/vector-icons/build/createIconSet.d.ts:23:5
    23     color?: string | OpaqueColorValue;
           ~~~~~
    The expected type comes from property 'color' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Component<IconProps<"search" | "repeat" | "link" | "at" | "body" | "code" | "map" | "menu" | "time" | "ellipse" | "filter" | "image" | "stop" | ... 1343 more ... | "woman-sharp">, {}, any>> & Pick<...> & InexactPartial<...> & InexactPartial<...>'

components/ui/NotificationList.tsx:186:11 - error TS2769: No overload matches this call.
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

186           style={{ color: textColor }}
              ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/ui/NotificationList.tsx:190:39 - error TS2769: No overload matches this call.
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

190         <Text className="text-center" style={{ color: mutedTextColor }}>
                                          ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/ui/NotificationList.tsx:199:30 - error TS2769: No overload matches this call.
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

199     <View className="flex-1" style={{ backgroundColor }}>
                                 ~~~~~

  node_modules/react-native/Libraries/Components/View/ViewPropTypes.d.ts:212:3
    212   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<View> & Readonly<ViewProps>'
  node_modules/react-native/Libraries/Components/View/ViewPropTypes.d.ts:212:3
    212   style?: StyleProp<ViewStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<View> & Readonly<ViewProps>'

components/ui/NotificationList.tsx:202:49 - error TS2769: No overload matches this call.
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

202         <Text className="text-lg font-semibold" style={{ color: textColor }}>
                                                    ~~~~~

  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'
  node_modules/react-native/Libraries/Text/Text.d.ts:185:3
    185   style?: StyleProp<TextStyle> | undefined;
          ~~~~~
    The expected type comes from property 'style' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Text> & Readonly<TextProps>'

components/ui/NotificationList.tsx:221:54 - error TS2322: Type 'string | { primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; } | { primary: readonly ["#948979", "#DFD0B8"]; secondary: readonly ["#DFD0B8", "#F5F0E8"]; card: readonly [...]; } | { ...; } | { ...; }' is not assignable to type 'string | OpaqueColorValue | undefined'.
  Type '{ primary: string; secondary: string; tertiary: string; fuel: string; service: string; mileage: string; grid: string; }' is not assignable to type 'string | OpaqueColorValue | undefined'.

221             <Ionicons name="trash-outline" size={20} color={mutedTextColor} />
                                                         ~~~~~

  node_modules/@expo/vector-icons/build/createIconSet.d.ts:23:5
    23     color?: string | OpaqueColorValue;
           ~~~~~
    The expected type comes from property 'color' which is declared here on type 'IntrinsicAttributes & IntrinsicClassAttributes<Component<IconProps<"search" | "repeat" | "link" | "at" | "body" | "code" | "map" | "menu" | "time" | "ellipse" | "filter" | "image" | "stop" | ... 1343 more ... | "woman-sharp">, {}, any>> & Pick<...> & InexactPartial<...> & InexactPartial<...>'

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

components/VehicleDetail.tsx:453:32 - error TS2339: Property 'group_image_url' does not exist on type '{ id: string; name: string; description: string | null; owner_id: string; created_at: string; updated_at: string; }'.

453                         {group.group_image_url ? (
                                   ~~~~~~~~~~~~~~~

components/VehicleDetail.tsx:455:50 - error TS2339: Property 'group_image_url' does not exist on type '{ id: string; name: string; description: string | null; owner_id: string; created_at: string; updated_at: string; }'.

455                             source={{ uri: group.group_image_url }}
                                                     ~~~~~~~~~~~~~~~

components/VehicleDetail.tsx:496:17 - error TS2322: Type '{ children: Element[]; style: (false | { shadowColor?: string | undefined; shadowOffset?: { width: number; height: number; } | undefined; shadowOpacity?: number | undefined; shadowRadius?: number | undefined; ... 10 more ...; borderColor: string; } | { ...; })[]; onMouseEnter: (() => void) | undefined; onMouseLeave:...' is not assignable to type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'.
  Property 'onMouseEnter' does not exist on type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'.

496                 onMouseEnter={
                    ~~~~~~~~~~~~

components/VehicleDetail.tsx:530:17 - error TS2322: Type '{ children: Element[]; style: (false | { shadowColor?: string | undefined; shadowOffset?: { width: number; height: number; } | undefined; shadowOpacity?: number | undefined; shadowRadius?: number | undefined; ... 10 more ...; borderColor: string; } | { ...; })[]; onMouseEnter: (() => void) | undefined; onMouseLeave:...' is not assignable to type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'.
  Property 'onMouseEnter' does not exist on type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'.

530                 onMouseEnter={isWeb ? () => setHoveredItem("fuel") : undefined}
                    ~~~~~~~~~~~~

components/VehicleDetail.tsx:572:17 - error TS2322: Type '{ children: Element[]; style: (false | { shadowColor?: string | undefined; shadowOffset?: { width: number; height: number; } | undefined; shadowOpacity?: number | undefined; shadowRadius?: number | undefined; ... 10 more ...; borderColor: string; } | { ...; })[]; onMouseEnter: (() => void) | undefined; onMouseLeave:...' is not assignable to type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'.
  Property 'onMouseEnter' does not exist on type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'.

572                 onMouseEnter={
                    ~~~~~~~~~~~~

components/VehicleDetail.tsx:616:17 - error TS2322: Type '{ children: Element[]; style: (false | { shadowColor?: string | undefined; shadowOffset?: { width: number; height: number; } | undefined; shadowOpacity?: number | undefined; shadowRadius?: number | undefined; ... 10 more ...; borderColor: string; } | { ...; })[]; onMouseEnter: (() => void) | undefined; onMouseLeave:...' is not assignable to type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'.
  Property 'onMouseEnter' does not exist on type 'IntrinsicAttributes & TouchableOpacityProps & RefAttributes<View>'.

616                 onMouseEnter={
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

lib/services/groupService.ts:56:11 - error TS7034: Variable 'memberGroups' implicitly has type 'any[]' in some locations where its type cannot be determined.

56       let memberGroups = [];
             ~~~~~~~~~~~~

lib/services/groupService.ts:58:60 - error TS2339: Property 'group_id' does not exist on type 'never'.

58         const memberGroupIds = membershipData.map((m) => m.group_id);
                                                              ~~~~~~~~

lib/services/groupService.ts:95:7 - error TS7005: Variable 'memberGroups' implicitly has an 'any[]' type.

95       memberGroups.forEach((group) => {
         ~~~~~~~~~~~~

lib/services/groupService.ts:96:38 - error TS2339: Property 'id' does not exist on type 'never'.

96         if (!allGroups.find((g) => g.id === group.id)) {
                                        ~~

lib/services/groupService.ts:97:26 - error TS2345: Argument of type 'any' is not assignable to parameter of type 'never'.

97           allGroups.push(group);
                            ~~~~~

lib/services/groupService.ts:104:22 - error TS2339: Property 'created_at' does not exist on type 'never'.

104           new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                         ~~~~~~~~~~

lib/services/groupService.ts:104:57 - error TS2339: Property 'created_at' does not exist on type 'never'.

104           new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                                                            ~~~~~~~~~~

lib/services/groupService.ts:109:9 - error TS2698: Spread types may only be created from object types.

109         ...group,
            ~~~~~~~~

lib/services/groupService.ts:110:29 - error TS2339: Property 'group_members' does not exist on type 'never'.

110         member_count: group.group_members?.length || 0,
                                ~~~~~~~~~~~~~

lib/services/groupService.ts:116:50 - error TS2339: Property 'id' does not exist on type 'never'.

116         ownedGroupIds: ownedGroups?.map((g) => g.id) || [],
                                                     ~~

lib/services/groupService.ts:118:54 - error TS2339: Property 'group_id' does not exist on type 'never'.

118         memberGroupIds: membershipData?.map((m) => m.group_id) || [],
                                                         ~~~~~~~~

lib/services/groupService.ts:120:27 - error TS7005: Variable 'memberGroups' implicitly has an 'any[]' type.

120         memberGroupNames: memberGroups?.map((g) => g.name) || [],
                              ~~~~~~~~~~~~

lib/services/groupService.ts:161:11 - error TS7034: Variable 'membersWithProfiles' implicitly has type 'any[]' in some locations where its type cannot be determined.

161       let membersWithProfiles = [];
              ~~~~~~~~~~~~~~~~~~~

lib/services/groupService.ts:163:52 - error TS2339: Property 'user_id' does not exist on type 'never'.

163         const memberUserIds = members.map((m) => m.user_id);
                                                       ~~~~~~~

lib/services/groupService.ts:174:13 - error TS2698: Spread types may only be created from object types.

174             ...member,
                ~~~~~~~~~

lib/services/groupService.ts:175:47 - error TS2339: Property 'id' does not exist on type 'never'.

175             profiles: profiles?.find((p) => p.id === member.user_id) || null,
                                                  ~~

lib/services/groupService.ts:175:61 - error TS2339: Property 'user_id' does not exist on type 'never'.

175             profiles: profiles?.find((p) => p.id === member.user_id) || null,
                                                                ~~~~~~~

lib/services/groupService.ts:181:24 - error TS2339: Property 'id' does not exist on type 'never'.

181         groupId: group.id,
                           ~~

lib/services/groupService.ts:182:26 - error TS2339: Property 'name' does not exist on type 'never'.

182         groupName: group.name,
                             ~~~~

lib/services/groupService.ts:184:24 - error TS7005: Variable 'membersWithProfiles' implicitly has an 'any[]' type.

184         memberDetails: membersWithProfiles.map((m) => ({
                           ~~~~~~~~~~~~~~~~~~~

lib/services/groupService.ts:192:9 - error TS2698: Spread types may only be created from object types.

192         ...group,
            ~~~~~~~~

lib/services/groupService.ts:193:24 - error TS7005: Variable 'membersWithProfiles' implicitly has an 'any[]' type.

193         group_members: membersWithProfiles,
                           ~~~~~~~~~~~~~~~~~~~

lib/services/groupService.ts:219:10 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "groups", never, "POST">', gave the following error.
    Argument of type '{ owner_id: string; id?: string | undefined; description?: string | null | undefined; name: string; }' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "groups", never, "POST">', gave the following error.
    Object literal may only specify known properties, and 'owner_id' does not exist in type 'never[]'.

219         .insert({
             ~~~~~~


lib/services/groupService.ts:232:44 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "group_members", never, "POST">', gave the following error.
    Argument of type '{ group_id: any; user_id: string; }' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "group_members", never, "POST">', gave the following error.
    Object literal may only specify known properties, and 'group_id' does not exist in type 'never[]'.

232       await supabase.from("group_members").insert({
                                               ~~~~~~


lib/services/groupService.ts:233:24 - error TS2339: Property 'id' does not exist on type 'never'.

233         group_id: data.id,
                           ~~

lib/services/groupService.ts:251:17 - error TS2345: Argument of type '{ updated_at: string; name?: string; description?: string | null; }' is not assignable to parameter of type 'never'.

251         .update({
                    ~
252           ...updates,
    ~~~~~~~~~~~~~~~~~~~~~
253           updated_at: new Date().toISOString(),
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
254         })
    ~~~~~~~~~

lib/services/groupService.ts:309:17 - error TS2339: Property 'owner_id' does not exist on type 'never'.

309       if (group.owner_id === user.id) {
                    ~~~~~~~~

lib/services/groupService.ts:387:29 - error TS2339: Property 'owner_id' does not exist on type 'never'.

387       const isOwner = group.owner_id === user.id;
                                ~~~~~~~~

lib/services/groupService.ts:450:10 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "group_invitations", never, "POST">', gave the following error.
    Argument of type '{ group_id: string; email: string; invited_by: string; expires_at: string; }' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "group_invitations", never, "POST">', gave the following error.
    Object literal may only specify known properties, and 'group_id' does not exist in type 'never[]'.

450         .insert({
             ~~~~~~


lib/services/groupService.ts:512:19 - error TS2339: Property 'id' does not exist on type 'never'.

512           id: inv.id,
                      ~~

lib/services/groupService.ts:513:22 - error TS2339: Property 'email' does not exist on type 'never'.

513           email: inv.email,
                         ~~~~~

lib/services/groupService.ts:514:23 - error TS2339: Property 'status' does not exist on type 'never'.

514           status: inv.status,
                          ~~~~~~

lib/services/groupService.ts:515:24 - error TS2339: Property 'group_id' does not exist on type 'never'.

515           groupId: inv.group_id,
                           ~~~~~~~~

lib/services/groupService.ts:516:26 - error TS2339: Property 'groups' does not exist on type 'never'.

516           groupName: inv.groups?.name,
                             ~~~~~~

lib/services/groupService.ts:517:26 - error TS2339: Property 'profiles' does not exist on type 'never'.

517           invitedBy: inv.profiles?.full_name || inv.profiles?.email,
                             ~~~~~~~~

lib/services/groupService.ts:517:53 - error TS2339: Property 'profiles' does not exist on type 'never'.

517           invitedBy: inv.profiles?.full_name || inv.profiles?.email,
                                                        ~~~~~~~~

lib/services/groupService.ts:552:38 - error TS2339: Property 'email' does not exist on type 'never'.

552       const userEmail = userProfile?.email || user.email;
                                         ~~~~~

lib/services/groupService.ts:561:9 - error TS2345: Argument of type '{ user_email: any; }' is not assignable to parameter of type 'undefined'.

561         { user_email: userEmail?.toLowerCase() },
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

lib/services/groupService.ts:569:45 - error TS2339: Property 'length' does not exist on type 'never'.

569       if (!invitationData || invitationData.length === 0) {
                                                ~~~~~~

lib/services/groupService.ts:574:47 - error TS2339: Property 'filter' does not exist on type 'never'.

574       const validInvitations = invitationData.filter(
                                                  ~~~~~~

lib/services/groupService.ts:575:10 - error TS7006: Parameter 'inv' implicitly has an 'any' type.

575         (inv) =>
             ~~~

lib/services/groupService.ts:581:31 - error TS7006: Parameter 'inv' implicitly has an 'any' type.

581         validInvitations.map((inv) => ({
                                  ~~~

lib/services/groupService.ts:667:38 - error TS2339: Property 'email' does not exist on type 'never'.

667       const userEmail = userProfile?.email || user.email;
                                         ~~~~~

lib/services/groupService.ts:692:31 - error TS2339: Property 'expires_at' does not exist on type 'never'.

692       if (new Date(invitation.expires_at) < new Date()) {
                                  ~~~~~~~~~~

lib/services/groupService.ts:695:19 - error TS2345: Argument of type '{ status: string; }' is not assignable to parameter of type 'never'.

695           .update({ status: "expired" })
                      ~~~~~~~~~~~~~~~~~~~~~

lib/services/groupService.ts:708:10 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "group_members", never, "POST">', gave the following error.
    Argument of type '{ group_id: any; user_id: string; }' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "group_members", never, "POST">', gave the following error.
    Object literal may only specify known properties, and 'group_id' does not exist in type 'never[]'.

708         .insert({
             ~~~~~~


lib/services/groupService.ts:709:32 - error TS2339: Property 'group_id' does not exist on type 'never'.

709           group_id: invitation.group_id,
                                   ~~~~~~~~

lib/services/groupService.ts:721:17 - error TS2345: Argument of type '{ status: string; }' is not assignable to parameter of type 'never'.

721         .update({ status: "accepted" })
                    ~~~~~~~~~~~~~~~~~~~~~~

lib/services/groupService.ts:744:89 - error TS2339: Property 'groups' does not exist on type 'never'.

744         `Successfully accepted invitation ${invitationId} and joined group ${invitation.groups?.name}`,
                                                                                            ~~~~~~

lib/services/groupService.ts:749:39 - error TS2339: Property 'groups' does not exist on type 'never'.

749         data: { groupName: invitation.groups?.name || "Unknown Group" },
                                          ~~~~~~

lib/services/groupService.ts:783:38 - error TS2339: Property 'email' does not exist on type 'never'.

783       const userEmail = userProfile?.email || user.email;
                                         ~~~~~

lib/services/groupService.ts:787:17 - error TS2345: Argument of type '{ status: string; }' is not assignable to parameter of type 'never'.

787         .update({ status: "declined" })
                    ~~~~~~~~~~~~~~~~~~~~~~

lib/services/groupService.ts:860:17 - error TS2339: Property 'owner_id' does not exist on type 'never'.

860       if (group.owner_id === user.id) {
                    ~~~~~~~~

lib/services/groupService.ts:899:26 - error TS2339: Property 'name' does not exist on type 'never'.

899         groupName: group.name,
                             ~~~~

lib/services/groupService.ts:941:17 - error TS2339: Property 'owner_id' does not exist on type 'never'.

941       if (group.owner_id !== user.id) {
                    ~~~~~~~~

lib/services/groupService.ts:970:17 - error TS2345: Argument of type '{ owner_id: string; updated_at: string; }' is not assignable to parameter of type 'never'.

970         .update({
                    ~
971           owner_id: newOwnerId,
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
972           updated_at: new Date().toISOString(),
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
973         })
    ~~~~~~~~~

lib/services/groupService.ts:986:26 - error TS2339: Property 'name' does not exist on type 'never'.

986         groupName: group.name,
                             ~~~~

lib/services/imageUploadService.ts:129:17 - error TS2345: Argument of type '{ avatar_url: string; }' is not assignable to parameter of type 'never'.

129         .update({ avatar_url: urlData.publicUrl })
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

lib/services/imageUploadService.ts:177:19 - error TS2339: Property 'user_id' does not exist on type 'never'.

177       if (vehicle.user_id !== user.id) {
                      ~~~~~~~

lib/services/imageUploadService.ts:227:46 - error TS2339: Property 'display_order' does not exist on type 'never'.

227         displayOrder = (existingImages?.[0]?.display_order || 0) + 1;
                                                 ~~~~~~~~~~~~~

lib/services/imageUploadService.ts:242:17 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "vehicle_images", never, "POST">', gave the following error.
    Argument of type '{ id?: string | undefined; vehicle_id: string; image_url: string; image_type?: "profile_avatar" | "vehicle_main" | "vehicle_gallery" | undefined; caption?: string | null | undefined; display_order?: number | undefined; uploaded_by?: string | ... 1 more ... | undefined; }' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "vehicle_images", never, "POST">', gave the following error.
    Argument of type '{ id?: string | undefined; vehicle_id: string; image_url: string; image_type?: "profile_avatar" | "vehicle_main" | "vehicle_gallery" | undefined; caption?: string | null | undefined; display_order?: number | undefined; uploaded_by?: string | ... 1 more ... | undefined; }' is not assignable to parameter of type 'never[]'.
      Type '{ id?: string | undefined; vehicle_id: string; image_url: string; image_type?: "profile_avatar" | "vehicle_main" | "vehicle_gallery" | undefined; caption?: string | null | undefined; display_order?: number | undefined; uploaded_by?: string | ... 1 more ... | undefined; }' is missing the following properties from type 'never[]': length, pop, push, concat, and 35 more.

242         .insert(imageData)
                    ~~~~~~~~~


lib/services/imageUploadService.ts:257:19 - error TS2345: Argument of type '{ main_image_url: string; }' is not assignable to parameter of type 'never'.

257           .update({ main_image_url: urlData.publicUrl })
                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

lib/services/imageUploadService.ts:344:23 - error TS2339: Property 'vehicles' does not exist on type 'never'.

344       if (imageRecord.vehicles.user_id !== user.id) {
                          ~~~~~~~~

lib/services/imageUploadService.ts:353:39 - error TS2339: Property 'image_url' does not exist on type 'never'.

353       const url = new URL(imageRecord.image_url);
                                          ~~~~~~~~~

lib/services/imageUploadService.ts:380:23 - error TS2339: Property 'image_type' does not exist on type 'never'.

380       if (imageRecord.image_type === "vehicle_main") {
                          ~~~~~~~~~~

lib/services/imageUploadService.ts:383:19 - error TS2345: Argument of type '{ main_image_url: null; }' is not assignable to parameter of type 'never'.

383           .update({ main_image_url: null })
                      ~~~~~~~~~~~~~~~~~~~~~~~~

lib/services/imageUploadService.ts:384:33 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

384           .eq("id", imageRecord.vehicle_id);
                                    ~~~~~~~~~~

lib/services/imageUploadService.ts:432:23 - error TS2339: Property 'vehicles' does not exist on type 'never'.

432       if (imageRecord.vehicles.user_id !== user.id) {
                          ~~~~~~~~

lib/services/imageUploadService.ts:443:17 - error TS2345: Argument of type '{ updated_at: string; caption?: string; display_order?: number; }' is not assignable to parameter of type 'never'.

443         .update({
                    ~
444           ...updates,
    ~~~~~~~~~~~~~~~~~~~~~
445           updated_at: new Date().toISOString(),
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
446         })
    ~~~~~~~~~

lib/services/imageUploadService.ts:488:37 - error TS2339: Property 'avatar_url' does not exist on type 'never'.

488       if (profileError || !profile?.avatar_url) {
                                        ~~~~~~~~~~

lib/services/imageUploadService.ts:493:35 - error TS2339: Property 'avatar_url' does not exist on type 'never'.

493       const url = new URL(profile.avatar_url);
                                      ~~~~~~~~~~

lib/services/imageUploadService.ts:511:17 - error TS2345: Argument of type '{ avatar_url: null; }' is not assignable to parameter of type 'never'.

511         .update({ avatar_url: null })
                    ~~~~~~~~~~~~~~~~~~~~

lib/services/loggingService.ts:56:52 - error TS2339: Property 'group_id' does not exist on type 'never'.

56           const groupIds = userGroups.map((g) => g.group_id);
                                                      ~~~~~~~~

lib/services/loggingService.ts:65:62 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

65             sharedVehicleIds = sharedVehicles.map((sv) => sv.vehicle_id);
                                                                ~~~~~~~~~~

lib/services/loggingService.ts:114:9 - error TS2698: Spread types may only be created from object types.

114         ...log,
            ~~~~~~

lib/services/loggingService.ts:182:10 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "mileage_logs", never, "POST">', gave the following error.
    Argument of type '{ user_id: string; id?: string | undefined; vehicle_id: string; date: string; odometer_reading: number; notes?: string | null | undefined; }' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "mileage_logs", never, "POST">', gave the following error.
    Object literal may only specify known properties, and 'user_id' does not exist in type 'never[]'.

182         .insert({
             ~~~~~~


lib/services/loggingService.ts:248:21 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

248         existingLog.vehicle_id,
                        ~~~~~~~~~~

lib/services/loggingService.ts:255:23 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

255           existingLog.vehicle_id,
                          ~~~~~~~~~~

lib/services/loggingService.ts:268:17 - error TS2345: Argument of type '{ odometer_reading?: number | undefined; date?: string | undefined; notes?: string | null | undefined; }' is not assignable to parameter of type 'never'.

268         .update(updates)
                    ~~~~~~~

lib/services/loggingService.ts:357:21 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

357         existingLog.vehicle_id,
                        ~~~~~~~~~~

lib/services/loggingService.ts:364:23 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

364           existingLog.vehicle_id,
                          ~~~~~~~~~~

lib/services/loggingService.ts:371:33 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

371           .eq("id", existingLog.vehicle_id)
                                    ~~~~~~~~~~

lib/services/loggingService.ts:374:49 - error TS2339: Property 'user_id' does not exist on type 'never'.

374         if (!vehicleError && vehicle && vehicle.user_id !== user.id) {
                                                    ~~~~~~~

lib/services/loggingService.ts:475:52 - error TS2339: Property 'group_id' does not exist on type 'never'.

475           const groupIds = userGroups.map((g) => g.group_id);
                                                       ~~~~~~~~

lib/services/loggingService.ts:484:62 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

484             sharedVehicleIds = sharedVehicles.map((sv) => sv.vehicle_id);
                                                                 ~~~~~~~~~~

lib/services/loggingService.ts:530:9 - error TS2698: Spread types may only be created from object types.

530         ...log,
            ~~~~~~

lib/services/loggingService.ts:579:10 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "fuel_logs", never, "POST">', gave the following error.
    Argument of type '{ user_id: string; id?: string | undefined; vehicle_id: string; date: string; odometer_reading: number; liters_filled: number; cost?: number | null | undefined; location?: string | null | undefined; }' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "fuel_logs", never, "POST">', gave the following error.
    Object literal may only specify known properties, and 'user_id' does not exist in type 'never[]'.

579         .insert({
             ~~~~~~


lib/services/loggingService.ts:641:21 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

641         existingLog.vehicle_id,
                        ~~~~~~~~~~

lib/services/loggingService.ts:648:23 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

648           existingLog.vehicle_id,
                          ~~~~~~~~~~

lib/services/loggingService.ts:661:17 - error TS2345: Argument of type '{ liters_filled?: number | undefined; cost?: number | null | undefined; date?: string | undefined; odometer_reading?: number | undefined; location?: string | null | undefined; }' is not assignable to parameter of type 'never'.

661         .update(updates)
                    ~~~~~~~

lib/services/loggingService.ts:750:21 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

750         existingLog.vehicle_id,
                        ~~~~~~~~~~

lib/services/loggingService.ts:757:23 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

757           existingLog.vehicle_id,
                          ~~~~~~~~~~

lib/services/loggingService.ts:764:33 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

764           .eq("id", existingLog.vehicle_id)
                                    ~~~~~~~~~~

lib/services/loggingService.ts:767:49 - error TS2339: Property 'user_id' does not exist on type 'never'.

767         if (!vehicleError && vehicle && vehicle.user_id !== user.id) {
                                                    ~~~~~~~

lib/services/loggingService.ts:868:52 - error TS2339: Property 'group_id' does not exist on type 'never'.

868           const groupIds = userGroups.map((g) => g.group_id);
                                                       ~~~~~~~~

lib/services/loggingService.ts:877:62 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

877             sharedVehicleIds = sharedVehicles.map((sv) => sv.vehicle_id);
                                                                 ~~~~~~~~~~

lib/services/loggingService.ts:926:9 - error TS2698: Spread types may only be created from object types.

926         ...log,
            ~~~~~~

lib/services/loggingService.ts:979:10 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "service_logs", never, "POST">', gave the following error.
    Argument of type '{ user_id: string; id?: string | undefined; vehicle_id: string; service_type: string; date: string; odometer_reading: number; cost?: number | null | undefined; description: string; next_service_due?: string | null | undefined; receipt_image_url?: string | null | undefined; ocr_extracted_data?: any | null; auto_fille...' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "service_logs", never, "POST">', gave the following error.
    Object literal may only specify known properties, and 'user_id' does not exist in type 'never[]'.

979         .insert({
             ~~~~~~


lib/services/loggingService.ts:1045:21 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

1045         existingLog.vehicle_id,
                         ~~~~~~~~~~

lib/services/loggingService.ts:1052:23 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

1052           existingLog.vehicle_id,
                           ~~~~~~~~~~

lib/services/loggingService.ts:1065:17 - error TS2345: Argument of type '{ service_type?: string | undefined; description?: string | undefined; cost?: number | null | undefined; date?: string | undefined; odometer_reading?: number | undefined; next_service_due?: string | ... 1 more ... | undefined; receipt_image_url?: string | ... 1 more ... | undefined; ocr_extracted_data?: any; auto_fi...' is not assignable to parameter of type 'never'.

1065         .update(updates)
                     ~~~~~~~

lib/services/loggingService.ts:1154:21 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

1154         existingLog.vehicle_id,
                         ~~~~~~~~~~

lib/services/loggingService.ts:1161:23 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

1161           existingLog.vehicle_id,
                           ~~~~~~~~~~

lib/services/notificationService.ts:47:50 - error TS2339: Property 'group_id' does not exist on type 'never'.

47     this.userGroupIds = userGroups?.map((g) => g.group_id) || [];
                                                    ~~~~~~~~

lib/services/notificationService.ts:55:50 - error TS2339: Property 'id' does not exist on type 'never'.

55     this.userVehicleIds = vehicles?.map((v) => v.id) || [];
                                                    ~~

lib/services/notificationService.ts:64:63 - error TS2339: Property 'vehicle_id' does not exist on type 'never'.

64       const sharedVehicleIds = sharedVehicles?.map((sv) => sv.vehicle_id) || [];
                                                                 ~~~~~~~~~~

lib/services/notificationService.ts:201:20 - error TS2339: Property 'year' does not exist on type 'never'.

201       ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                       ~~~~

lib/services/notificationService.ts:201:36 - error TS2339: Property 'make' does not exist on type 'never'.

201       ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                                       ~~~~

lib/services/notificationService.ts:201:52 - error TS2339: Property 'model' does not exist on type 'never'.

201       ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                                                       ~~~~~

lib/services/notificationService.ts:203:28 - error TS2339: Property 'full_name' does not exist on type 'never'.

203     const userName = user?.full_name || user?.email || "Someone";
                               ~~~~~~~~~

lib/services/notificationService.ts:203:47 - error TS2339: Property 'email' does not exist on type 'never'.

203     const userName = user?.full_name || user?.email || "Someone";
                                                  ~~~~~

lib/services/notificationService.ts:268:30 - error TS2339: Property 'name' does not exist on type 'never'.

268     const groupName = group?.name || "Unknown Group";
                                 ~~~~

lib/services/notificationService.ts:269:28 - error TS2339: Property 'full_name' does not exist on type 'never'.

269     const userName = user?.full_name || user?.email || "Someone";
                               ~~~~~~~~~

lib/services/notificationService.ts:269:47 - error TS2339: Property 'email' does not exist on type 'never'.

269     const userName = user?.full_name || user?.email || "Someone";
                                                  ~~~~~

lib/services/notificationService.ts:313:57 - error TS2339: Property 'email' does not exist on type 'never'.

313     if (!userProfile || newRecord.email !== userProfile.email.toLowerCase()) {
                                                            ~~~~~

lib/services/notificationService.ts:330:30 - error TS2339: Property 'name' does not exist on type 'never'.

330     const groupName = group?.name || "Unknown Group";
                                 ~~~~

lib/services/notificationService.ts:331:34 - error TS2339: Property 'full_name' does not exist on type 'never'.

331     const inviterName = inviter?.full_name || inviter?.email || "Someone";
                                     ~~~~~~~~~

lib/services/notificationService.ts:331:56 - error TS2339: Property 'email' does not exist on type 'never'.

331     const inviterName = inviter?.full_name || inviter?.email || "Someone";
                                                           ~~~~~

lib/services/pushNotificationService.ts:9:35 - error TS2322: Type 'Promise<{ shouldShowAlert: true; shouldPlaySound: true; shouldSetBadge: true; }>' is not assignable to type 'Promise<NotificationBehavior>'.
  Type '{ shouldShowAlert: true; shouldPlaySound: true; shouldSetBadge: true; }' is missing the following properties from type 'NotificationBehavior': shouldShowBanner, shouldShowList

  9   handleNotification: async () => ({
                                      ~~
 10     shouldShowAlert: true,
    ~~~~~~~~~~~~~~~~~~~~~~~~~~
...
 12     shouldSetBadge: true,
    ~~~~~~~~~~~~~~~~~~~~~~~~~
 13   }),
    ~~~~

  node_modules/expo-notifications/build/NotificationsHandler.d.ts:20:25
    20     handleNotification: (notification: Notification) => Promise<NotificationBehavior>;
                               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    The expected type comes from the return type of this signature.

lib/services/pushNotificationService.ts:101:62 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "push_tokens", never, "POST">', gave the following error.
    Argument of type '{ user_id: string; token: string; platform: "ios" | "android" | "windows" | "macos" | "web"; device_name: string; }' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "push_tokens", never, "POST">', gave the following error.
    Object literal may only specify known properties, and 'user_id' does not exist in type 'never[]'.

101         const { error } = await supabase.from("push_tokens").insert({
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

lib/services/vehicleService-fallback.ts:205:50 - error TS2339: Property 'shared_with_groups' does not exist on type 'Omit<{ id?: string | undefined; user_id: string; make: string; model: string; year: number; license_plate: string; vin?: string | null | undefined; }, "user_id">'.

205         vehicleData.shared_with_groups = vehicle.shared_with_groups ?? false;
                                                     ~~~~~~~~~~~~~~~~~~

lib/services/vehicleService-fallback.ts:269:17 - error TS2345: Argument of type '{ updated_at: string; make?: string; model?: string; year?: number; license_plate?: string; vin?: string | null; main_image_url?: string | null; }' is not assignable to parameter of type 'never'.

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

lib/services/vehicleService.ts:44:9 - error TS2345: Argument of type '{ user_uuid: string; }' is not assignable to parameter of type 'undefined'.

44         { user_uuid: user.id },
           ~~~~~~~~~~~~~~~~~~~~~~

lib/services/vehicleService.ts:52:64 - error TS2339: Property 'length' does not exist on type 'never'.

52       console.log("✅ Raw vehicle data received:", vehicleData?.length || 0);
                                                                  ~~~~~~

lib/services/vehicleService.ts:56:29 - error TS2339: Property 'map' does not exist on type 'never'.

56         (vehicleData || []).map(async (vehicle) => {
                               ~~~

lib/services/vehicleService.ts:56:40 - error TS7006: Parameter 'vehicle' implicitly has an 'any' type.

56         (vehicleData || []).map(async (vehicle) => {
                                          ~~~~~~~

lib/services/vehicleService.ts:79:57 - error TS2339: Property 'groups' does not exist on type 'never'.

79             sharedGroups = shares?.map((share) => share.groups) || [];
                                                           ~~~~~~

lib/services/vehicleService.ts:108:42 - error TS2339: Property 'odometer_reading' does not exist on type 'never'.

108               : mileageResult.data?.[0]?.odometer_reading || 0;
                                             ~~~~~~~~~~~~~~~~

lib/services/vehicleService.ts:223:79 - error TS2345: Argument of type '{ vehicle_uuid: string; group_uuids: string[]; }' is not assignable to parameter of type 'undefined'.

223       const { data, error } = await supabase.rpc("share_vehicle_with_groups", {
                                                                                  ~
224         vehicle_uuid: vehicleId,
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
225         group_uuids: groupIds,
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
226       });
    ~~~~~~~

lib/services/vehicleService.ts:272:19 - error TS2339: Property 'user_id' does not exist on type 'never'.

272       if (vehicle.user_id !== user.id) {
                      ~~~~~~~

lib/services/vehicleService.ts:304:35 - error TS2339: Property 'group_id' does not exist on type 'never'.

304             .eq("group_id", share.group_id);
                                      ~~~~~~~~

lib/services/vehicleService.ts:311:29 - error TS2339: Property 'group_id' does not exist on type 'never'.

311             group_id: share.group_id,
                                ~~~~~~~~

lib/services/vehicleService.ts:312:31 - error TS2339: Property 'groups' does not exist on type 'never'.

312             group_name: share.groups.name,
                                  ~~~~~~

lib/services/vehicleService.ts:314:30 - error TS2339: Property 'shared_at' does not exist on type 'never'.

314             shared_at: share.shared_at,
                                 ~~~~~~~~~

lib/services/vehicleService.ts:406:10 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "vehicles", never, "POST">', gave the following error.
    Argument of type '{ main_image_url: string | undefined; user_id: string; id?: string | undefined; year: number; color?: string | null | undefined; current_mileage?: number | undefined; make: string; model: string; license_plate: string; vin?: string | null | undefined; }' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "vehicles", never, "POST">', gave the following error.
    Object literal may only specify known properties, and 'main_image_url' does not exist in type 'never[]'.

406         .insert({
             ~~~~~~


lib/services/vehicleService.ts:422:19 - error TS2339: Property 'id' does not exist on type 'never'.

422           vehicle.id,
                      ~~

lib/services/vehicleService.ts:431:62 - error TS2339: Property 'id' does not exist on type 'never'.

431       console.log("✅ Vehicle created successfully:", vehicle.id);
                                                                 ~~

lib/services/vehicleService.ts:478:17 - error TS2345: Argument of type '{ updated_at: string; make?: string; model?: string; year?: number; license_plate?: string; vin?: string | null; main_image_url?: string | null; color?: string | null; current_mileage?: number; }' is not assignable to parameter of type 'never'.

478         .update({
                    ~
479           ...updates,
    ~~~~~~~~~~~~~~~~~~~~~
480           updated_at: new Date().toISOString(),
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
481         })
    ~~~~~~~~~

lib/services/vehicleService.ts:536:19 - error TS2339: Property 'user_id' does not exist on type 'never'.

536       if (vehicle.user_id !== user.id) {
                      ~~~~~~~

lib/services/vehicleService.ts:600:17 - error TS2339: Property 'user_id' does not exist on type 'never'.

600         vehicle.user_id === user.id ||
                    ~~~~~~~

lib/services/vehicleService.ts:625:17 - error TS2339: Property 'user_id' does not exist on type 'never'.

625         vehicle.user_id === user.id
                    ~~~~~~~

lib/services/vehicleService.ts:628:17 - error TS2339: Property 'user_id' does not exist on type 'never'.

628         vehicle.user_id !== user.id
                    ~~~~~~~

lib/services/vehicleService.ts:632:33 - error TS2339: Property 'user_id' does not exist on type 'never'.

632               .eq("id", vehicle.user_id)
                                    ~~~~~~~

lib/services/vehicleService.ts:640:9 - error TS2698: Spread types may only be created from object types.

640         ...vehicle,
            ~~~~~~~~~~

lib/services/vehicleService.ts:641:33 - error TS2339: Property 'user_id' does not exist on type 'never'.

641         is_own_vehicle: vehicle.user_id === user.id,
                                    ~~~~~~~

lib/services/vehicleService.ts:664:60 - error TS2339: Property 'mileage_logs' does not exist on type 'never'.

664           detailedLogsResult.data?.mileage_logs || vehicle.mileage_logs || [],
                                                               ~~~~~~~~~~~~

lib/services/vehicleService.ts:666:57 - error TS2339: Property 'fuel_logs' does not exist on type 'never'.

666           detailedLogsResult.data?.fuel_logs || vehicle.fuel_logs || [],
                                                            ~~~~~~~~~

lib/services/vehicleService.ts:668:60 - error TS2339: Property 'service_logs' does not exist on type 'never'.

668           detailedLogsResult.data?.service_logs || vehicle.service_logs || [],
                                                               ~~~~~~~~~~~~

lib/services/vehicleService.ts:672:21 - error TS2339: Property 'mileage_logs' does not exist on type 'never'.

672             vehicle.mileage_logs?.[0] ||
                        ~~~~~~~~~~~~

lib/services/vehicleService.ts:676:21 - error TS2339: Property 'fuel_logs' does not exist on type 'never'.

676             vehicle.fuel_logs?.[0] ||
                        ~~~~~~~~~

lib/services/vehicleService.ts:680:21 - error TS2339: Property 'service_logs' does not exist on type 'never'.

680             vehicle.service_logs?.[0] ||
                        ~~~~~~~~~~~~

lib/services/vehicleService.ts:715:58 - error TS2339: Property 'group_id' does not exist on type 'never'.

715       const sharedGroupIds = shares.map((share) => share.group_id);
                                                             ~~~~~~~~

lib/services/vehicleService.ts:764:45 - error TS2339: Property 'odometer_reading' does not exist on type 'never'.

764         currentMileage: latestMileage?.[0]?.odometer_reading || 0,
                                                ~~~~~~~~~~~~~~~~

lib/services/vehicleService.ts:799:45 - error TS2339: Property 'odometer_reading' does not exist on type 'never'.

799         const newMileage = latestMileage[0].odometer_reading;
                                                ~~~~~~~~~~~~~~~~

lib/services/vehicleService.ts:804:19 - error TS2345: Argument of type '{ current_mileage: any; }' is not assignable to parameter of type 'never'.

804           .update({ current_mileage: newMileage })
                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

lib/services/vehicleService.ts:878:29 - error TS2339: Property 'groups' does not exist on type 'never'.

878         .map((item) => item.groups)
                                ~~~~~~

lib/services/vehicleService.ts:885:38 - error TS2339: Property 'id' does not exist on type 'never'.

885         if (!allGroups.find((g) => g.id === group.id)) {
                                         ~~

lib/services/vehicleService.ts:886:26 - error TS2345: Argument of type 'any' is not assignable to parameter of type 'never'.

886           allGroups.push(group);
                             ~~~~~

lib/services/vehicleService.ts:1156:10 - error TS7006: Parameter 'template' implicitly has an 'any' type.

1156         (template) => ({
              ~~~~~~~~

lib/services/vehicleService.ts:1161:20 - error TS7006: Parameter 'a' implicitly has an 'any' type.

1161             .sort((a, b) => a.display_order - b.display_order)
                        ~

lib/services/vehicleService.ts:1161:23 - error TS7006: Parameter 'b' implicitly has an 'any' type.

1161             .sort((a, b) => a.display_order - b.display_order)
                           ~

lib/services/vehicleService.ts:1162:19 - error TS7006: Parameter 'item' implicitly has an 'any' type.

1162             .map((item) => ({
                       ~~~~

lib/services/vehicleService.ts:1247:18 - error TS7006: Parameter 'a' implicitly has an 'any' type.

1247           .sort((a, b) => a.display_order - b.display_order)
                      ~

lib/services/vehicleService.ts:1247:21 - error TS7006: Parameter 'b' implicitly has an 'any' type.

1247           .sort((a, b) => a.display_order - b.display_order)
                         ~

lib/services/vehicleService.ts:1248:17 - error TS7006: Parameter 'item' implicitly has an 'any' type.

1248           .map((item) => ({
                     ~~~~

lib/utils/serviceUtils.ts:55:46 - error TS2339: Property 'group_id' does not exist on type 'never'.

55     const groupIds = userGroups.map((g) => g.group_id);
                                                ~~~~~~~~


Found 344 errors in 38 files.

Errors  Files
     1  app/(tabs)/analytics.tsx:341
     1  app/(tabs)/index.tsx:407
     4  app/(tabs)/logs.tsx:99
     1  app/groups/[id].tsx:79
     1  app/logs/service/[id]/index.tsx:396
    11  app/vehicles/[id].tsx:4
     3  components/charts/BarChart.tsx:77
     1  components/charts/LineChart.tsx:122
    21  components/examples/UnistylesExample.tsx:10
     8  components/layout/WebLayout.tsx:25
     1  components/navigation/WebNavbar.tsx:70
     1  components/parallax-scroll-view.tsx:54
     1  components/themed-text.tsx:32
     1  components/themed-view.tsx:21
    19  components/ui/Button.tsx:50
    10  components/ui/Card.tsx:21
     1  components/ui/ImagePicker.tsx:339
     2  components/ui/ImageUpload.tsx:174
    22  components/ui/Input.tsx:74
     5  components/ui/LoadingSpinner.tsx:40
     1  components/ui/MetricCard.tsx:137
    10  components/ui/Modal.tsx:280
     2  components/ui/NotificationBell.tsx:25
    13  components/ui/NotificationList.tsx:81
     6  components/ui/NotificationToast.tsx:79
     1  components/ui/Skeleton.tsx:61
     1  components/ui/TrendCard.tsx:129
     6  components/VehicleDetail.tsx:453
     6  lib/contexts/AuthContext.tsx:56
     8  lib/services/analyticsService.ts:255
    57  lib/services/groupService.ts:56
    15  lib/services/imageUploadService.ts:129
    31  lib/services/loggingService.ts:56
    15  lib/services/notificationService.ts:47
     2  lib/services/pushNotificationService.ts:9
    11  lib/services/vehicleService-fallback.ts:45
    43  lib/services/vehicleService.ts:44
     1  lib/utils/serviceUtils.ts:55
