import { ViewMode } from '../types';
import { SEOHead } from '../components/common/SEOHead';
import { ShieldCheck, FileText, RefreshCw } from 'lucide-react';
import { APP_NAME } from '../constants';

interface LegalPageProps {
  type: 'privacy' | 'terms' | 'refund-policy';
}

export function LegalPage({ type }: LegalPageProps) {
  const getTitle = () => {
    switch (type) {
      case 'privacy': return 'Privacy Policy';
      case 'terms': return 'Terms of Service';
      case 'refund-policy': return 'Refund & Cancellation Policy';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <SEOHead customMetadata={{ title: `${getTitle()} | ${APP_NAME}`, description: `Legal documents and policies for ${APP_NAME}.` }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6">
        
        <h1 className="text-3xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">
          {getTitle()}
        </h1>

        <p className="text-xs text-slate-500 font-medium">Last Updated: July 2026</p>

        {type === 'privacy' && (
          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <h3 className="font-bold text-slate-900 text-base">1. Information We Collect</h3>
            <p>
              When you book a delivery through {APP_NAME}, we collect your name, phone number, email address, pickup address, delivery address, and details regarding the item purchased.
            </p>
            <h3 className="font-bold text-slate-900 text-base">2. How We Use Information</h3>
            <p>
              Your contact details and pickup addresses are shared only with the assigned independent delivery partner solely for fulfilling the booked delivery and providing live status updates via SMS.
            </p>
            <h3 className="font-bold text-slate-900 text-base">3. Data Security</h3>
            <p>
              We enforce strict encryption standards across all stored customer records and payment transactions.
            </p>
          </div>
        )}

        {type === 'terms' && (
          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <h3 className="font-bold text-slate-900 text-base">1. Independent Logistics Platform</h3>
            <p>
              {APP_NAME} operates as a technology marketplace connecting buyers and sellers with independent third-party delivery partners who own and operate their own vehicles.
            </p>
            <h3 className="font-bold text-slate-900 text-base">2. Cargo Protection Guarantee</h3>
            <p>
              All bookings made on our platform include up to $50,000 in cargo protection against accidental transit damage. Pre-load photo inspection is mandatory for coverage eligibility.
            </p>
          </div>
        )}

        {type === 'refund-policy' && (
          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <h3 className="font-bold text-slate-900 text-base">1. Free Cancellations</h3>
            <p>
              You may cancel any delivery booking free of charge up to 1 hour before the scheduled pickup window.
            </p>
            <h3 className="font-bold text-slate-900 text-base">2. Unreachable Sellers</h3>
            <p>
              If a seller is unreachable or refuses pickup upon driver arrival, a nominal $25 driver trip fee applies, and the remainder of your booking payment is automatically refunded.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
