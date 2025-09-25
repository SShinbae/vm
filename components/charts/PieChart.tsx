import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart as RNPieChart } from 'react-native-chart-kit';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ChartDataPoint } from '@/lib/services/analyticsService';

interface PieChartProps {
  data: ChartDataPoint[];
  title: string;
  height?: number;
  colors?: string[];
  showLegend?: boolean;
}

export function PieChart({
  data,
  title,
  height = 200,
  colors: customColors,
  showLegend = true
}: PieChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const screenWidth = Dimensions.get('window').width;

  const defaultColors = [colors.chart.fuel, colors.chart.service, colors.chart.mileage, colors.chart.primary];

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    chartContainer: {
      alignItems: 'center',
    },
    emptyState: {
      height,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    legendContainer: {
      marginTop: 16,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 16,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  // Prepare data for react-native-chart-kit
  const chartData = data.map((point, index) => {
    const pieColors = customColors || defaultColors;
    return {
      name: point.label || point.x,
      population: point.y,
      color: pieColors[index % pieColors.length],
      legendFontColor: colors.textSecondary,
      legendFontSize: 12,
    };
  });

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: (opacity = 1) => colors.text + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
    labelColor: (opacity = 1) => colors.textSecondary + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <RNPieChart
          data={chartData}
          width={screenWidth - 64}
          height={height}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 10]}
          hasLegend={showLegend}
        />
      </View>
    </View>
  );
}