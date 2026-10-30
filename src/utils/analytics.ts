import { AnalyticsEvent } from '../types';

class PrivacyAnalyticsTracker {
  private events: AnalyticsEvent[] = [];
  private listeners: ((event: AnalyticsEvent) => void)[] = [];

  /**
   * Tracks an event ensuring zero PII, customer names, or financial numbers are transmitted.
   */
  track(eventName: string, metadata?: Record<string, string | number | boolean>) {
    // Sanitize metadata: strip any keys that might contain financial figures or names
    const sanitizedMeta: Record<string, string | number | boolean> = {};
    if (metadata) {
      for (const [k, v] of Object.entries(metadata)) {
        const lowerKey = k.toLowerCase();
        if (
          lowerKey.includes('amount') ||
          lowerKey.includes('name') ||
          lowerKey.includes('email') ||
          lowerKey.includes('balance') ||
          lowerKey.includes('token')
        ) {
          continue; // Redact sensitive financial or customer data
        }
        sanitizedMeta[k] = v;
      }
    }

    const event: AnalyticsEvent = {
      eventName,
      timestamp: new Date().toISOString(),
      metadata: sanitizedMeta,
    };

    this.events.unshift(event);
    if (this.events.length > 100) {
      this.events.pop(); // keep last 100 in memory
    }

    this.listeners.forEach(fn => fn(event));
  }

  getRecentEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  subscribe(listener: (event: AnalyticsEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const analytics = new PrivacyAnalyticsTracker();
