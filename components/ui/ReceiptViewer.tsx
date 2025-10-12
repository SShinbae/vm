import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { OCRExtractedData } from '@/types';

interface ReceiptViewerProps {
  receiptImageUrl?: string;
  ocrData?: OCRExtractedData;
  showOcrData?: boolean;
  onDelete?: () => void;
}

export function ReceiptViewer({
  receiptImageUrl,
  ocrData,
  showOcrData = true,
  onDelete
}: ReceiptViewerProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!receiptImageUrl) {
    return null;
  }

  const handleDeleteReceipt = () => {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt image? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  const formatConfidenceScore = (score?: number): string => {
    if (!score) return 'N/A';
    return `${score}%`;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.icon + '20',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      backgroundColor: colors.icon + '10',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 4,
    },
    imageContainer: {
      position: 'relative',
      height: 120,
      backgroundColor: colors.icon + '05',
    },
    receiptImage: {
      width: '100%',
      height: '100%',
    },
    imageOverlay: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    overlayText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '500',
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    errorContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 14,
      color: colors.icon,
      textAlign: 'center',
      marginTop: 8,
    },
    ocrDataContainer: {
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.icon + '20',
    },
    ocrTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    ocrField: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    ocrLabel: {
      fontSize: 12,
      color: colors.icon,
      fontWeight: '500',
    },
    ocrValue: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
    confidenceHigh: {
      color: '#4CAF50',
    },
    confidenceMedium: {
      color: '#FF9800',
    },
    confidenceLow: {
      color: '#F44336',
    },
    fullscreenModal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fullscreenImage: {
      width: '95%',
      height: '80%',
    },
    fullscreenControls: {
      position: 'absolute',
      top: 50,
      right: 20,
      flexDirection: 'row',
      gap: 15,
    },
    fullscreenButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 8,
      padding: 12,
    },
  });

  const getConfidenceColor = (score?: number) => {
    if (!score) return styles.confidenceLow;
    if (score >= 70) return styles.confidenceHigh;
    if (score >= 50) return styles.confidenceMedium;
    return styles.confidenceLow;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconSymbol name="doc.fill" size={16} color={colors.icon} />
          <Text style={styles.headerTitle}>Receipt</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowFullscreen(true)}
          >
            <IconSymbol name="arrow.up.left.and.arrow.down.right" size={16} color={colors.icon} />
          </TouchableOpacity>
          {onDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDeleteReceipt}
            >
              <IconSymbol name="trash" size={16} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.imageContainer}
        onPress={() => setShowFullscreen(true)}
        activeOpacity={0.8}
      >
        {imageLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.tint} />
          </View>
        )}

        {!imageError ? (
          <>
            <Image
              source={{ uri: receiptImageUrl }}
              style={styles.receiptImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
            {ocrData && (
              <View style={styles.imageOverlay}>
                <Text style={styles.overlayText}>
                  {ocrData.confidence}% confidence
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.errorContainer}>
            <IconSymbol name="exclamationmark.triangle" size={24} color={colors.icon} />
            <Text style={styles.errorText}>
              Unable to load receipt image
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {showOcrData && ocrData && (
        <View style={styles.ocrDataContainer}>
          <Text style={styles.ocrTitle}>Extracted Data</Text>

          {ocrData.extracted_fields.service_type && (
            <View style={styles.ocrField}>
              <Text style={styles.ocrLabel}>Service Type:</Text>
              <Text style={styles.ocrValue}>
                {ocrData.extracted_fields.service_type.replace('_', ' ')}
              </Text>
            </View>
          )}

          {ocrData.extracted_fields.cost && (
            <View style={styles.ocrField}>
              <Text style={styles.ocrLabel}>Cost:</Text>
              <Text style={styles.ocrValue}>
                ${ocrData.extracted_fields.cost.toFixed(2)}
              </Text>
            </View>
          )}

          {ocrData.extracted_fields.business_name && (
            <View style={styles.ocrField}>
              <Text style={styles.ocrLabel}>Provider:</Text>
              <Text style={styles.ocrValue}>
                {ocrData.extracted_fields.business_name}
              </Text>
            </View>
          )}

          <View style={styles.ocrField}>
            <Text style={styles.ocrLabel}>Overall Confidence:</Text>
            <Text style={[styles.ocrValue, getConfidenceColor(ocrData.confidence)]}>
              {formatConfidenceScore(ocrData.confidence)}
            </Text>
          </View>
        </View>
      )}

      <Modal
        visible={showFullscreen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullscreen(false)}
      >
        <View style={styles.fullscreenModal}>
          <Image
            source={{ uri: receiptImageUrl }}
            style={styles.fullscreenImage}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={200}
          />
          <View style={styles.fullscreenControls}>
            <TouchableOpacity
              style={styles.fullscreenButton}
              onPress={() => setShowFullscreen(false)}
            >
              <IconSymbol name="xmark" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface ReceiptListProps {
  receipts: Array<{
    id: string;
    imageUrl: string;
    ocrData?: OCRExtractedData;
    serviceName?: string;
    date?: string;
  }>;
  onReceiptPress?: (receipt: any) => void;
  onReceiptDelete?: (receiptId: string) => void;
}

export function ReceiptList({ receipts, onReceiptPress, onReceiptDelete }: ReceiptListProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const styles = StyleSheet.create({
    container: {
      gap: 12,
    },
    receiptItem: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.icon + '20',
      overflow: 'hidden',
    },
    thumbnail: {
      width: 60,
      height: 60,
      backgroundColor: colors.icon + '10',
    },
    receiptInfo: {
      flex: 1,
      padding: 12,
      justifyContent: 'space-between',
    },
    receiptTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    receiptMeta: {
      fontSize: 12,
      color: colors.icon,
      marginTop: 2,
    },
    receiptActions: {
      paddingRight: 12,
      justifyContent: 'center',
    },
  });

  if (receipts.length === 0) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <IconSymbol name="doc" size={48} color={colors.icon} />
        <Text style={{ fontSize: 16, color: colors.icon, marginTop: 8 }}>
          No receipts found
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {receipts.map((receipt) => (
        <TouchableOpacity
          key={receipt.id}
          style={styles.receiptItem}
          onPress={() => onReceiptPress?.(receipt)}
        >
          <Image
            source={{ uri: receipt.imageUrl }}
            style={styles.thumbnail}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
          <View style={styles.receiptInfo}>
            <Text style={styles.receiptTitle}>
              {receipt.serviceName || 'Service Receipt'}
            </Text>
            <Text style={styles.receiptMeta}>
              {receipt.date && new Date(receipt.date).toLocaleDateString()}
              {receipt.ocrData && ` • ${receipt.ocrData.confidence}% confidence`}
            </Text>
          </View>
          <View style={styles.receiptActions}>
            <TouchableOpacity
              onPress={() => onReceiptDelete?.(receipt.id)}
            >
              <IconSymbol name="trash" size={16} color="#F44336" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

interface ServiceReceiptIndicatorProps {
  hasReceipt: boolean;
  receiptUrl?: string | null;
  onPress?: () => void;
  size?: number;
}

export function ServiceReceiptIndicator({
  hasReceipt,
  receiptUrl,
  onPress,
  size = 20,
}: ServiceReceiptIndicatorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!hasReceipt || !receiptUrl) {
    return null;
  }

  const indicatorStyles = StyleSheet.create({
    indicator: {
      backgroundColor: colors.tint + '20',
      borderRadius: size / 2,
      padding: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <TouchableOpacity style={indicatorStyles.indicator} onPress={onPress}>
      <IconSymbol name="photo" size={size * 0.7} color={colors.tint} />
    </TouchableOpacity>
  );
}