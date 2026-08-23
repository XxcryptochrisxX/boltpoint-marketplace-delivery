import { useState, FormEvent } from 'react';
import { ViewMode } from '../types';
import { APP_NAME } from '../constants';
import { SEOHead } from '../components/common/SEOHead';
import { Phone, Mail, Clock, MapPin, Send, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ContactPageProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export function ContactPage({ onShowToast }: ContactPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [botCheck, setBotCheck] = useState(''); // Anti-spam captcha
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      onShowToast('Missing Fields', 'Please complete name, email, and message.', 'error');
      return;
    }

    if (botCheck.toLowerCase().trim() !== '7') {
      onShowToast('Spam Check Failed', 'Please solve 3 + 4 = 7 correctly.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to send message.');
      setIsSubmitting(false);
      setSubmitted(true);
      onShowToast('Message Sent!', 'Our support team will respond within 2 hours.', 'success');
    } catch (error) {
      setIsSubmitting(false);
      onShowToast('Message Error', error instanceof Error ? error.message : 'Unable to send message.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <SEOHead customMetadata={{ title: 'Contact Us | Marketplace Delivery', description: 'Get in touch with customer logistics support.' }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            24/7 Logistics Support
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            We&apos;re Here to Help
          </h1>
          <p className="text-slate-600 text-base">
            Have a question about a booking, need help with seller pickup coordination, or want to partner?
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Contact Details & Map Placeholder */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Info Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
                Support Details
              </h2>

              <div className="space-y-4 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900">Phone Support</span>
                    <a href="tel:18005554285" className="text-slate-600 hover:text-blue-600">
                      1-800-555-HAUL (4285)
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900">Email Address</span>
                    <a href="mailto:support@marketplacedelivery.com" className="text-slate-600 hover:text-blue-600">
                      support@marketplacedelivery.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900">Business Hours</span>
                    <p className="text-slate-600 text-xs">
                      Mon – Sat: 7:00 AM – 9:00 PM CST <br />
                      Sunday: 8:00 AM – 7:00 PM CST
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900">HQ Address</span>
                    <p className="text-slate-600 text-xs">
                      100 Congress Ave, Suite 1200 <br />
                      Austin, TX 78701
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* OpenStreetMap Interactive View */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm overflow-hidden space-y-2">
              <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>OpenStreetMap Dispatch Coverage</span>
                </span>
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-bold">
                  Active Austin Hub
                </span>
              </div>

              <div className="relative h-56 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <iframe
                  title="OpenStreetMap Austin HQ"
                  width="100%"
                  height="100%"
                  className="w-full h-full border-0"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-97.7550%2C30.2550%2C-97.7300%2C30.2800&amp;layer=mapnik&amp;marker=30.2672%2C-97.7431"
                  loading="lazy"
                />
              </div>
              <div className="px-2 pt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>100 Congress Ave, Austin, TX</span>
                <a
                  href="https://www.openstreetmap.org/?mlat=30.2672&amp;mlon=-97.7431#map=15/30.2672/-97.7431"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  View on OpenStreetMap →
                </a>
              </div>
            </div>

          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">Send Us a Message</h2>
              <p className="text-xs text-slate-500 mt-1">Our support agents answer inquiries within 2 hours or faster.</p>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(512) 555-0100"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help with your delivery or driver account?"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                  />
                </div>

                {/* Spam Protection Check */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Security Verification: What is 3 + 4? *
                  </label>
                  <input
                    type="text"
                    required
                    value={botCheck}
                    onChange={(e) => setBotCheck(e.target.value)}
                    placeholder="Enter answer (7)"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-semibold max-w-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending Message...' : 'Send Message'}</span>
                </button>

              </form>
            ) : (
              <div className="text-center py-10 space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-xl font-bold text-slate-900">Message Received!</h3>
                <p className="text-slate-600 text-sm">
                  Thank you, <strong>{name}</strong>. A support ticket has been opened and sent to {email}.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                    setBotCheck('');
                  }}
                  className="px-6 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200"
                >
                  Send Another Message
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
