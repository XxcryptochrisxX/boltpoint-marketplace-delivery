import { useState, FormEvent } from 'react';
import { ViewMode, BusinessPartnerLead } from '../types';
import { saveBusinessLead } from '../lib/supabaseClient';
import { SEOHead } from '../components/common/SEOHead';
import { BUSINESS_TARGETS } from '../constants';
import { BusinessSection } from '../components/sections/BusinessSection';
import { Building2, Store, CheckCircle2, ArrowRight, ShieldCheck, Mail, Phone, Users, Check } from 'lucide-react';

interface BusinessesPageProps {
  onNavigate: (view: ViewMode) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export function BusinessesPage({ onNavigate, onShowToast }: BusinessesPageProps) {
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessType, setBusinessType] = useState<BusinessPartnerLead['businessType']>('Furniture Store');
  const [monthlyDeliveries, setMonthlyDeliveries] = useState('10 - 25 deliveries/mo');
  const [city, setCity] = useState('Austin, TX');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const handleLeadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!businessName || !contactName || !email || !phone) {
      onShowToast('Required Fields Missing', 'Please fill in business name, contact name, email and phone.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveBusinessLead({
        businessName,
        contactName,
        email,
        phone,
        businessType,
        estimatedMonthlyDeliveries: monthlyDeliveries,
        city,
      });

      setLeadSubmitted(true);
      onShowToast('Partner Lead Submitted!', 'Our B2B account team will contact you within 4 business hours.', 'success');
    } catch (err) {
      onShowToast('Error', 'Failed to save lead. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <SEOHead customMetadata={{ title: 'Business Logistics Partnerships | Marketplace Delivery', description: 'On-demand oversized item delivery for furniture stores, estate sales, and interior designers.' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Hero Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-14 border border-slate-800 text-center max-w-4xl mx-auto space-y-4 relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-600/30 text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-500/40">
            <Building2 className="w-3.5 h-3.5" />
            <span>B2B Delivery Solutions</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Seamless Oversized Delivery for Your Commercial Customers
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
            Eliminate delivery friction for furniture buyers, estate auctions, consignment shoppers, and property tenants with instant on-demand truck dispatch.
          </p>

          <div className="pt-4 flex justify-center">
            <button
              onClick={() => setShowLeadModal(true)}
              className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <span>Partner With Us</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Business Verticals Component */}
        <BusinessSection onNavigate={onNavigate} onOpenPartnerModal={() => setShowLeadModal(true)} />

        {/* B2B Benefits Grid */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Why 150+ Local Businesses Partner With Us
            </h2>
            <p className="text-slate-600 text-sm">Dedicated B2B account benefits designed for retail & commercial growth.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 text-base">Monthly Invoicing</h3>
              <p className="text-xs text-slate-600">Batch corporate billing on Net-30 terms for verified commercial partners.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 text-base">Dedicated Account Dispatch</h3>
              <p className="text-xs text-slate-600">Priority driver matching during high-volume weekend sales & estate auctions.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 text-base">White-Glove Placement</h3>
              <p className="text-xs text-slate-600">Uniformed, background-checked delivery partners offering room-of-choice setup.</p>
            </div>
          </div>
        </div>

        {/* Partner Lead Modal */}
        {showLeadModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-200 shadow-2xl relative space-y-4">
              
              {!leadSubmitted ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Partner With Marketplace Delivery</h3>
                      <p className="text-xs text-slate-500">Get a custom B2B delivery program for your store or property.</p>
                    </div>
                    <button
                      onClick={() => setShowLeadModal(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleLeadSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company / Store Name *</label>
                        <input
                          type="text"
                          required
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="Austin Vintage Furniture"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Person *</label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Sarah Miller"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Work Email *</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="sarah@store.com"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(512) 555-0188"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Business Type</label>
                        <select
                          value={businessType}
                          onChange={(e) => setBusinessType(e.target.value as any)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                        >
                          <option value="Furniture Store">Furniture Store</option>
                          <option value="Estate Sales">Estate Sales</option>
                          <option value="Consignment Store">Consignment Store</option>
                          <option value="Apartment Community">Apartment Community</option>
                          <option value="Interior Designer">Interior Designer</option>
                          <option value="Storage Facility">Storage Facility</option>
                          <option value="Property Manager">Property Manager</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estimated Monthly Jobs</label>
                        <select
                          value={monthlyDeliveries}
                          onChange={(e) => setMonthlyDeliveries(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                        >
                          <option value="1 - 10 deliveries/mo">1 - 10 deliveries/mo</option>
                          <option value="10 - 25 deliveries/mo">10 - 25 deliveries/mo</option>
                          <option value="25 - 100 deliveries/mo">25 - 100 deliveries/mo</option>
                          <option value="100+ deliveries/mo">100+ deliveries/mo</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowLeadModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-700"
                      >
                        {isSubmitting ? 'Saving...' : 'Submit Partnership Request'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="text-xl font-bold text-slate-900">Partnership Lead Received!</h3>
                  <p className="text-xs text-slate-600">
                    Thank you <strong>{contactName}</strong> from <strong>{businessName}</strong>. Our commercial team will prepare a custom rate sheet and reach out shortly.
                  </p>
                  <button
                    onClick={() => {
                      setLeadSubmitted(false);
                      setShowLeadModal(false);
                    }}
                    className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                  >
                    Done
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
