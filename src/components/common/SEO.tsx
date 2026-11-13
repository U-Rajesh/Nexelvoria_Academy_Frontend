import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { APP_CONFIG } from '../../constants/appConfig';
import { cmsService } from '../../services/cmsService';

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
  ogImage,
}) => {
  const location = useLocation();

  useEffect(() => {
    // Check if CMS has custom SEO defined for this route
    const customSEO = cmsService.getPageSEO(location.pathname);

    const effectiveTitle = customSEO?.title || title;
    const effectiveDescription = customSEO?.description || description;
    const effectiveKeywords =
      customSEO?.keywords && customSEO.keywords.length > 0 ? customSEO.keywords : keywords;
    const effectiveOgImage =
      customSEO?.ogImage ||
      ogImage ||
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80';

    // 1. Page Title
    const formattedTitle = effectiveTitle
      ? `${effectiveTitle} | ${APP_CONFIG.name}`
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
      effectiveDescription ||
      'Nexelvoria Academy - Premier online training institute offering full-stack Java, MERN, Cloud DevOps, and GenAI courses with LMS and placement assistance.';
    setMetaTag('name', 'description', metaDescription);

    // 3. Meta Keywords
    if (effectiveKeywords && effectiveKeywords.length > 0) {
      setMetaTag('name', 'keywords', effectiveKeywords.join(', '));
    }

    // 4. Open Graph Tags
    const fullUrl = canonicalUrl || `${window.location.origin}${location.pathname}`;
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', metaDescription);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', fullUrl);
    setMetaTag('property', 'og:image', effectiveOgImage);
    setMetaTag('property', 'og:site_name', APP_CONFIG.name);

    // 5. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', metaDescription);
    setMetaTag('name', 'twitter:image', effectiveOgImage);

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
