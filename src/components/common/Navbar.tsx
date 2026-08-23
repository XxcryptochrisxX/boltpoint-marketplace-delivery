import { useState } from 'react';
import { ViewMode } from '../../types';
import { Menu, X, ChevronDown, User, Shield, Briefcase, Phone, HelpCircle, ArrowRight, Lock, Sparkles } from 'lucide-react';
import boltPointLogo from '../../assets/images/boltpoint-logistics-logo.png';

interface NavbarProps {
  activeView: ViewMode;
  onNavigate: (view: ViewMode) => void;
}

export function Navbar({ activeView, onNavigate }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState(false);

  const navItems: { label: string; view: ViewMode; badge?: string }[] = [
    { label: 'Home', view: 'home' },
    { label: 'For Sellers', view: 'for-sellers', badge: 'Private Link' },
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
    setDashboardDropdownOpen(false);
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

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const isActive = activeView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => handleNavClick(item.view)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'text-blue-600 bg-blue-50/80 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action CTA & Portals */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* Dashboard Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDashboardDropdownOpen(!dashboardDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
              >
                <span>Portals</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dashboardDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dashboardDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Select Interface
                  </div>
                  <button
                    onClick={() => handleNavClick('for-sellers')}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition-colors"
                  >
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-medium block leading-tight">Seller Private Link</span>
                      <span className="text-[11px] text-slate-400 block">Mask address for buyers</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleNavClick('customer-dashboard')}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Customer Portal</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('driver-dashboard')}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
                  >
                    <Briefcase className="w-4 h-4 text-slate-500" />
                    <span>Driver Dashboard</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('admin-dashboard')}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-slate-500" />
                    <span>Admin Panel</span>
                  </button>
                </div>
              )}
            </div>

            {/* Primary Get Quote Button */}
            <button
              onClick={() => handleNavClick('get-quote')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-[0.98]"
            >
              <span>Get a Quote</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => handleNavClick('for-sellers')}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold"
            >
              🔒 Sellers
            </button>
            <button
              onClick={() => handleNavClick('get-quote')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-sm"
            >
              Get Quote
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
              {item.badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Dashboards & Portals
            </p>
            <button
              onClick={() => handleNavClick('for-sellers')}
              className="w-full text-left px-4 py-2 text-sm text-emerald-800 bg-emerald-50/50 hover:bg-emerald-50 rounded-lg flex items-center gap-2 font-medium"
            >
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Seller Confidential Link Generator</span>
            </button>
            <button
              onClick={() => handleNavClick('customer-dashboard')}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
            >
              <User className="w-4 h-4 text-blue-600" />
              <span>Customer Portal</span>
            </button>
            <button
              onClick={() => handleNavClick('driver-dashboard')}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Driver Dashboard</span>
            </button>
            <button
              onClick={() => handleNavClick('admin-dashboard')}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Admin Panel (All Details & Audits)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

