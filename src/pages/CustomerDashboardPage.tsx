import { useState, FormEvent } from 'react';
import { ViewMode, BookingDetails } from '../types';
import { getSavedBookings } from '../lib/supabaseClient';
import { SEOHead } from '../components/common/SEOHead';
import { formatCurrency } from '../lib/pricing';
import { User, Package, FileText, MapPin, Heart, Gift, LogOut, CheckCircle2, Clock, Truck, Plus, ChevronRight } from 'lucide-react';

interface CustomerDashboardPageProps {
  onNavigate: (view: ViewMode) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export function CustomerDashboardPage({ onNavigate, onShowToast }: CustomerDashboardPageProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [email, setEmail] = useState('alex.morgan@example.com');
  const [password, setPassword] = useState('••••••••');
  const [activeTab, setActiveTab] = useState<'bookings' | 'invoices' | 'profile' | 'addresses' | 'drivers' | 'referrals'>('bookings');

  const bookings: BookingDetails[] = getSavedBookings();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
    onShowToast('Welcome back!', 'Logged into Customer Account', 'success');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-16">
        <SEOHead customMetadata={{ title: 'Customer Login | Marketplace Delivery', description: 'Log in to track your deliveries and manage invoices.' }} />
        
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Customer Login</h2>
            <p className="text-xs text-slate-500">Track orders, manage saved addresses & invoices.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-sm"
            >
              Sign In to Account
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <SEOHead customMetadata={{ title: 'Customer Dashboard | Marketplace Delivery', description: 'Manage your active deliveries, receipts, and profile.' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Bar */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 font-bold text-xl flex items-center justify-center border border-blue-200">
              AM
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Alex Morgan</h1>
              <p className="text-xs text-slate-500">alex.m@example.com • Member since 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('get-quote')}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Delivery Request</span>
            </button>
            <button
              onClick={() => setIsLoggedIn(false)}
              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar Menu Tabs */}
          <div className="lg:col-span-3 bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-1">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                activeTab === 'bookings' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Bookings ({bookings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                activeTab === 'invoices' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Invoices & Receipts</span>
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                activeTab === 'addresses' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Saved Addresses</span>
            </button>

            <button
              onClick={() => setActiveTab('drivers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                activeTab === 'drivers' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Favorite Drivers</span>
            </button>

            <button
              onClick={() => setActiveTab('referrals')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                activeTab === 'referrals' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>Referral Credits ($20)</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile Settings</span>
            </button>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-6">
            
            {activeTab === 'bookings' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Active & Past Bookings</h2>
                
                {bookings.map((b) => (
                  <div key={b.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">Order #{b.id}</span>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                          {b.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">Scheduled: {b.preferredDeliveryDate}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 font-medium block">Item</span>
                        <strong className="text-slate-900 text-sm">{b.quote.itemType}</strong>
                        <p className="text-slate-500 truncate">{b.itemDescription}</p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block">Pickup & Dropoff</span>
                        <p className="truncate">From: {b.pickupAddress}</p>
                        <p className="truncate">To: {b.deliveryAddress}</p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block">Total Upfront Price</span>
                        <strong className="text-slate-900 text-base">{formatCurrency(b.quoteResult.totalPrice)}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Invoices & PDF Receipts</h2>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">Receipt #INV-849201</span>
                    <span className="text-slate-500">Jul 24, 2026 • Sofa Delivery • $123.00</span>
                  </div>
                  <button
                    onClick={() => onShowToast('PDF Downloaded', 'Receipt downloaded to local drive', 'info')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Saved Addresses</h2>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">Home Address (Default)</span>
                  <p className="text-slate-600">310 Oakwood Ave, Apt 4B, Austin, TX 78704</p>
                </div>
              </div>
            )}

            {activeTab === 'drivers' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Favorite Drivers</h2>
                <p className="text-xs text-slate-500">Save preferred delivery partners for priority matching on future bookings.</p>
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-700 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Marcus V. (Ford F-150)</span>
                    <span className="text-amber-500">★ 5.0 (42 Deliveries)</span>
                  </div>
                  <span className="text-emerald-600 font-semibold">Verified Preferred</span>
                </div>
              </div>
            )}

            {activeTab === 'referrals' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Referral Program</h2>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 space-y-2">
                  <span className="text-xs uppercase font-bold text-blue-200">Give $20, Get $20</span>
                  <h3 className="text-2xl font-extrabold">Share Your Personal Referral Link</h3>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      readOnly
                      value="https://marketplacedelivery.com/ref/alexm20"
                      className="px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-mono w-full outline-none"
                    />
                    <button
                      onClick={() => onShowToast('Link Copied', 'Referral code copied to clipboard', 'info')}
                      className="px-4 py-2 rounded-xl bg-white text-blue-900 font-bold text-xs shrink-0"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Profile Settings</h2>
                <div className="space-y-3 max-w-md text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                    <input type="text" defaultValue="Alex Morgan" className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input type="tel" defaultValue="(512) 555-0144" className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                  </div>
                  <button
                    onClick={() => onShowToast('Saved', 'Profile updated', 'success')}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
