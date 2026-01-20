
'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  count: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function StarRating({ count, value, onChange, disabled = false }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);

  return (
    <div className={cn("flex items-center gap-1", disabled && "opacity-70 cursor-not-allowed")}>
      {Array.from({ length: count }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'h-5 w-5 transition-colors',
            !disabled && 'cursor-pointer',
            (hoverValue !== undefined ? hoverValue > i : value > i) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          )}
          onClick={() => !disabled && onChange(i + 1)}
          onMouseEnter={() => !disabled && setHoverValue(i + 1)}
          onMouseLeave={() => !disabled && setHoverValue(undefined)}
        />
      ))}
    </div>
  );
}
