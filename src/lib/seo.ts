import { APP_NAME, APP_TAGLINE, APP_SUBTITLE } from '../constants';

export interface MetadataConfig {
  title: string;
  description: string;
  url?: string;
  ogImage?: string;
}

export function getDefaultMetadata(): MetadataConfig {
  return {
    title: `${APP_NAME} | Oversized Item Delivery from Facebook Marketplace & Local Sellers`,
    description: `${APP_TAGLINE} ${APP_SUBTITLE} Simple local pickup and delivery for marketplace furniture in the Tampa Bay region.`,
    url: typeof window !== 'undefined' ? window.location.origin : 'https://marketplacedelivery.com',
    ogImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&h=630&q=80',
  };
}

/**
 * Generates Schema.org JSON-LD structured data for search engines
 */
export function generateSchemaMarkup() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LogisticsService',
    'name': APP_NAME,
    'description': APP_SUBTITLE,
    'url': 'https://marketplacedelivery.com',
    'logo': 'https://marketplacedelivery.com/logo.png',
    'areaServed': [
      {
        '@type': 'Country',
        'name': 'United States',
      },
    ],
    'serviceType': [
      'Facebook Marketplace Furniture Delivery',
      'OfferUp Local Transport',
      'Estate Sale Item Pickup',
      '1–2 Day Oversized Logistics',
    ],
    'offers': {
      '@type': 'AggregateOffer',
      'priceCurrency': 'USD',
      'lowPrice': '49',
      'highPrice': '250',
      'offerCount': '1000+',
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.9',
      'reviewCount': '1420',
    },
  };

  return JSON.stringify(schema);
}

export const ROBOTS_TXT_CONTENT = `User-agent: *
Allow: /
Disallow: /admin-dashboard
Disallow: /customer-dashboard
Disallow: /driver-dashboard

Sitemap: https://marketplacedelivery.com/sitemap.xml
`;

export const SITEMAP_XML_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://marketplacedelivery.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://marketplacedelivery.com/how-it-works</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://marketplacedelivery.com/pricing</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://marketplacedelivery.com/become-a-driver</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://marketplacedelivery.com/businesses</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://marketplacedelivery.com/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://marketplacedelivery.com/faq</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://marketplacedelivery.com/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;
