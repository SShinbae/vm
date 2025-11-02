import { useColorScheme } from '@/hooks/use-color-scheme';
import { Icon } from '@/lib/design-system/components/atoms/Icon';
import { theme } from '@/lib/design-system/theme';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useStyles } from 'react-native-unistyles';
import { stylesheet } from './SearchBar.styles';
import { SearchBarProps } from './SearchBar.types';

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onSearch,
  showFilter = false,
  onFilterPress,
  showSort = false,
  onSortPress,
  activeFilters = 0,
  autoFocus = false,
  disabled = false,
  showClear = true,
  leftIcon = 'search',
  fullWidth = true,
}) => {
  const { styles } = useStyles(stylesheet);
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChangeText('');
  };

  const handleSubmit = () => {
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <View style={[styles.container, fullWidth && styles.containerFullWidth]}>
      <View style={styles.searchWrapper}>
        {/* Search Input */}
        <View
          style={[
            styles.searchContainer,
            isFocused && styles.searchContainerFocused,
            disabled && styles.searchContainerDisabled,
          ]}
        >
          <View style={styles.leftIcon}>
            <Icon name={leftIcon} size="sm" color="secondary" />
          </View>

          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoFocus={autoFocus}
            editable={!disabled}
            accessibilityLabel="Search input"
            accessibilityHint="Enter text to search"
          />

          {showClear && value.length > 0 && (
            <Pressable
              onPress={handleClear}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Icon name="close" size="xs" color="secondary" />
            </Pressable>
          )}
        </View>

        {/* Filter Button */}
        {showFilter && (
          <Pressable
            onPress={onFilterPress}
            style={[
              styles.actionButton,
              activeFilters > 0 && styles.actionButtonActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Filter"
            accessibilityHint={`${activeFilters} active filters`}
          >
            <Icon
              name="filter"
              size="sm"
              color={activeFilters > 0 ? 'primary' : 'secondary'}
            />
            {activeFilters > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilters}</Text>
              </View>
            )}
          </Pressable>
        )}

        {/* Sort Button */}
        {showSort && (
          <Pressable
            onPress={onSortPress}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel="Sort"
          >
            <Icon name="sort" size="sm" color="secondary" />
          </Pressable>
        )}
      </View>
    </View>
  );
};
