import { ViewMode } from '../types';
import { FAQSection } from '../components/sections/FAQSection';
import { SEOHead } from '../components/common/SEOHead';

interface FAQPageProps {
  onNavigate: (view: ViewMode) => void;
}

export function FAQPage({ onNavigate }: FAQPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <SEOHead customMetadata={{ title: 'Help & FAQ | Marketplace Delivery', description: 'Answers to common questions about oversized item delivery.' }} />
      <FAQSection onContactClick={() => onNavigate('contact')} />
    </div>
  );
}
