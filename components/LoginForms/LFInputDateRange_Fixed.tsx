import React from 'react';
import LFInputDateRangeCalendar from './LFInputDateRangeCalendar';
import { BasePaddingsMargins } from '../../hooks/Template';

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
  return (
    <LFInputDateRangeCalendar
      label={label}
      dateFrom={dateFrom}
      dateTo={dateTo}
      onDateFromChange={onDateFromChange}
      onDateToChange={onDateToChange}
      marginBottomInit={marginBottomInit}
      placeholder={placeholder}
    />
  );
}
