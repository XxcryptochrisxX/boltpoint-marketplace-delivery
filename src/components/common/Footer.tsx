import { ViewMode } from '../../types';
import { Truck, ShieldCheck, Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';
import { APP_NAME } from '../../constants';

interface FooterProps {
  onNavigate: (view: ViewMode) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Truck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">{APP_NAME}</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              The modern technology marketplace connecting buyers and sellers of Facebook Marketplace, OfferUp, estate sale, and local store items with verified, independent delivery partners.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Cargo protection subject to carrier policy and booking terms</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-blue-400 transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('for-sellers')} className="hover:text-emerald-400 transition-colors text-emerald-400 font-medium">
                  🔒 Seller Private Link
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('get-quote')} className="hover:text-blue-400 transition-colors">
                  Instant Quote Calculator
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-blue-400 transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('pricing')} className="hover:text-blue-400 transition-colors">
                  Transparent Pricing
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-blue-400 transition-colors">
                  Searchable FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Partners & Drivers */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Partnerships</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => onNavigate('become-driver')} className="hover:text-blue-400 transition-colors font-medium text-blue-400">
                  Become a Driver
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('businesses')} className="hover:text-blue-400 transition-colors">
                  Partner With Us (Businesses)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-blue-400 transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-blue-400 transition-colors">
                  Contact Support
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info & Socials */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Support</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Contact us for dispatch support</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>operations@boltpointlogistics.com</span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Austin, TX (National Expansion in progress)</span>
              </p>
            </div>

            <div className="pt-2">
              <span className="text-xs text-slate-400 block mb-2 font-medium">Follow Us</span>
              <div className="flex items-center gap-3">
                <a href="#facebook" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#instagram" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-pink-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#linkedin" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-blue-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar & Legal */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {APP_NAME}, Inc. All rights reserved.</p>
          
          <div className="flex flex-wrap items-center gap-6">
            <button onClick={() => onNavigate('privacy')} className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => onNavigate('terms')} className="hover:text-slate-300 transition-colors">
              Terms of Service
            </button>
            <button onClick={() => onNavigate('refund-policy')} className="hover:text-slate-300 transition-colors">
              Refund Policy
            </button>
            <button onClick={() => onNavigate('become-driver')} className="hover:text-slate-300 transition-colors">
              Become a Driver
            </button>
            <button onClick={() => onNavigate('businesses')} className="hover:text-slate-300 transition-colors">
              Partner With Us
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
