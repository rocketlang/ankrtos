'use client';

import { useState, useEffect } from 'react';

export function useLiveIndicator(subscriptionData: unknown) {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (subscriptionData) {
      setIsLive(true);
      const timer = setTimeout(() => setIsLive(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [subscriptionData]);

  return isLive;
}
