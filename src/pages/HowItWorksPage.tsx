import { ViewMode } from '../types';
import { HowItWorks } from '../components/sections/HowItWorks';
import { SEOHead } from '../components/common/SEOHead';
import { Shield, Camera, Clock, CheckCircle2, ArrowRight, UserCheck, MapPin } from 'lucide-react';

interface HowItWorksPageProps {
  onNavigate: (view: ViewMode) => void;
}

export function HowItWorksPage({ onNavigate }: HowItWorksPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <SEOHead customMetadata={{ title: 'How It Works | Marketplace Delivery', description: 'Detailed breakdown of our 3-step pickup, inspection, and room placement process.' }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Banner */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Transparent Logistics
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            How Marketplace Delivery Protects Your Purchase
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            We inspect items at the seller&apos;s house before loading, provide live GPS tracking, and carry heavy furniture up stairs into your room of choice.
          </p>
        </div>

        {/* Core Steps */}
        <HowItWorks onNavigate={onNavigate} />

        {/* Deep Dive Security & Quality Controls */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Our 4-Point Safety & Verification Standard
            </h2>
            <p className="text-slate-600 text-sm">Every booking includes rigorous quality assurance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <Camera className="w-8 h-8 text-blue-600" />
              <h3 className="font-bold text-slate-900">1. Pre-Load Photo Proof</h3>
              <p className="text-xs text-slate-600">Driver takes 4-angle photos before loading to verify condition matching seller photos.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <h3 className="font-bold text-slate-900">2. $50k Cargo Insurance</h3>
              <p className="text-xs text-slate-600">Full insurance protection against transit accidental damage or loss.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <UserCheck className="w-8 h-8 text-blue-600" />
              <h3 className="font-bold text-slate-900">3. Vetted Independent Drivers</h3>
              <p className="text-xs text-slate-600">Background-checked, licensed, and vehicle-verified local delivery partners.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <Clock className="w-8 h-8 text-blue-600" />
              <h3 className="font-bold text-slate-900">4. 1-Hour Time Window</h3>
              <p className="text-xs text-slate-600">No all-day waiting. Receive live SMS updates when your driver is 15 mins away.</p>
            </div>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={() => onNavigate('get-quote')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 transition-all"
            >
              <span>Get an Instant Quote</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
