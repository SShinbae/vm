import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { theme } from "../../../theme";
import { tokens } from "../../../tokens";
import { Spacer } from "../../atoms/Spacer";
import { Text } from "../../atoms/Text";
import { PageHeader } from "../../organisms/PageHeader";
import { SearchBar } from "../../organisms/SearchBar";
import type { ListLayoutProps } from "./ListLayout.types";

export const ListLayout = <T,>({
  header,
  searchQuery = "",
  onSearchChange,
  onFilterPress,
  onSortPress,
  activeFilters = 0,
  data,
  renderItem,
  keyExtractor,
  emptyComponent,
  emptyMessage = "No items found",
  loading = false,
  refreshable = true,
  onRefresh,
  refreshing = false,
  onLoadMore,
  loadingMore = false,
  hasMore = false,
  listHeader,
  listFooter,
  itemSeparator,
  ...props
}: ListLayoutProps<T>) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  const showSearchBar = onSearchChange || onFilterPress || onSortPress;

  const renderListHeader = () => (
    <>
      {showSearchBar && (
        <>
          <View style={styles.searchContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={onSearchChange || (() => {})}
              onFilterPress={onFilterPress}
              onSortPress={onSortPress}
              activeFilters={activeFilters}
            />
          </View>
          <Spacer size="sm" />
        </>
      )}
      {listHeader}
    </>
  );

  const renderListFooter = () => (
    <>
      {listFooter}
      {loadingMore && hasMore && (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={colors.tint} />
          <Spacer size="xs" />
          <Text size="sm" color="secondary">
            Loading more...
          </Text>
        </View>
      )}
      {!hasMore && data.length > 0 && (
        <View style={styles.endOfList}>
          <Text size="sm" color="secondary" align="center">
            End of list
          </Text>
        </View>
      )}
    </>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Spacer size="md" />
          <Text color="secondary">Loading...</Text>
        </View>
      );
    }

    if (emptyComponent) {
      return <View style={styles.emptyContainer}>{emptyComponent}</View>;
    }

    return (
      <View style={styles.centerContent}>
        <Text variant="heading" size="lg" color="secondary" align="center">
          {emptyMessage}
        </Text>
      </View>
    );
  };

  const renderItemSeparator = () => {
    if (itemSeparator) {
      return <>{itemSeparator}</>;
    }
    return <Spacer size="sm" />;
  };

  const handleEndReached = () => {
    if (onLoadMore && hasMore && !loadingMore && !loading) {
      onLoadMore();
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      {...props}
    >
      {header && <PageHeader {...header} />}

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          data.length === 0 && styles.listContentEmpty,
        ]}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={renderItemSeparator}
        refreshControl={
          refreshable && onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
              colors={[colors.tint]}
            />
          ) : undefined
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: tokens.spacing.md,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  searchContainer: {
    marginHorizontal: -tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: tokens.spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingMore: {
    padding: tokens.spacing.lg,
    alignItems: "center",
  },
  endOfList: {
    padding: tokens.spacing.lg,
    alignItems: "center",
  },
});
