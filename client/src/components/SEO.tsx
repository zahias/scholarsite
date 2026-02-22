import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  author?: string;
  type?: 'website' | 'profile' | 'article';
  structuredData?: object;
}

export default function SEO({
  title,
  description,
  image,
  url,
  author,
  type = 'profile',
  structuredData
}: SEOProps) {
  useEffect(() => {
    // Set page title
    document.title = title;

    // Helper function to update or create meta tag
    const updateMetaTag = (selector: string, attribute: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (attribute === 'property') {
          element.setAttribute('property', selector.replace('meta[property="', '').replace('"]', ''));
        } else {
          element.setAttribute('name', selector.replace('meta[name="', '').replace('"]', ''));
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('meta[name="description"]', 'name', description);
    if (author) {
      updateMetaTag('meta[name="author"]', 'name', author);
    }

    // Open Graph tags
    updateMetaTag('meta[property="og:title"]', 'property', title);
    updateMetaTag('meta[property="og:description"]', 'property', description);
    updateMetaTag('meta[property="og:type"]', 'property', type);
    updateMetaTag('meta[property="og:site_name"]', 'property', 'Scholar.name');
    if (url) {
      updateMetaTag('meta[property="og:url"]', 'property', url);
      // Update canonical link
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', url);
    }
    // Use provided image or default OG image
    const ogImage = image || 'https://scholar.name/og-image.png';
    updateMetaTag('meta[property="og:image"]', 'property', ogImage);
    updateMetaTag('meta[property="og:image:width"]', 'property', '1200');
    updateMetaTag('meta[property="og:image:height"]', 'property', '630');
    updateMetaTag('meta[property="og:image:alt"]', 'property', image ? `${author || 'Researcher'} profile picture` : 'Scholar.name - Professional Research Portfolios');

    // Twitter Card tags
    updateMetaTag('meta[name="twitter:card"]', 'name', image ? 'summary_large_image' : 'summary');
    updateMetaTag('meta[name="twitter:title"]', 'name', title);
    updateMetaTag('meta[name="twitter:description"]', 'name', description);
    if (image) {
      updateMetaTag('meta[name="twitter:image"]', 'name', image);
    }

    // Schema.org structured data for Google Scholar
    if (structuredData) {
      let scriptElement = document.querySelector('script[type="application/ld+json"]');
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(structuredData);
    }
  }, [title, description, image, url, author, type, structuredData]);

  return null; // This component doesn't render anything
}
