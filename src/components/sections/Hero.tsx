import sofaVanImg from '../../assets/images/sofa_cargo_van_1784898124123.jpg';
import truckWatermark from '../../assets/images/boltpoint-truck-watermark.png';
import { ViewMode } from '../../types';
import { ArrowRight, Star, CheckCircle } from 'lucide-react';
import { APP_NAME } from '../../constants';

interface HeroProps {
  onNavigate: (view: ViewMode) => void;
}

export function Hero({ onNavigate }: HeroProps) {
  return (
    <section className="relative bg-white overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-28">
      
      {/* Decorative subtle background accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-blue-50/80 blur-2xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="relative isolate lg:col-span-7 text-center lg:text-left">
            <img
              src={truckWatermark}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[74%] max-w-[530px] -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.075]"
            />

            <div className="relative z-10 space-y-6">
            
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Next-Gen On-Demand Furniture Logistics</span>
            </div>

            {/* Seller path */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Sell It. <span className="text-[0.82em] font-extrabold tracking-normal text-blue-600">We&apos;ll Deliver.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Help your listing sell faster by offering secure local delivery. Reach buyers without trucks, reduce pickup delays and no-shows, and close the sale with less back-and-forth.
            </p>

            <div className="flex justify-center lg:justify-start pt-1">
              <button
                onClick={() => onNavigate('for-sellers')}
                className="w-full sm:w-48 h-14 inline-flex items-center justify-center gap-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm whitespace-nowrap shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 transition-all active:scale-[0.98]"
              >
                <span>Sell With Delivery</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Buyer path */}
            <div className="relative pt-6 space-y-4 before:absolute before:left-0 before:top-0 before:w-[13%] before:border-t before:border-slate-200 after:absolute after:right-0 after:top-0 after:w-[13%] after:border-t after:border-slate-200">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                Buy It. <span className="text-[0.82em] font-extrabold tracking-normal text-blue-600">We&apos;ll Bring It Home.</span>
              </h2>
              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Furniture delivery from Facebook Marketplace, OfferUp, Craigslist, estate sales, and local sellers.
              </p>
              <div className="flex justify-center lg:justify-start pt-1">
              <button
                onClick={() => onNavigate('get-quote')}
                className="w-full sm:w-48 h-14 inline-flex items-center justify-center gap-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all active:scale-[0.98]"
              >
                <span>Get My Quote</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              </div>
            </div>

            {/* Quick Guarantees */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Instant Pricing
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Room of Choice
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Documented handoff
              </span>
            </div>

            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer Image Box */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xl bg-white">
                <img
                  src={sofaVanImg}
                  alt="Delivery Partner Loading Residential Sofa into Cargo Van"
                  className="w-full h-[340px] sm:h-[420px] object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -left-4 hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-800 text-xs font-semibold">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>4.9/5 Rating (1,400+ Deliveries)</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
