'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

/**
 * Props pentru componenta DatePicker.
 */
interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Componentă DatePicker pentru selecția datei Trial Balance.
 * 
 * Utilizează shadcn/ui Calendar cu react-day-picker și date-fns pentru localizare în română.
 * 
 * @example
 * ```tsx
 * <DatePicker 
 *   date={selectedDate}
 *   onDateChange={(date) => setSelectedDate(date)}
 *   placeholder="Selectează data balanței"
 * />
 * ```
 */
export function DatePicker({
  date,
  onDateChange,
  disabled = false,
  placeholder = 'Selectează data',
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, 'dd MMMM yyyy', { locale: ro })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          disabled={disabled}
          initialFocus
          locale={ro}
        />
      </PopoverContent>
    </Popover>
  );
}
