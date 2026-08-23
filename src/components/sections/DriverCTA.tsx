import { ViewMode } from '../../types';
import { Truck, DollarSign, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

interface DriverCTAProps {
  onNavigate: (view: ViewMode) => void;
}

export function DriverCTA({ onNavigate }: DriverCTAProps) {
  return (
    <section className="py-16 bg-blue-600 text-white relative overflow-hidden">
      
      {/* Decorative background shapes */}
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-blue-500/50 blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-8 space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/60 border border-blue-400 text-xs font-bold uppercase tracking-wider">
              <Truck className="w-3.5 h-3.5" />
              <span>Driver Opportunities</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Own a Pickup Truck, Van, or Box Truck? <br />
              <span className="text-blue-200">Earn $35 – $75/Hr Delivering Local Items.</span>
            </h2>

            <p className="text-blue-100 text-base max-w-2xl mx-auto lg:mx-0">
              Turn your vehicle into a profitable daily business. Pick your own jobs, set your own schedule, and get paid weekly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 max-w-xl mx-auto lg:mx-0 text-xs font-semibold">
              <div className="bg-blue-700/60 rounded-xl p-3 border border-blue-500/50 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-300" />
                <span>Weekly Direct Payouts</span>
              </div>
              <div className="bg-blue-700/60 rounded-xl p-3 border border-blue-500/50 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-300" />
                <span>100% Flexible Hours</span>
              </div>
              <div className="bg-blue-700/60 rounded-xl p-3 border border-blue-500/50 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>$50k Cargo Insurance</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <button
              onClick={() => onNavigate('become-driver')}
              className="px-8 py-4 rounded-2xl bg-white text-blue-900 font-extrabold text-base shadow-xl hover:bg-blue-50 transition-all flex items-center gap-2 active:scale-[0.98]"
            >
              <span>Apply to Drive</span>
              <ArrowRight className="w-5 h-5 text-blue-600" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
