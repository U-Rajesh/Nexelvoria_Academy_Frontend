/**
 * Google Analytics Integration Utility (PUB-024)
 * Reads measurement ID from environment: import.meta.env.VITE_GA_TRACKING_ID
 * Does not hardcode credentials. Safely handles missing configuration.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

class AnalyticsService {
  private trackingId: string | undefined;
  private isInitialized = false;

  constructor() {
    this.trackingId = import.meta.env.VITE_GA_TRACKING_ID;
  }

  init(): void {
    if (this.isInitialized || !this.trackingId) {
      if (!this.trackingId && import.meta.env.DEV) {
        console.info('[Analytics] VITE_GA_TRACKING_ID is not configured. Analytics running in dev stub mode.');
      }
      return;
    }

    try {
      // Create script tag for gtag.js
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.trackingId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer?.push(arguments);
      };

      window.gtag('js', new Date());
      window.gtag('config', this.trackingId, {
        send_page_view: false, // We trigger page views manually on route change
      });

      this.isInitialized = true;
      console.info(`[Analytics] Google Analytics initialized with ID: ${this.trackingId}`);
    } catch (e) {
      console.warn('[Analytics] Failed to initialize Google Analytics:', e);
    }
  }

  trackPageView(path: string, title?: string): void {
    if (this.isInitialized && window.gtag && this.trackingId) {
      window.gtag('config', this.trackingId, {
        page_path: path,
        page_title: title || document.title,
      });
    } else if (import.meta.env.DEV) {
      console.debug(`[Analytics Mock] Page View: ${path} | ${title || document.title}`);
    }
  }

  trackEvent(action: string, category: string, label?: string, value?: number): void {
    if (this.isInitialized && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    } else if (import.meta.env.DEV) {
      console.debug(`[Analytics Mock] Event: [${category}] ${action} ${label ? `- ${label}` : ''} ${value !== undefined ? `(${value})` : ''}`);
    }
  }
}

export const analytics = new AnalyticsService();

