
'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  count: number;
  value: number;
  onChange: (value: number) => void;
}

export function StarRating({ count, value, onChange }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: count }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'h-5 w-5 cursor-pointer transition-colors',
            (hoverValue || value) > i ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          )}
          onClick={() => onChange(i + 1)}
          onMouseEnter={() => setHoverValue(i + 1)}
          onMouseLeave={() => setHoverValue(undefined)}
        />
      ))}
    </div>
  );
}
