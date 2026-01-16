import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';

interface LFInputDateTextProps {
  label: string;
  value?: string;
  onDateChange: (date: string) => void;
  placeholder?: string;
  marginBottomInit?: number;
  minimumDate?: Date;
  maximumDate?: Date;
}

export default function LFInputDateText({
  label,
  value,
  onDateChange,
  placeholder = 'MM/DD/YYYY',
  marginBottomInit = BasePaddingsMargins.formInputMarginLess,
  minimumDate,
  maximumDate,
}: LFInputDateTextProps): React.ReactElement {
  const [inputValue, setInputValue] = useState(value || '');
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const formatDateInput = (text: string): string => {
    // Remove all non-numeric characters
    const numbers = text.replace(/\D/g, '');

    // Format as MM/DD/YYYY
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(
        4,
        8,
      )}`;
    }
  };

  const validateDate = (dateString: string): boolean => {
    if (!dateString || dateString.length < 10) {
      setErrorMessage('Please enter a complete date');
      return false;
    }

    const parts = dateString.split('/');
    if (parts.length !== 3) {
      setErrorMessage('Invalid date format');
      return false;
    }

    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Basic validation
    if (month < 1 || month > 12) {
      setErrorMessage('Invalid month (1-12)');
      return false;
    }

    if (day < 1 || day > 31) {
      setErrorMessage('Invalid day (1-31)');
      return false;
    }

    if (year < 1900 || year > 2100) {
      setErrorMessage('Invalid year (1900-2100)');
      return false;
    }

    // Create date object for further validation
    const date = new Date(year, month - 1, day);

    // Check if the date is valid (handles leap years, etc.)
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      setErrorMessage('Invalid date');
      return false;
    }

    // Check minimum date
    if (minimumDate && date < minimumDate) {
      setErrorMessage(`Date must be after ${minimumDate.toLocaleDateString()}`);
      return false;
    }

    // Check maximum date
    if (maximumDate && date > maximumDate) {
      setErrorMessage(
        `Date must be before ${maximumDate.toLocaleDateString()}`,
      );
      return false;
    }

    setErrorMessage('');
    return true;
  };

  const handleTextChange = (text: string) => {
    const formatted = formatDateInput(text);
    setInputValue(formatted);

    // Validate when we have a complete date
    if (formatted.length === 10) {
      const valid = validateDate(formatted);
      setIsValid(valid);

      if (valid) {
        // Convert to YYYY-MM-DD format for storage
        const parts = formatted.split('/');
        const isoDate = `${parts[2]}-${parts[0].padStart(
          2,
          '0',
        )}-${parts[1].padStart(2, '0')}`;
        onDateChange(isoDate);
      }
    } else {
      setIsValid(true);
      setErrorMessage('');
    }
  };

  const clearDate = () => {
    setInputValue('');
    setIsValid(true);
    setErrorMessage('');
    onDateChange('');
  };

  const formatDisplayValue = (isoDate: string): string => {
    if (!isoDate) return '';

    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('en-US');
    } catch {
      return isoDate;
    }
  };

  // Use display value if we have a valid ISO date from props
  const displayValue =
    value && !inputValue ? formatDisplayValue(value) : inputValue;

  return (
    <View style={{ marginBottom: marginBottomInit }}>
      {/* Label */}
      <Text
        style={{
          color: BaseColors.light,
          fontSize: TextsSizes.p,
          fontWeight: 'bold',
          marginBottom: BasePaddingsMargins.m10,
        }}
      >
        {label}
      </Text>

      {/* Input Container */}
      <View
        style={{
          backgroundColor: BaseColors.secondary,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: !isValid ? '#ff6b6b' : BaseColors.othertexts,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: BaseColors.light,
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <TextInput
          value={displayValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={BaseColors.othertexts}
          keyboardType="numeric"
          maxLength={10}
          style={{
            flex: 1,
            color: BaseColors.light,
            fontSize: TextsSizes.p,
            padding: 15,
          }}
        />

        {displayValue && (
          <TouchableOpacity
            onPress={clearDate}
            style={{
              padding: 15,
            }}
          >
            <Text
              style={{
                color: BaseColors.othertexts,
                fontSize: TextsSizes.small,
              }}
            >
              ✕
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {!isValid && errorMessage && (
        <Text
          style={{
            color: '#ff6b6b',
            fontSize: TextsSizes.small,
            marginTop: BasePaddingsMargins.m5,
          }}
        >
          {errorMessage}
        </Text>
      )}

      {/* Helper Text */}
      {isValid && displayValue && (
        <Text
          style={{
            color: BaseColors.othertexts,
            fontSize: TextsSizes.small,
            marginTop: BasePaddingsMargins.m5,
          }}
        >
          Format: MM/DD/YYYY
        </Text>
      )}
    </View>
  );
}
