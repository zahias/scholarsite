import { useEffect } from 'react';

// Google Analytics 4 Configuration
const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || '';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize GA4
export function initGA4() {
  if (!GA4_MEASUREMENT_ID || typeof window === 'undefined') return;

  // Check if already initialized
  if (window.gtag) return;

  // Load gtag.js
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA4_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
}

// Track page view
export function trackPageView(path: string, title?: string) {
  if (!window.gtag) return;
  
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
}

// Track custom events
export function trackEvent(
  eventName: string, 
  params?: Record<string, any>
) {
  if (!window.gtag) return;
  
  window.gtag('event', eventName, params);
}

// Track profile view
export function trackProfileView(openalexId: string, researcherName: string) {
  trackEvent('profile_view', {
    openalex_id: openalexId,
    researcher_name: researcherName,
  });
}

// Track profile interaction
export function trackProfileClick(
  openalexId: string, 
  clickType: 'publication' | 'cv' | 'linkedin' | 'email' | 'twitter' | 'website' | 'orcid' | 'share'
) {
  trackEvent('profile_click', {
    openalex_id: openalexId,
    click_type: clickType,
  });
}

// Track signup/conversion
export function trackSignup(method: string) {
  trackEvent('sign_up', {
    method: method,
  });
}

// Track pricing view
export function trackPricingView(plan?: string) {
  trackEvent('view_item', {
    items: [{
      item_name: plan || 'pricing_page',
      item_category: 'subscription',
    }]
  });
}

// Analytics Provider Component
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initGA4();
  }, []);

  return <>{children}</>;
}

// Hook to track page views on route change
export function usePageTracking(path: string, title?: string) {
  useEffect(() => {
    trackPageView(path, title);
  }, [path, title]);
}

export default {
  initGA4,
  trackPageView,
  trackEvent,
  trackProfileView,
  trackProfileClick,
  trackSignup,
  trackPricingView,
};
