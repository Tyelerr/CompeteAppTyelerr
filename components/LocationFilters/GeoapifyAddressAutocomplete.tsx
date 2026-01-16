import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { BasePaddingsMargins, BaseColors } from '../../hooks/Template';
import GeoapifyService, {
  GeoapifyAutocompleteResult,
} from '../../ApiSupabase/GeoapifyService';

interface GeoapifyAddressAutocompleteProps {
  placeholder?: string;
  label?: string;
  value?: string;
  onAddressSelect: (address: GeoapifyAutocompleteResult) => void;
  onTextChange?: (text: string) => void;
  countryCode?: string;
  bias?: { lat: number; lon: number };
  style?: any;
  disabled?: boolean;
}

export default function GeoapifyAddressAutocomplete({
  placeholder = 'Enter address...',
  label,
  value = '',
  onAddressSelect,
  onTextChange,
  countryCode = 'us',
  bias,
  style,
  disabled = false,
}: GeoapifyAddressAutocompleteProps) {
  const [inputText, setInputText] = useState(value);
  const [suggestions, setSuggestions] = useState<GeoapifyAutocompleteResult[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update input text when value prop changes
  useEffect(() => {
    setInputText(value);
  }, [value]);

  const handleTextChange = (text: string) => {
    setInputText(text);
    onTextChange?.(text);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Hide suggestions if text is too short
    if (text.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce the API call
    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await GeoapifyService.autocomplete(text, {
          limit: 5,
          countryCode,
          bias,
        });
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce
  };

  const handleSuggestionSelect = (suggestion: GeoapifyAutocompleteResult) => {
    setInputText(suggestion.formatted);
    setSuggestions([]);
    setShowSuggestions(false);
    onAddressSelect(suggestion);
  };

  const renderSuggestion = ({ item }: { item: GeoapifyAutocompleteResult }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item)}
    >
      <Text style={styles.suggestionText} numberOfLines={2}>
        {item.formatted}
      </Text>
      {item.city && item.state && (
        <Text style={styles.suggestionSubtext}>
          {item.city}, {item.state}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.textInput, disabled && styles.disabledInput]}
          placeholder={placeholder}
          value={inputText}
          onChangeText={handleTextChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          editable={!disabled}
          autoCapitalize="words"
          autoCorrect={false}
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={BaseColors.primary} />
          </View>
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `${item.place_id || index}`}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: BasePaddingsMargins.formInputMarginLess,
    zIndex: 1000, // Ensure suggestions appear above other elements
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: BaseColors.title,
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: BaseColors.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: BaseColors.light,
    color: BaseColors.dark,
  },
  disabledInput: {
    backgroundColor: BaseColors.secondary,
    color: BaseColors.othertexts,
  },
  loadingContainer: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: BaseColors.light,
    borderWidth: 1,
    borderColor: BaseColors.secondary,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    zIndex: 1001,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BaseColors.secondary,
  },
  suggestionText: {
    fontSize: 16,
    color: BaseColors.dark,
    fontWeight: '500',
  },
  suggestionSubtext: {
    fontSize: 14,
    color: BaseColors.othertexts,
    marginTop: 2,
  },
});
