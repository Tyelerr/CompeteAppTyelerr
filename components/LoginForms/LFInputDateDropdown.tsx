import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import LFInput from './LFInput';

interface LFInputDateDropdownProps {
  label: string;
  value?: string;
  onDateChange: (date: string) => void;
  placeholder?: string;
  marginBottomInit?: number;
  minimumDate?: Date;
  maximumDate?: Date;
  hasError?: boolean;
}

export default function LFInputDateDropdown({
  label,
  value,
  onDateChange,
  placeholder = 'Select Date',
  marginBottomInit = BasePaddingsMargins.formInputMarginLess,
  minimumDate,
  maximumDate,
  hasError = false,
}: LFInputDateDropdownProps): React.ReactElement {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Parse initial value if provided
  useEffect(() => {
    if (value && value.trim() !== '') {
      const parts = value.split('-');
      if (parts.length === 3) {
        setSelectedYear(parts[0]);
        setSelectedMonth(parts[1]);
        setSelectedDay(parts[2]);
      }
    }
  }, [value]);

  // Month options
  const monthOptions = [
    { label: 'January', value: '01' },
    { label: 'February', value: '02' },
    { label: 'March', value: '03' },
    { label: 'April', value: '04' },
    { label: 'May', value: '05' },
    { label: 'June', value: '06' },
    { label: 'July', value: '07' },
    { label: 'August', value: '08' },
    { label: 'September', value: '09' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' },
  ];

  // Generate year options (from 1900 to current year)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const minYear = minimumDate ? minimumDate.getFullYear() : 1900;
    const maxYear = maximumDate ? maximumDate.getFullYear() : currentYear;

    const years = [];
    for (let year = maxYear; year >= minYear; year--) {
      years.push({ label: year.toString(), value: year.toString() });
    }
    return years;
  };

  // Get days in month (accounting for leap years)
  const getDaysInMonth = (month: string, year: string): number => {
    if (!month || !year) return 31;
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    return new Date(yearNum, monthNum, 0).getDate();
  };

  // Generate day options based on selected month and year
  const generateDayOptions = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day.toString().padStart(2, '0');
      days.push({ label: day.toString(), value: dayStr });
    }
    return days;
  };

  // Update date when any dropdown changes
  const updateDate = (month: string, day: string, year: string) => {
    if (month && day && year) {
      // Validate the date is within bounds
      const dateStr = `${year}-${month}-${day}`;
      const date = new Date(dateStr);

      if (minimumDate && date < minimumDate) {
        return;
      }
      if (maximumDate && date > maximumDate) {
        return;
      }

      onDateChange(dateStr);
    } else {
      onDateChange('');
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);

    // Adjust day if current day is invalid for new month
    if (selectedDay && selectedYear) {
      const daysInNewMonth = getDaysInMonth(month, selectedYear);
      const currentDay = parseInt(selectedDay, 10);
      if (currentDay > daysInNewMonth) {
        const newDay = daysInNewMonth.toString().padStart(2, '0');
        setSelectedDay(newDay);
        updateDate(month, newDay, selectedYear);
      } else {
        updateDate(month, selectedDay, selectedYear);
      }
    }
  };

  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    updateDate(selectedMonth, day, selectedYear);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);

    // Adjust day if current day is invalid for new year (e.g., Feb 29 in non-leap year)
    if (selectedDay && selectedMonth) {
      const daysInNewMonth = getDaysInMonth(selectedMonth, year);
      const currentDay = parseInt(selectedDay, 10);
      if (currentDay > daysInNewMonth) {
        const newDay = daysInNewMonth.toString().padStart(2, '0');
        setSelectedDay(newDay);
        updateDate(selectedMonth, newDay, year);
      } else {
        updateDate(selectedMonth, selectedDay, year);
      }
    }
  };

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

      {/* Dropdowns Container */}
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          borderWidth: hasError ? 1 : 0,
          borderColor: hasError ? '#ff6b6b' : 'transparent',
          borderRadius: 8,
          padding: hasError ? 4 : 0,
        }}
      >
        {/* Month Dropdown */}
        <View style={{ flex: 2 }}>
          <LFInput
            typeInput="dropdown"
            placeholder="Month"
            items={monthOptions}
            value={selectedMonth}
            onChangeText={handleMonthChange}
            marginBottomInit={0}
          />
        </View>

        {/* Day Dropdown */}
        <View style={{ flex: 1 }}>
          <LFInput
            typeInput="dropdown"
            placeholder="Day"
            items={generateDayOptions()}
            value={selectedDay}
            onChangeText={handleDayChange}
            marginBottomInit={0}
          />
        </View>

        {/* Year Dropdown */}
        <View style={{ flex: 1.5 }}>
          <LFInput
            typeInput="dropdown"
            placeholder="Year"
            items={generateYearOptions()}
            value={selectedYear}
            onChangeText={handleYearChange}
            marginBottomInit={0}
          />
        </View>
      </View>
    </View>
  );
}
