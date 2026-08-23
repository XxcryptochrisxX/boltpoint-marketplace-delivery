import { TRUST_BADGES } from '../../constants';
import { ShoppingBag, ShieldCheck, Clock, Award } from 'lucide-react';

export function TrustBadges() {
  return (
    <section className="bg-slate-50 border-y border-slate-200/80 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6">
          Trusted for Local Pickups & Deliveries From
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-12 opacity-85">
          {TRUST_BADGES.map((badge, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200/60 shadow-xs hover:border-blue-200 hover:shadow-md transition-all text-slate-700 font-semibold text-sm sm:text-base"
            >
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>{badge.name}</span>
            </div>
          ))}
        </div>

        {/* Value Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-200/60 text-center">
          <div className="flex flex-col items-center">
            <span className="font-bold text-slate-900 text-lg sm:text-xl">Same-Day</span>
            <span className="text-xs text-slate-500">Under 2-Hour Pickup</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-slate-900 text-lg sm:text-xl">Documented</span>
            <span className="text-xs text-slate-500">Pickup & Drop-off</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-slate-900 text-lg sm:text-xl">4.9 / 5.0 ★</span>
            <span className="text-xs text-slate-500">Customer Satisfaction</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-slate-900 text-lg sm:text-xl">100% Flat Fee</span>
            <span className="text-xs text-slate-500">Upfront Price Guarantee</span>
          </div>
        </div>

      </div>
    </section>
  );
}
