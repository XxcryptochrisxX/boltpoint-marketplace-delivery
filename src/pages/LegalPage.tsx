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

        <p className="text-xs text-slate-500 font-medium">Effective and Last Updated: August 24, 2026</p>

        {type === 'privacy' && (
          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <h3 className="font-bold text-slate-900 text-base">1. Information We Collect</h3>
            <p>We collect information you provide, including names, email addresses, phone numbers, pickup and delivery addresses, listing details, photos, access instructions, account activity, and delivery preferences. Stripe processes payment-card information; we do not receive full card numbers.</p>
            <h3 className="font-bold text-slate-900 text-base">2. How We Use Information</h3>
            <p>We use information to create and secure seller accounts, generate quotes, process bookings, coordinate pickup and delivery, prevent misuse, provide support, send transactional messages, and comply with legal obligations.</p>
            <h3 className="font-bold text-slate-900 text-base">3. When We Share Information</h3>
            <p>We share only what is reasonably needed with service providers and delivery partners. These may include Cloudflare for hosting and storage, Google Maps for address and route services, Stripe for payments, Shipday for dispatch, Resend for email, and the assigned driver for a confirmed delivery. A seller’s exact pickup address is not included in the public buyer-link response.</p>
            <h3 className="font-bold text-slate-900 text-base">4. Retention and Security</h3>
            <p>We retain information for as long as reasonably needed to provide the service, maintain business and transaction records, resolve disputes, and meet legal requirements. We use administrative, technical, and physical safeguards appropriate to the nature of the information, but no system can guarantee absolute security.</p>
            <h3 className="font-bold text-slate-900 text-base">5. Your Choices</h3>
            <p>You may pause or expire seller links from your account. To request access, correction, or deletion of personal information, contact admin@boltpointlogistics.com. Some records may be retained where required for fraud prevention, accounting, disputes, or law.</p>
            <h3 className="font-bold text-slate-900 text-base">6. Cookies, Children, and Changes</h3>
            <p>We use an essential sign-in cookie to keep seller accounts secure. The service is not directed to children under 13. We may update this policy and will post the revised effective date here.</p>
          </div>
        )}

        {type === 'terms' && (
          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <h3 className="font-bold text-slate-900 text-base">1. Agreement and Eligibility</h3>
            <p>By using {APP_NAME}, you agree to these Terms and confirm that you are at least 18 and legally able to enter this agreement. A seller creating a link confirms they are authorized to offer the listed item and pickup location.</p>
            <h3 className="font-bold text-slate-900 text-base">2. Service and Independent Delivery Providers</h3>
            <p>Bolt Point Logistics operates as a delivery broker and coordination platform for single-item local deliveries. Delivery services may be performed by independent third-party providers. We may accept, decline, reassign, or cancel a request when safe or reliable fulfillment is not reasonably available.</p>
            <h3 className="font-bold text-slate-900 text-base">3. Accurate Information and Prohibited Items</h3>
            <p>You must provide accurate item dimensions, condition, addresses, access details, contact information, stairs, and assembly needs. Hazardous, illegal, stolen, perishable, live, medically regulated, or otherwise unsafe items are prohibited. Additional charges or cancellation may apply when material details were omitted.</p>
            <h3 className="font-bold text-slate-900 text-base">4. Pricing and Payment</h3>
            <p>Standard customer pricing starts at $69 for routes up to and including 10 driving miles, plus $2.20 per mile above the first 10 miles, before any clearly disclosed add-ons. The checkout total controls. Payment processing is provided by Stripe.</p>
            <h3 className="font-bold text-slate-900 text-base">5. Pickup, Delivery, and Item Condition</h3>
            <p>The parties must provide safe, lawful access and be available during the scheduled window. Photos and status records may be used to document condition and delivery. Any cargo protection or insurance is subject to the applicable carrier policy, eligibility rules, exclusions, limits, documentation, and claims process; it is not an unconditional guarantee by the platform.</p>
            <h3 className="font-bold text-slate-900 text-base">6. Seller Accounts and Communications</h3>
            <p>Seller sign-in links are personal and time-limited. You are responsible for access to your email account and activity under your session. We may send service, security, booking, and account communications. Marketing consent, if ever offered, will be separate and optional.</p>
            <h3 className="font-bold text-slate-900 text-base">7. Suspension, Disclaimers, and Liability</h3>
            <p>We may pause accounts or links for suspected fraud, misuse, unsafe activity, or violations. To the extent permitted by law, the platform is provided without warranties not expressly stated here, and Bolt Point Logistics is not liable for indirect, incidental, special, or consequential losses. Rights that cannot legally be limited remain unaffected.</p>
            <h3 className="font-bold text-slate-900 text-base">8. Changes and Contact</h3>
            <p>We may update these Terms prospectively. The current version and effective date will be posted here. Questions or notices may be sent to admin@boltpointlogistics.com.</p>
          </div>
        )}

        {type === 'refund-policy' && (
          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <h3 className="font-bold text-slate-900 text-base">1. Cancellation Before Dispatch</h3>
            <p>You may request cancellation up to one hour before the scheduled pickup window without a delivery cancellation fee. Payment-processing fees, if nonrefundable to us, may be deducted where permitted and will be disclosed.</p>
            <h3 className="font-bold text-slate-900 text-base">2. Late Cancellation, No-Show, or Unsafe Pickup</h3>
            <p>If cancellation occurs later, a party is unreachable, the item or access materially differs from the booking, or the driver cannot safely complete pickup, a trip or cancellation charge of up to $25 may apply. Any remaining prepaid delivery amount will be refunded to the original payment method.</p>
            <h3 className="font-bold text-slate-900 text-base">3. Service Failure and Refund Timing</h3>
            <p>If we cannot provide the booked delivery and no acceptable alternative is arranged, the delivery charge will be refunded. Approved refunds are submitted promptly, but the customer’s bank determines when funds appear.</p>
            <h3 className="font-bold text-slate-900 text-base">4. Item Purchase and Damage Claims</h3>
            <p>The marketplace item purchase is separate from the delivery charge and is not refundable by Bolt Point Logistics. Damage concerns must be reported promptly to admin@boltpointlogistics.com with the order number and photos; coverage depends on the applicable carrier policy and documentation requirements.</p>
          </div>
        )}

      </div>
    </div>
  );
}
