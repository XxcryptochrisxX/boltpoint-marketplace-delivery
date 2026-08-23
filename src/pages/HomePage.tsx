import { QuoteInput, ViewMode } from '../types';
import { Hero } from '../components/sections/Hero';
import { TrustBadges } from '../components/sections/TrustBadges';
import { QuoteCalculator } from '../components/sections/QuoteCalculator';
import { HowItWorks } from '../components/sections/HowItWorks';
import { BusinessSection } from '../components/sections/BusinessSection';
import { Testimonials } from '../components/sections/Testimonials';
import { DriverCTA } from '../components/sections/DriverCTA';
import { FAQSection } from '../components/sections/FAQSection';
import { SEOHead } from '../components/common/SEOHead';

interface HomePageProps {
  onNavigate: (view: ViewMode) => void;
  onBookNow: (quote: QuoteInput) => void;
  onOpenPartnerModal?: () => void;
}

export function HomePage({ onNavigate, onBookNow, onOpenPartnerModal }: HomePageProps) {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead />
      <Hero onNavigate={onNavigate} />
      <TrustBadges />
      <QuoteCalculator onBookNow={onBookNow} />
      <HowItWorks onNavigate={onNavigate} />
      <BusinessSection onNavigate={onNavigate} onOpenPartnerModal={onOpenPartnerModal} />
      <Testimonials />
      <DriverCTA onNavigate={onNavigate} />
      <FAQSection onContactClick={() => onNavigate('contact')} />
    </div>
  );
}
