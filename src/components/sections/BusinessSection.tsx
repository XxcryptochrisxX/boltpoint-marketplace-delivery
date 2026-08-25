import { useState } from 'react';
import { ViewMode } from '../../types';
import { BUSINESS_TARGETS } from '../../constants';
import { Building2, Store, Armchair, Home, Sparkles, Boxes, Key, ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface BusinessSectionProps {
  onNavigate: (view: ViewMode) => void;
  onOpenPartnerModal?: () => void;
}

export function BusinessSection({ onNavigate, onOpenPartnerModal }: BusinessSectionProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Armchair': return Armchair;
      case 'Home': return Home;
      case 'Store': return Store;
      case 'Building2': return Building2;
      case 'Sparkles': return Sparkles;
      case 'Boxes': return Boxes;
      case 'Key': return Key;
      default: return Building2;
    }
  };

  return (
    <section className="py-16 sm:py-20 bg-slate-900 text-white relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-950 px-3 py-1 rounded-full border border-blue-800">
            For Retailers & Commercial Partners
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Delivery Infrastructure for Your Business
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Offer 1–2 day oversized delivery without buying trucks, hiring drivers, or managing logistics.
          </p>
        </div>

        {/* Vertical Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {BUSINESS_TARGETS.map((target, idx) => {
            const IconComp = getIcon(target.iconName);
            return (
              <div
                key={idx}
                className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80 hover:border-blue-500/60 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{target.title}</h3>
                  <p className="text-slate-300 text-xs leading-relaxed">{target.description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Custom B2B Invoice Rates</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Banner Box */}
        <div className="mt-12 bg-gradient-to-r from-blue-900/60 via-slate-800 to-slate-800 rounded-2xl p-8 border border-blue-700/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Ready to upgrade your store or property logistics?
            </h3>
            <p className="text-slate-300 text-sm">
              Get dedicated account dispatching, batch API billing, and priority weekend delivery partners.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => {
                if (onOpenPartnerModal) onOpenPartnerModal();
                else onNavigate('businesses');
              }}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Partner With Us</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
