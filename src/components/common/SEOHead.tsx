import { useEffect } from 'react';
import { getDefaultMetadata, generateSchemaMarkup, MetadataConfig } from '../../lib/seo';

interface SEOHeadProps {
  customMetadata?: Partial<MetadataConfig>;
}

export function SEOHead({ customMetadata }: SEOHeadProps) {
  useEffect(() => {
    const meta = { ...getDefaultMetadata(), ...customMetadata };
    
    // Update Document Title
    document.title = meta.title;

    // Inject or update meta description
    let descEl = document.querySelector('meta[name="description"]');
    if (!descEl) {
      descEl = document.createElement('meta');
      descEl.setAttribute('name', 'description');
      document.head.appendChild(descEl);
    }
    descEl.setAttribute('content', meta.description);

    // Inject JSON-LD Schema Script
    let schemaScript = document.getElementById('json-ld-schema');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'json-ld-schema';
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = generateSchemaMarkup();

  }, [customMetadata]);

  return null;
}
