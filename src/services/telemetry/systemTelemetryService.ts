import { useState, useEffect } from 'react';

export interface WebVitalsMetrics {
  ttfbMs: number;
  domNodes: number;
  usedJsHeapBytes?: number;
  totalJsHeapBytes?: number;
  jsHeapLimitBytes?: number;
  healthScore: number;
  status: 'optimal' | 'good' | 'degraded';
}

export function collectSystemTelemetry(): WebVitalsMetrics {
  let ttfbMs = 0;
  if (typeof performance !== 'undefined') {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const nav = navEntries[0] as PerformanceNavigationTiming;
      ttfbMs = Math.round(nav.responseStart - nav.requestStart) || 0;
    }
  }

  const domNodes = typeof document !== 'undefined' ? document.querySelectorAll('*').length : 0;

  let usedJsHeapBytes: number | undefined;
  let totalJsHeapBytes: number | undefined;
  let jsHeapLimitBytes: number | undefined;

  if (typeof performance !== 'undefined' && (performance as any).memory) {
    const mem = (performance as any).memory;
    usedJsHeapBytes = mem.usedJSHeapSize;
    totalJsHeapBytes = mem.totalJSHeapSize;
    jsHeapLimitBytes = mem.jsHeapSizeLimit;
  }

  // Health calculation (0-100)
  let healthScore = 100;

  if (domNodes > 3000) healthScore -= 15;
  else if (domNodes > 1500) healthScore -= 5;

  if (ttfbMs > 500) healthScore -= 15;
  else if (ttfbMs > 200) healthScore -= 5;

  if (usedJsHeapBytes && jsHeapLimitBytes) {
    const memRatio = usedJsHeapBytes / jsHeapLimitBytes;
    if (memRatio > 0.8) healthScore -= 25;
    else if (memRatio > 0.6) healthScore -= 10;
  }

  healthScore = Math.max(10, Math.min(100, healthScore));

  const status: 'optimal' | 'good' | 'degraded' =
    healthScore >= 90 ? 'optimal' : healthScore >= 70 ? 'good' : 'degraded';

  return {
    ttfbMs,
    domNodes,
    usedJsHeapBytes,
    totalJsHeapBytes,
    jsHeapLimitBytes,
    healthScore,
    status,
  };
}

export function useSystemTelemetry(pollIntervalMs = 5000): WebVitalsMetrics {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>(collectSystemTelemetry);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(collectSystemTelemetry());
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [pollIntervalMs]);

  return metrics;
}
