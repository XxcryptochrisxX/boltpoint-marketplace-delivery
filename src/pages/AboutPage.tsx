import { ViewMode } from '../types';
import { SEOHead } from '../components/common/SEOHead';
import { Truck, ShieldCheck, Heart, Award, Users, Target } from 'lucide-react';
import { APP_NAME } from '../constants';

interface AboutPageProps {
  onNavigate: (view: ViewMode) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-white py-12">
      <SEOHead customMetadata={{ title: 'About Us | Marketplace Delivery', description: 'Building the modern technology marketplace for oversized item transport.' }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Our Story & Mission
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Solving the &quot;How Do I Get This Home?&quot; Problem
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Millions of people find great furniture deals on Facebook Marketplace, OfferUp, estate sales, and local shops every day — but 70% don&apos;t own a pickup truck or cargo van.
          </p>
        </div>

        {/* Vision Story Card */}
        <div className="bg-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Empowering Local Buyers & Independent Truck Owners</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Founded in Austin, Texas, {APP_NAME} was built to make heavy item transport as easy as ordering ride-share or food delivery.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed">
              We connect local buyers directly with vetted truck and van owners who want to earn flexible income while solving logistics bottlenecks for local communities.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">The $50,000 Guarantee</h3>
                <p className="text-xs text-slate-500">Every item is covered by cargo protection from pickup to placement.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">1,400+ Verified Deliveries</h3>
                <p className="text-xs text-slate-500">Maintaining an average 4.9/5 star customer satisfaction rating.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Vetted Delivery Network</h3>
                <p className="text-xs text-slate-500">Background-checked, insured independent drivers with proper lifting gear.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
