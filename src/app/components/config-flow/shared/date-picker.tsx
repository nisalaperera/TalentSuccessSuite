'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder: string;
}

export function DatePicker({ date, setDate, placeholder }: DatePickerProps) {
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value) {
      // The input value is a string 'YYYY-MM-DD', parseISO will handle it correctly,
      // accounting for the user's timezone in a way that should be consistent.
      const newDate = parseISO(event.target.value);
      setDate(newDate);
    } else {
      setDate(undefined);
    }
  };

  const dateValue = date ? format(date, 'yyyy-MM-dd') : '';

  return (
    <Input
      type="date"
      value={dateValue}
      onChange={handleDateChange}
      placeholder={placeholder}
      className="text-foreground"
    />
  );
}
