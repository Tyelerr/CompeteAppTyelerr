import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import { StyleZ } from '../../assets/css/styles';

interface LFDaysOfTheWeekProps {
  /**
   * Optional: Style for the main container View.
   */
  containerStyle?: object;
  /**
   * Optional: Style for each individual day Text component.
   */
  dayTextStyle?: object;
  /**
   * Optional: Style for the active/current day Text component.
   */
  activeDayTextStyle?: object;
  /**
   * Optional: The index of the active day (0 for Monday, 1 for Tuesday, etc.).
   * If provided, that day will have activeDayTextStyle applied.
   */
  activeDayIndex?: number;
  /**
   * Optional: Callback function when a day is pressed.
   * Receives the day's letter (e.g., 'M') and its index (0-6).
   */
  onDayPress?: (dayLetter: string, index: number) => void;

  /**
   * Callback to set selected days (0-based indexing: 0=Monday, 6=Sunday)
   */
  set_selectedDaysOut?: (daysIndexes: number[]) => void;
  /**
   * Array of selected day indices (0-based indexing: 0=Monday, 6=Sunday)
   */
  selectedDaysOut?: number[];
}

const LFDaysOfTheWeek: React.FC<LFDaysOfTheWeekProps> = ({
  containerStyle,
  dayTextStyle,
  activeDayTextStyle,
  activeDayIndex,
  onDayPress,
  set_selectedDaysOut,
  selectedDaysOut,
}) => {
  // Array of abbreviations for days of the week, starting from Monday
  // Index 0 = Monday, Index 1 = Tuesday, ..., Index 6 = Sunday
  const days = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su']; // Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday

  // Use 0-based indexing consistently (0=Monday, 6=Sunday)
  const [selectedDays, set_selectedDays] = useState<number[]>(
    selectedDaysOut || [],
  );

  // Sync local state with props when props change
  useEffect(() => {
    if (selectedDaysOut !== undefined) {
      set_selectedDays(selectedDaysOut);
    }
  }, [selectedDaysOut]);

  // Get current selected days - prioritize props over local state
  const getCurrentSelectedDays = (): number[] => {
    return selectedDaysOut !== undefined ? selectedDaysOut : selectedDays;
  };

  // Handle day selection/deselection
  const handleDayPress = (dayLetter: string, dayIndex: number) => {
    // Call optional onDayPress callback
    if (onDayPress !== undefined) {
      onDayPress(dayLetter, dayIndex);
    }

    const currentSelected = getCurrentSelectedDays();
    let newSelected: number[];

    if (currentSelected.includes(dayIndex)) {
      // Day is selected, remove it
      newSelected = currentSelected.filter((day) => day !== dayIndex);
    } else {
      // Day is not selected, add it
      newSelected = [...currentSelected, dayIndex];
    }

    // Update local state
    set_selectedDays(newSelected);

    // Update parent component
    if (set_selectedDaysOut !== undefined) {
      set_selectedDaysOut(newSelected);
    }
  };

  return (
    <View
      style={[
        {
          marginBottom: BasePaddingsMargins.loginFormInputHolderMargin,
        },
      ]}
    >
      <Text style={StyleZ.loginFormInputLabel}>Days of Week</Text>
      <View style={[stylesLocalDaysOfWeek.container, containerStyle]}>
        {days.map((day, index) => {
          const isSelected = getCurrentSelectedDays().includes(index);

          return (
            <TouchableOpacity
              key={index}
              style={[
                stylesLocalDaysOfWeek.touchableDay,
                isSelected && stylesLocalDaysOfWeek.activeDayText,
              ]}
              onPress={() => handleDayPress(day, index)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  stylesLocalDaysOfWeek.dayText,
                  dayTextStyle,
                  isSelected && stylesLocalDaysOfWeek.activeDayText,
                  {
                    backgroundColor: 'transparent',
                  },
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const stylesLocalDaysOfWeek = StyleSheet.create({
  container: {
    flexDirection: 'row', // Arrange days horizontally
    justifyContent: 'space-between', // Distribute space evenly
    alignItems: 'center',
    width: '100%', // Take full width of parent
    // paddingVertical: 10,
    backgroundColor: BaseColors.dark,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  touchableDay: {
    // This style ensures the touchable area is consistent
    width: 30, // Fixed width for each day to ensure even spacing
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'solid',
    borderColor: BaseColors.othertexts,
    borderWidth: 1,
    borderRadius: 5,
    paddingBlock: BasePaddingsMargins.m5,
  },
  dayText: {
    fontSize: TextsSizes.small,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  activeDayText: {
    color: BaseColors.light, // Default active color (blue)
    backgroundColor: BaseColors.primary,
    fontWeight: '900',
    // You can add more styles here for active day, e.g., underline, background
  },
});

export default LFDaysOfTheWeek;
