import React, { useState } from 'react';
import { View, Text } from 'react-native';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import LFInputDateCalendar from './LFInputDateCalendar';

interface LFInputDateRangeCalendarProps {
  label: string;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  marginBottomInit?: number;
  placeholder?: {
    from: string;
    to: string;
  };
}

export default function LFInputDateRangeCalendar({
  label,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  marginBottomInit = BasePaddingsMargins.formInputMarginLess,
  placeholder = { from: 'From Date', to: 'To Date' },
}: LFInputDateRangeCalendarProps): React.ReactElement {
  const [fromDate, setFromDate] = useState(dateFrom || '');
  const [toDate, setToDate] = useState(dateTo || '');

  const handleFromDateChange = (date: string) => {
    setFromDate(date);
    onDateFromChange(date);
  };

  const handleToDateChange = (date: string) => {
    setToDate(date);
    onDateToChange(date);
  };

  const formatDate = (isoDate: string): string => {
    if (!isoDate) return '';

    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoDate;
    }
  };

  // Create minimum and maximum dates for validation
  const minimumFromDate = new Date(); // Today
  const maximumFromDate = toDate ? new Date(toDate) : undefined;
  const minimumToDate = fromDate ? new Date(fromDate) : new Date();

  return (
    <View style={{ marginBottom: marginBottomInit }}>
      {/* Main Label */}
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

      {/* Date Range Container */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        {/* From Date */}
        <View style={{ flex: 1 }}>
          <LFInputDateCalendar
            label=""
            value={fromDate}
            onDateChange={handleFromDateChange}
            placeholder={placeholder.from}
            marginBottomInit={0}
            minimumDate={minimumFromDate}
            maximumDate={maximumFromDate}
          />
        </View>

        {/* To Date */}
        <View style={{ flex: 1 }}>
          <LFInputDateCalendar
            label=""
            value={toDate}
            onDateChange={handleToDateChange}
            placeholder={placeholder.to}
            marginBottomInit={0}
            minimumDate={minimumToDate}
          />
        </View>
      </View>

      {/* Helper Text */}
      {(fromDate || toDate) && (
        <Text
          style={{
            color: BaseColors.othertexts,
            fontSize: TextsSizes.small,
            marginTop: BasePaddingsMargins.m5,
            textAlign: 'center',
          }}
        >
          {fromDate && toDate
            ? `Showing tournaments from ${formatDate(fromDate)} to ${formatDate(
                toDate,
              )}`
            : fromDate
            ? `Showing tournaments from ${formatDate(fromDate)} onwards`
            : `Showing tournaments until ${formatDate(toDate)}`}
        </Text>
      )}
    </View>
  );
}
