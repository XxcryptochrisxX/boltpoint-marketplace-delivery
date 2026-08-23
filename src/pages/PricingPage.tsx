import { ViewMode, QuoteInput } from '../types';
import { QuoteCalculator } from '../components/sections/QuoteCalculator';
import { SEOHead } from '../components/common/SEOHead';
import { Check, Info, ShieldCheck, DollarSign } from 'lucide-react';
import { formatCurrency } from '../lib/pricing';

interface PricingPageProps {
  onBookNow: (quote: QuoteInput) => void;
  onNavigate: (view: ViewMode) => void;
}

export function PricingPage({ onBookNow, onNavigate }: PricingPageProps) {
  const basePriceExamples = [
    { item: 'Trips up to 10 miles', price: 69, suffix: 'flat', desc: 'The first 10 driving miles are included.' },
    { item: 'Trips over 10 miles', price: 2.20, suffix: 'per extra mile', desc: '$69 plus $2.20 for each driving mile beyond 10.' },
  ];

  return (
    <div className="min-h-screen bg-white py-12">
      <SEOHead customMetadata={{ title: 'Pricing | Marketplace Delivery', description: 'Transparent flat-rate pricing for oversized item deliveries.' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            100% Upfront Pricing
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            No Hidden Fees. Clear Mileage Pricing.
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Pay only for what you need. Clear distance fees, flat stair surcharges, and optional assembly.
          </p>
        </div>

        {/* Pricing Tiers Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {basePriceExamples.map((tier, idx) => (
            <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Delivery Mileage</span>
                <h3 className="text-xl font-bold text-slate-900">{tier.item}</h3>
                <div className="text-3xl font-black text-slate-900">
                  {formatCurrency(tier.price)} <span className="text-xs text-slate-500 font-normal">{tier.suffix}</span>
                </div>
                <p className="text-xs text-slate-600 pt-1">{tier.desc}</p>
              </div>

              <div className="pt-4 border-t border-slate-200 text-xs space-y-1.5 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Includes Seller Meeting</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Photo Condition Verification</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pickup and delivery documentation</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Embed Quote Calculator */}
        <QuoteCalculator
          onBookNow={onBookNow}
          title="Try the Pricing Calculator Now"
          subtitle="Enter both full street addresses to calculate the driving route and exact mileage price."
        />

        {/* Add-ons explanation */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 space-y-6">
          <h3 className="text-xl font-bold">Transparent Add-On Rates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
              <span className="text-amber-400 font-bold">$15 / Flight</span>
              <p className="font-semibold text-white">Stairs Surcharge</p>
              <p className="text-xs text-slate-400">Waived if elevator is present at both pickup and delivery.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
              <span className="text-blue-400 font-bold">$35 Flat</span>
              <p className="font-semibold text-white">Furniture Assembly</p>
              <p className="text-xs text-slate-400">Bed frames, dining tables, desks, sectional brackets.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
              <span className="text-emerald-400 font-bold">$40 Flat</span>
              <p className="font-semibold text-white">Rush Express Dispatch</p>
              <p className="text-xs text-slate-400">Immediate pickup dispatch under 90 minutes.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
