'use client';

import { useState, useEffect } from 'react';
import { formatRelativeDate } from '@/lib/utils';

interface RelativeTimeProps {
  date: string;
  className?: string;
}

export default function RelativeTime({ date, className = '' }: RelativeTimeProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show absolute date on server, relative on client
  if (!isClient) {
    const dateObj = new Date(date);
    return (
      <span className={className}>
        {dateObj.toLocaleDateString('it-IT', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    );
  }

  return <span className={className}>{formatRelativeDate(date)}</span>;
}
