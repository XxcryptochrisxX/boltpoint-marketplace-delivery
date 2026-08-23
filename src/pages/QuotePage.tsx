import { ViewMode, QuoteInput } from '../types';
import { QuoteCalculator } from '../components/sections/QuoteCalculator';
import { SEOHead } from '../components/common/SEOHead';

interface QuotePageProps {
  onBookNow: (quote: QuoteInput) => void;
  onNavigate: (view: ViewMode) => void;
}

export function QuotePage({ onBookNow, onNavigate }: QuotePageProps) {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <SEOHead customMetadata={{ title: 'Instant Quote Calculator | Marketplace Delivery', description: 'Calculate exact upfront flat-rate delivery prices for sofas, tables, mattresses, and heavy items.' }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <QuoteCalculator
          onBookNow={onBookNow}
          title="Instant Delivery Price Calculator"
          subtitle="Select your item type and ZIP codes to see exact flat-rate pricing with no hidden surcharges."
        />
      </div>
    </div>
  );
}
