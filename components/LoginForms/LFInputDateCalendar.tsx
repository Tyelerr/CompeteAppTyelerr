import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';

type ViewMode = 'day' | 'month' | 'year';

interface LFInputDateCalendarProps {
  label: string;
  value?: string;
  onDateChange: (date: string) => void;
  placeholder?: string;
  marginBottomInit?: number;
  minimumDate?: Date;
  maximumDate?: Date;
}

export default function LFInputDateCalendar({
  label,
  value,
  onDateChange,
  placeholder = 'Select Date',
  marginBottomInit = BasePaddingsMargins.formInputMarginLess,
  minimumDate,
  maximumDate,
}: LFInputDateCalendarProps): React.ReactElement {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null,
  );
  const [viewMode, setViewMode] = useState<ViewMode>('day');

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

  const clearDate = () => {
    setSelectedDate(null);
    onDateChange('');
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onDateChange(formatDateForStorage(date));
    setShowCalendar(false);
  };

  // Calendar generation logic
  const generateCalendar = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const calendar = [];
    const current = new Date(startDate);

    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        weekDays.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      calendar.push(weekDays);
      if (current > lastDay && current.getDay() === 0) break;
    }

    return calendar;
  };

  const CalendarModal = () => {
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
    const [viewYear, setViewYear] = useState(currentDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(currentDate.getMonth());
    const [decadeStart, setDecadeStart] = useState(
      Math.floor(currentDate.getFullYear() / 12) * 12,
    );

    const calendar = generateCalendar(viewYear, viewMonth);
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const monthNamesShort = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const isDateDisabled = (date: Date) => {
      if (minimumDate && date < minimumDate) return true;
      if (maximumDate && date > maximumDate) return true;
      return false;
    };

    const isSelectedDate = (date: Date) => {
      return (
        selectedDate &&
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      );
    };

    const isCurrentMonth = (date: Date) => {
      return date.getMonth() === viewMonth;
    };

    const goToPreviousMonth = () => {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear(viewYear - 1);
      } else {
        setViewMonth(viewMonth - 1);
      }
    };

    const goToNextMonth = () => {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear(viewYear + 1);
      } else {
        setViewMonth(viewMonth + 1);
      }
    };

    const goToPreviousDecade = () => {
      setDecadeStart(decadeStart - 12);
    };

    const goToNextDecade = () => {
      setDecadeStart(decadeStart + 12);
    };

    const handleYearSelect = (year: number) => {
      setViewYear(year);
      setViewMode('month');
    };

    const handleMonthSelect = (month: number) => {
      setViewMonth(month);
      setViewMode('day');
    };

    const handleHeaderYearClick = () => {
      setDecadeStart(Math.floor(viewYear / 12) * 12);
      setViewMode('year');
    };

    const handleHeaderMonthClick = () => {
      setViewMode('month');
    };

    // Generate year grid (12 years)
    const generateYearGrid = () => {
      const years = [];
      for (let i = 0; i < 12; i++) {
        years.push(decadeStart + i);
      }
      return years;
    };

    const isYearDisabled = (year: number) => {
      if (minimumDate && year < minimumDate.getFullYear()) return true;
      if (maximumDate && year > maximumDate.getFullYear()) return true;
      return false;
    };

    const isMonthDisabled = (month: number) => {
      if (minimumDate) {
        const minYear = minimumDate.getFullYear();
        const minMonth = minimumDate.getMonth();
        if (viewYear < minYear || (viewYear === minYear && month < minMonth)) {
          return true;
        }
      }
      if (maximumDate) {
        const maxYear = maximumDate.getFullYear();
        const maxMonth = maximumDate.getMonth();
        if (viewYear > maxYear || (viewYear === maxYear && month > maxMonth)) {
          return true;
        }
      }
      return false;
    };

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCalendar}
        onRequestClose={() => setShowCalendar(false)}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000000',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <View
            style={{
              backgroundColor: '#000000',
              borderRadius: 12,
              padding: 20,
              margin: 20,
              width: '90%',
              maxWidth: 350,
              borderWidth: 1,
              borderColor: BaseColors.othertexts,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <TouchableOpacity
                onPress={
                  viewMode === 'year'
                    ? goToPreviousDecade
                    : viewMode === 'month'
                    ? () => setViewYear(viewYear - 1)
                    : goToPreviousMonth
                }
              >
                <Text
                  style={{
                    color: BaseColors.primary,
                    fontSize: 24,
                    fontWeight: 'bold',
                  }}
                >
                  ‹
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {viewMode === 'day' && (
                  <>
                    <TouchableOpacity onPress={handleHeaderMonthClick}>
                      <Text
                        style={{
                          color: BaseColors.primary,
                          fontSize: TextsSizes.h4,
                          fontWeight: 'bold',
                          textDecorationLine: 'underline',
                        }}
                      >
                        {monthNames[viewMonth]}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleHeaderYearClick}>
                      <Text
                        style={{
                          color: BaseColors.primary,
                          fontSize: TextsSizes.h4,
                          fontWeight: 'bold',
                          textDecorationLine: 'underline',
                        }}
                      >
                        {viewYear}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                {viewMode === 'month' && (
                  <TouchableOpacity onPress={handleHeaderYearClick}>
                    <Text
                      style={{
                        color: BaseColors.primary,
                        fontSize: TextsSizes.h4,
                        fontWeight: 'bold',
                        textDecorationLine: 'underline',
                      }}
                    >
                      {viewYear}
                    </Text>
                  </TouchableOpacity>
                )}
                {viewMode === 'year' && (
                  <Text
                    style={{
                      color: BaseColors.light,
                      fontSize: TextsSizes.h4,
                      fontWeight: 'bold',
                    }}
                  >
                    {decadeStart} - {decadeStart + 11}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={
                  viewMode === 'year'
                    ? goToNextDecade
                    : viewMode === 'month'
                    ? () => setViewYear(viewYear + 1)
                    : goToNextMonth
                }
              >
                <Text
                  style={{
                    color: BaseColors.primary,
                    fontSize: 24,
                    fontWeight: 'bold',
                  }}
                >
                  ›
                </Text>
              </TouchableOpacity>
            </View>

            {/* Year Grid View */}
            {viewMode === 'year' && (
              <View>
                {[0, 1, 2].map((rowIndex) => (
                  <View
                    key={rowIndex}
                    style={{
                      flexDirection: 'row',
                      marginBottom: 8,
                    }}
                  >
                    {[0, 1, 2, 3].map((colIndex) => {
                      const yearIndex = rowIndex * 4 + colIndex;
                      const year = decadeStart + yearIndex;
                      const disabled = isYearDisabled(year);
                      const isCurrentYear = year === new Date().getFullYear();
                      const isSelected =
                        selectedDate && year === selectedDate.getFullYear();

                      return (
                        <TouchableOpacity
                          key={colIndex}
                          onPress={() => !disabled && handleYearSelect(year)}
                          disabled={disabled}
                          style={{
                            flex: 1,
                            aspectRatio: 1.5,
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: 4,
                            borderRadius: 8,
                            backgroundColor: isSelected
                              ? BaseColors.primary
                              : isCurrentYear
                              ? BaseColors.secondary
                              : 'transparent',
                            borderWidth: 1,
                            borderColor: disabled
                              ? 'transparent'
                              : BaseColors.othertexts + '40',
                          }}
                        >
                          <Text
                            style={{
                              color: disabled
                                ? BaseColors.othertexts + '40'
                                : isSelected
                                ? BaseColors.light
                                : BaseColors.light,
                              fontSize: TextsSizes.p,
                              fontWeight: isSelected ? 'bold' : 'normal',
                            }}
                          >
                            {year}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}

            {/* Month Grid View */}
            {viewMode === 'month' && (
              <View>
                {[0, 1, 2].map((rowIndex) => (
                  <View
                    key={rowIndex}
                    style={{
                      flexDirection: 'row',
                      marginBottom: 8,
                    }}
                  >
                    {[0, 1, 2, 3].map((colIndex) => {
                      const monthIndex = rowIndex * 4 + colIndex;
                      const disabled = isMonthDisabled(monthIndex);
                      const isCurrentMonth =
                        monthIndex === new Date().getMonth() &&
                        viewYear === new Date().getFullYear();
                      const isSelected =
                        selectedDate &&
                        monthIndex === selectedDate.getMonth() &&
                        viewYear === selectedDate.getFullYear();

                      return (
                        <TouchableOpacity
                          key={colIndex}
                          onPress={() =>
                            !disabled && handleMonthSelect(monthIndex)
                          }
                          disabled={disabled}
                          style={{
                            flex: 1,
                            aspectRatio: 1.5,
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: 4,
                            borderRadius: 8,
                            backgroundColor: isSelected
                              ? BaseColors.primary
                              : isCurrentMonth
                              ? BaseColors.secondary
                              : 'transparent',
                            borderWidth: 1,
                            borderColor: disabled
                              ? 'transparent'
                              : BaseColors.othertexts + '40',
                          }}
                        >
                          <Text
                            style={{
                              color: disabled
                                ? BaseColors.othertexts + '40'
                                : isSelected
                                ? BaseColors.light
                                : BaseColors.light,
                              fontSize: TextsSizes.p,
                              fontWeight: isSelected ? 'bold' : 'normal',
                            }}
                          >
                            {monthNamesShort[monthIndex]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}

            {/* Day Grid View */}
            {viewMode === 'day' && (
              <>
                {/* Day headers */}
                <View
                  style={{
                    flexDirection: 'row',
                    marginBottom: 10,
                  }}
                >
                  {dayNames.map((day) => (
                    <View
                      key={day}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 5,
                      }}
                    >
                      <Text
                        style={{
                          color: BaseColors.othertexts,
                          fontSize: TextsSizes.small,
                          fontWeight: 'bold',
                        }}
                      >
                        {day}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Calendar grid */}
                {calendar.map((week, weekIndex) => (
                  <View
                    key={weekIndex}
                    style={{
                      flexDirection: 'row',
                    }}
                  >
                    {week.map((date, dayIndex) => {
                      const disabled = isDateDisabled(date);
                      const selected = isSelectedDate(date);
                      const currentMonth = isCurrentMonth(date);

                      return (
                        <TouchableOpacity
                          key={dayIndex}
                          onPress={() => !disabled && handleDateSelect(date)}
                          disabled={disabled}
                          style={{
                            flex: 1,
                            aspectRatio: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: 1,
                            borderRadius: 6,
                            backgroundColor: selected
                              ? BaseColors.primary
                              : 'transparent',
                          }}
                        >
                          <Text
                            style={{
                              color: disabled
                                ? BaseColors.othertexts + '40'
                                : selected
                                ? BaseColors.light
                                : currentMonth
                                ? BaseColors.light
                                : BaseColors.othertexts,
                              fontSize: TextsSizes.p,
                              fontWeight: selected ? 'bold' : 'normal',
                            }}
                          >
                            {date.getDate()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </>
            )}

            {/* Footer buttons */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 20,
                gap: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowCalendar(false);
                  setViewMode('day');
                }}
                style={{
                  flex: 1,
                  backgroundColor: BaseColors.secondary,
                  borderRadius: 8,
                  padding: 12,
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

              {selectedDate && (
                <TouchableOpacity
                  onPress={clearDate}
                  style={{
                    flex: 1,
                    backgroundColor: BaseColors.othertexts,
                    borderRadius: 8,
                    padding: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: BaseColors.dark,
                      fontSize: TextsSizes.p,
                      fontWeight: 'bold',
                    }}
                  >
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
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

      {/* Date Input Button */}
      <TouchableOpacity
        onPress={() => setShowCalendar(true)}
        style={{
          backgroundColor: BaseColors.secondary,
          borderRadius: 8,
          padding: 15,
          borderWidth: 1,
          borderColor: BaseColors.othertexts,
          justifyContent: 'center',
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
            color: selectedDate ? BaseColors.light : BaseColors.othertexts,
            fontSize: TextsSizes.p,
            textAlign: 'center',
          }}
        >
          {selectedDate ? formatDate(selectedDate) : placeholder}
        </Text>
      </TouchableOpacity>

      {/* Calendar Modal */}
      <CalendarModal />
    </View>
  );
}
