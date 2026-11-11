import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { APP_CONFIG } from '../../constants/appConfig';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  canonicalUrl,
  ogType = 'website',
  ogImage = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
}) => {
  const location = useLocation();

  useEffect(() => {
    // 1. Page Title
    const formattedTitle = title
      ? `${title} | ${APP_CONFIG.name}`
      : `${APP_CONFIG.name} – Online Training Institute & LMS`;
    document.title = formattedTitle;

    // Helper to set or update meta tag
    const setMetaTag = (attribute: string, attributeValue: string, content: string) => {
      let element = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Meta Description
    const metaDescription =
      description ||
      'Nexelvoria Academy - Premier online training institute offering full-stack Java, MERN, Cloud DevOps, and GenAI courses with LMS and placement assistance.';
    setMetaTag('name', 'description', metaDescription);

    // 3. Meta Keywords
    if (keywords && keywords.length > 0) {
      setMetaTag('name', 'keywords', keywords.join(', '));
    }

    // 4. Open Graph Tags
    const fullUrl = canonicalUrl || `${window.location.origin}${location.pathname}`;
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', metaDescription);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', fullUrl);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:site_name', APP_CONFIG.name);

    // 5. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', metaDescription);
    setMetaTag('name', 'twitter:image', ogImage);

    // 6. Canonical URL
    let linkCanonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', fullUrl);
  }, [title, description, keywords, canonicalUrl, ogType, ogImage, location.pathname]);

  return null;
};

