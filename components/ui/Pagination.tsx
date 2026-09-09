import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { IconSymbol } from "./icon-symbol";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

type PageEntry = number | "ellipsis-start" | "ellipsis-end";

function getPageNumbers(currentPage: number, totalPages: number): PageEntry[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: PageEntry[] = [1];
  if (currentPage > 3) {
    pages.push("ellipsis-start");
  }
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (currentPage < totalPages - 2) {
    pages.push("ellipsis-end");
  }
  pages.push(totalPages);
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const { styles, theme } = useStyles(stylesheet);

  if (totalItems === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <View style={styles.footer}>
      <Text style={styles.countText}>
        Showing {start}–{end} of {totalItems}
      </Text>

      {totalPages > 1 && (
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            onPress={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={[
              styles.navButton,
              currentPage === 1 && styles.buttonDisabled,
            ]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Previous page"
          >
            <IconSymbol
              name="chevron.left"
              size={16}
              color={
                currentPage === 1
                  ? theme.colors.textSecondary
                  : theme.colors.text
              }
            />
          </TouchableOpacity>

          {getPageNumbers(currentPage, totalPages).map((page) =>
            typeof page === "string" ? (
              <Text key={page} style={styles.ellipsisText}>
                ...
              </Text>
            ) : (
              <TouchableOpacity
                key={`page-${page}`}
                onPress={() => onPageChange(page)}
                style={[
                  styles.pageButton,
                  currentPage === page && styles.pageButtonActive,
                ]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Page ${page}`}
                accessibilityState={{ selected: currentPage === page }}
              >
                <Text
                  style={[
                    styles.pageButtonText,
                    currentPage === page && styles.pageButtonTextActive,
                  ]}
                >
                  {page}
                </Text>
              </TouchableOpacity>
            ),
          )}

          <TouchableOpacity
            onPress={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={[
              styles.navButton,
              currentPage === totalPages && styles.buttonDisabled,
            ]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Next page"
          >
            <IconSymbol
              name="chevron.right"
              size={16}
              color={
                currentPage === totalPages
                  ? theme.colors.textSecondary
                  : theme.colors.text
              }
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  footer: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  countText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    textAlign: "center",
  },
  buttonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    flexWrap: "wrap",
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pageButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pageButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  pageButtonTextActive: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ellipsisText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    paddingHorizontal: theme.spacing.xs,
  },
}));
