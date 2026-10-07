import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export function getNetworkStatus(): NetworkStatus {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isOnline: true };
  }

  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  return {
    isOnline: navigator.onLine,
    effectiveType: conn?.effectiveType,
    downlink: conn?.downlink,
    rtt: conn?.rtt,
    saveData: conn?.saveData,
  };
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(getNetworkStatus);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateStatus = () => setStatus(getNetworkStatus());

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    const conn = (navigator as any).connection;
    if (conn) {
      conn.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (conn) {
        conn.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  return status;
}
