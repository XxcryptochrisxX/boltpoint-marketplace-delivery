import { Calendar, Truck, Home, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { ViewMode } from '../../types';

interface HowItWorksProps {
  onNavigate?: (view: ViewMode) => void;
}

export function HowItWorks({ onNavigate }: HowItWorksProps) {
  const steps = [
    {
      stepNumber: '01',
      title: 'Get Instant Quote & Schedule',
      description: 'Enter pickup and delivery ZIPs along with item details. Get a guaranteed flat-rate price with zero hidden fees. Pick your ideal 1-hour delivery window.',
      icon: Calendar,
      badge: 'Step 1: Book',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      stepNumber: '02',
      title: 'We Pickup & Inspect Item',
      description: 'Our vetted delivery partner meets the seller at Facebook Marketplace, OfferUp, estate, or store location. We inspect the item and upload condition photos before loading.',
      icon: Truck,
      badge: 'Step 2: Pickup',
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      stepNumber: '03',
      title: 'Room-of-Choice Delivery',
      description: 'Track your driver en route in real-time. We carry the item up stairs, place it directly in your room of choice, and assemble it if requested.',
      icon: Home,
      badge: 'Step 3: Enjoy',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Simple 3-Step Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How Marketplace Delivery Works
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            We bridge the gap between second-hand buyers, local sellers, and trusted truck owners.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((s, idx) => {
            const IconComp = s.icon;
            return (
              <div
                key={idx}
                className="relative bg-white rounded-2xl p-8 border border-slate-200/80 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                {/* Step Number Badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${s.color} border shadow-xs`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black text-slate-200 group-hover:text-blue-200 transition-colors">
                    {s.stepNumber}
                  </span>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.badge}</span>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{s.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{s.description}</p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Verified & Insured Step</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to action footer */}
        {onNavigate && (
          <div className="mt-12 text-center">
            <button
              onClick={() => onNavigate('get-quote')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition-all"
            >
              <span>Ready to Book a Delivery?</span>
              <ArrowRight className="w-4 h-4 text-blue-400" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
