import { useState } from 'react';
import { ViewMode } from '../../types';
import { Menu, X, ChevronDown, User, ArrowRight, Store } from 'lucide-react';
import boltPointLogo from '../../assets/images/boltpoint-logistics-logo.png';

interface NavbarProps {
  activeView: ViewMode;
  onNavigate: (view: ViewMode) => void;
}

export function Navbar({ activeView, onNavigate }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const navItems: { label: string; view: ViewMode }[] = [
    { label: 'Home', view: 'home' },
    { label: 'How It Works', view: 'how-it-works' },
    { label: 'Pricing', view: 'pricing' },
    { label: 'Become a Driver', view: 'become-driver' },
    { label: 'Businesses', view: 'businesses' },
    { label: 'FAQ', view: 'faq' },
    { label: 'Contact', view: 'contact' },
  ];

  const handleNavClick = (view: ViewMode) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none lg:mr-6 xl:mr-10"
          >
            <img src={boltPointLogo} alt="BoltPoint Logistics" className="w-16 h-14 sm:w-20 sm:h-16 object-contain shrink-0" />
            <div className="text-center leading-none">
              <span className="font-bold text-base sm:text-lg tracking-tight text-blue-600 drop-shadow-[0_1px_1px_rgba(37,99,235,0.22)] block">
                Marketplace
              </span>
              <span className="font-bold text-sm sm:text-base tracking-tight text-blue-600 drop-shadow-[0_1px_1px_rgba(37,99,235,0.22)] block mt-0.5">
                Delivery
              </span>
            </div>
          </button>

          {/* Focused desktop actions */}
          <div className="hidden lg:flex items-center gap-3 ml-auto">
            <button
              onClick={() => handleNavClick('for-sellers')}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-extrabold shadow-md transition-all active:scale-[0.98] ${
                activeView === 'for-sellers'
                  ? 'border-orange-600 bg-orange-600 text-white shadow-orange-500/30'
                  : 'border-orange-300 bg-orange-500 text-white shadow-orange-500/25 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Sell with Delivery</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleNavClick('get-quote')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              <span>Get a Quote</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                aria-expanded={moreMenuOpen}
              >
                <Menu className="w-4 h-4" />
                <span>Menu</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50">
                  <div className="grid grid-cols-2 gap-1">
                    {navItems.map((item) => (
                      <button
                        key={item.view}
                        onClick={() => handleNavClick(item.view)}
                        className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === item.view ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="my-2 border-t border-slate-200" />
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account Access</div>
                  <button onClick={() => handleNavClick('seller-account')} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg flex items-center gap-2.5 transition-colors"><Store className="w-4 h-4 text-orange-500" /><span>Seller Account</span></button>
                  <button
                    onClick={() => handleNavClick('customer-dashboard')}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg flex items-center gap-2.5 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Customer Portal</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => handleNavClick('for-sellers')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold shadow-md shadow-orange-500/25"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sell with Delivery</span>
              <span className="sm:hidden">Sell + Delivery</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNavClick(item.view)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-base font-medium transition-colors flex items-center justify-between ${
                activeView === item.view
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}

          <button
            onClick={() => handleNavClick('get-quote')}
            className="w-full text-left px-4 py-2.5 rounded-lg text-base font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 flex items-center justify-between"
          >
            <span>Get a Delivery Quote</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Account Access
            </p>
            <button onClick={() => handleNavClick('seller-account')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 rounded-lg flex items-center gap-2"><Store className="w-4 h-4 text-orange-600" /><span>Seller Account</span></button>
            <button
              onClick={() => handleNavClick('customer-dashboard')}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
            >
              <User className="w-4 h-4 text-blue-600" />
              <span>Customer Portal</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

