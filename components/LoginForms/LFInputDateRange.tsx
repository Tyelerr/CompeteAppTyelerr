import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';

interface LFInputDateRangeProps {
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

export default function LFInputDateRange({
  label,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  marginBottomInit = BasePaddingsMargins.formInputMarginLess,
  placeholder = { from: 'From Date', to: 'To Date' },
}: LFInputDateRangeProps): React.ReactElement {
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [selectedFromDate, setSelectedFromDate] = useState(
    dateFrom ? new Date(dateFrom) : new Date(),
  );
  const [selectedToDate, setSelectedToDate] = useState(
    dateTo ? new Date(dateTo) : new Date(),
  );

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateForStorage = (date: Date): string => {
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  };

  const handleFromDateChange = (event: any, date?: Date) => {
    console.log('From date change event:', event, date);
    if (Platform.OS === 'android') {
      setShowFromPicker(false);
    }
    if (date) {
      setSelectedFromDate(date);
      onDateFromChange(formatDateForStorage(date));
    }
  };

  const handleToDateChange = (event: any, date?: Date) => {
    console.log('To date change event:', event, date);
    if (Platform.OS === 'android') {
      setShowToPicker(false);
    }
    if (date) {
      setSelectedToDate(date);
      onDateToChange(formatDateForStorage(date));
    }
  };

  const clearFromDate = () => {
    onDateFromChange('');
  };

  const clearToDate = () => {
    onDateToChange('');
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
          <TouchableOpacity
            onPress={() => setShowFromPicker(true)}
            style={{
              backgroundColor: BaseColors.secondary,
              borderRadius: 8,
              padding: 15,
              borderWidth: 1,
              borderColor: BaseColors.othertexts,
              flexDirection: 'row',
              justifyContent: 'space-between',
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
            <Text
              style={{
                color: dateFrom ? BaseColors.light : BaseColors.othertexts,
                fontSize: TextsSizes.p,
              }}
            >
              {dateFrom ? formatDate(selectedFromDate) : placeholder.from}
            </Text>
            {dateFrom && (
              <TouchableOpacity
                onPress={clearFromDate}
                style={{
                  padding: 5,
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
          </TouchableOpacity>
        </View>

        {/* To Date */}
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            onPress={() => setShowToPicker(true)}
            style={{
              backgroundColor: BaseColors.secondary,
              borderRadius: 8,
              padding: 15,
              borderWidth: 1,
              borderColor: BaseColors.othertexts,
              flexDirection: 'row',
              justifyContent: 'space-between',
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
            <Text
              style={{
                color: dateTo ? BaseColors.light : BaseColors.othertexts,
                fontSize: TextsSizes.p,
              }}
            >
              {dateTo ? formatDate(selectedToDate) : placeholder.to}
            </Text>
            {dateTo && (
              <TouchableOpacity
                onPress={clearToDate}
                style={{
                  padding: 5,
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
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar Modal for From Date */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFromPicker}
        onRequestClose={() => setShowFromPicker(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <View
            style={{
              backgroundColor: BaseColors.dark,
              borderRadius: 12,
              padding: 20,
              margin: 20,
              shadowColor: BaseColors.light,
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text
              style={{
                color: BaseColors.light,
                fontSize: TextsSizes.h4,
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              Select From Date
            </Text>
            <DateTimePicker
              value={selectedFromDate}
              mode="date"
              display="calendar"
              onChange={handleFromDateChange}
              minimumDate={new Date()}
              maximumDate={dateTo ? new Date(dateTo) : undefined}
            />
            <TouchableOpacity
              onPress={() => setShowFromPicker(false)}
              style={{
                backgroundColor: BaseColors.secondary,
                borderRadius: 8,
                padding: 12,
                marginTop: 15,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: BaseColors.light,
                  fontSize: TextsSizes.p,
                  fontWeight: 'bold',
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Calendar Modal for To Date */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showToPicker}
        onRequestClose={() => setShowToPicker(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <View
            style={{
              backgroundColor: BaseColors.dark,
              borderRadius: 12,
              padding: 20,
              margin: 20,
              shadowColor: BaseColors.light,
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text
              style={{
                color: BaseColors.light,
                fontSize: TextsSizes.h4,
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              Select To Date
            </Text>
            <DateTimePicker
              value={selectedToDate}
              mode="date"
              display="calendar"
              onChange={handleToDateChange}
              minimumDate={dateFrom ? new Date(dateFrom) : new Date()}
            />
            <TouchableOpacity
              onPress={() => setShowToPicker(false)}
              style={{
                backgroundColor: BaseColors.secondary,
                borderRadius: 8,
                padding: 12,
                marginTop: 15,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: BaseColors.light,
                  fontSize: TextsSizes.p,
                  fontWeight: 'bold',
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Helper Text */}
      {(dateFrom || dateTo) && (
        <Text
          style={{
            color: BaseColors.othertexts,
            fontSize: TextsSizes.small,
            marginTop: BasePaddingsMargins.m5,
            textAlign: 'center',
          }}
        >
          {dateFrom && dateTo
            ? `Showing tournaments from ${formatDate(
                selectedFromDate,
              )} to ${formatDate(selectedToDate)}`
            : dateFrom
            ? `Showing tournaments from ${formatDate(selectedFromDate)} onwards`
            : `Showing tournaments until ${formatDate(selectedToDate)}`}
        </Text>
      )}
    </View>
  );
}
