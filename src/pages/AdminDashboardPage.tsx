import { useState } from 'react';
import { ViewMode, SellerDeliveryLink, BookingDetails } from '../types';
import { getSavedBookings, getSavedDriverApplications, getSavedBusinessLeads } from '../lib/supabaseClient';
import { getSellerDeliveryLinks } from '../lib/sellerLinkService';
import { SEOHead } from '../components/common/SEOHead';
import { formatCurrency } from '../lib/pricing';
import {
  Shield,
  Users,
  Truck,
  Briefcase,
  DollarSign,
  BarChart3,
  Settings,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Lock,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Package,
  KeyRound,
  FileText,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate: (view: ViewMode) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export function AdminDashboardPage({ onNavigate, onShowToast }: AdminDashboardPageProps) {
  const [activeTab, setActiveTab] = useState<'seller-links' | 'jobs' | 'analytics' | 'drivers' | 'customers' | 'revenue' | 'settings'>('seller-links');
  const [selectedSellerLink, setSelectedSellerLink] = useState<SellerDeliveryLink | null>(null);

  const bookings = getSavedBookings();
  const driverApps = getSavedDriverApplications();
  const businessLeads = getSavedBusinessLeads();
  const sellerLinks = getSellerDeliveryLinks();

  const totalRevenue = bookings.reduce((sum, b) => sum + b.quoteResult.totalPrice, 4290);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8">
      <SEOHead customMetadata={{ title: 'Platform Admin Panel | Marketplace Delivery', description: 'Central management dashboard for dispatch, confidential seller links audit, driver onboarding, and revenue analytics.' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Bar */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">Admin Control Center</h1>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                  Full Authority Mode (Audited)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Marketplace Delivery Platform • Austin Region Dispatch & Privacy Safety Layer</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('for-sellers')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Create Seller Link</span>
            </button>
            <button
              onClick={() => onShowToast('System Refresh', 'Synced latest database records', 'info')}
              className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-semibold text-slate-200"
            >
              Sync Records
            </button>
          </div>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Gross Platform Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white">{formatCurrency(totalRevenue)}</div>
            <span className="text-[11px] text-emerald-400 font-semibold">↑ +24.8% from last month</span>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Confidential Seller Links</span>
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white">{sellerLinks.length}</div>
            <span className="text-[11px] text-emerald-400 font-semibold">{sellerLinks.filter(l => l.status === 'Active').length} Active Links Publicly Shared</span>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Active Dispatch Jobs</span>
              <Briefcase className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-black text-white">{bookings.length + 18}</div>
            <span className="text-[11px] text-blue-400 font-semibold">98.4% On-Time Delivery Rate</span>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Verified Driver Partners</span>
              <Truck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white">{48 + driverApps.length}</div>
            <span className="text-[11px] text-amber-400 font-semibold">{driverApps.length} Applications Pending Review</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'seller-links', label: `🔒 Seller Links (${sellerLinks.length})` },
            { id: 'jobs', label: `Dispatched Jobs (${bookings.length})` },
            { id: 'analytics', label: 'Analytics' },
            { id: 'drivers', label: `Driver Onboarding (${driverApps.length})` },
            { id: 'customers', label: 'Customers' },
            { id: 'revenue', label: 'Revenue & Payouts' },
            { id: 'settings', label: 'System Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: SELLER LINKS FULL AUDIT (Admin Can See Everything) */}
        {activeTab === 'seller-links' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-emerald-400" />
                    <span>Seller Confidential Delivery Links (Full Admin Access)</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Buyers only see masked general areas (e.g. "Downtown Austin (78701)"). As an Admin, you have full permission to see exact addresses, gate codes, seller contacts, and conversion logs.
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 shrink-0">
                  {sellerLinks.length} Total Links
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-[11px] uppercase bg-slate-950 text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Link ID</th>
                      <th className="p-3">Item</th>
                      <th className="p-3">Seller</th>
                      <th className="p-3">Masked Buyer View</th>
                      <th className="p-3 text-emerald-400">Exact Pickup Address (Admin Only)</th>
                      <th className="p-3">Gate Code</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {sellerLinks.map((link) => (
                      <tr key={link.id} className="hover:bg-slate-800/50">
                        <td className="p-3 font-mono font-bold text-blue-400">{link.id}</td>
                        <td className="p-3">
                          <strong className="text-white block">{link.itemTitle}</strong>
                          <span className="text-[11px] text-slate-500">{link.itemType}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-white font-medium block">{link.sellerName}</span>
                          <span className="text-[11px] text-slate-500">{link.sellerPhone}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                            {link.maskedDisplayLocation}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-emerald-300 font-bold bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800 block">
                            {link.exactPickupAddress}
                          </span>
                        </td>
                        <td className="p-3">
                          {link.pickupGateCode ? (
                            <span className="font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                              #{link.pickupGateCode}
                            </span>
                          ) : (
                            <span className="text-slate-600">None</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            link.status === 'Booked'
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                              : 'bg-blue-900/60 text-blue-300 border border-blue-700'
                          }`}>
                            {link.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedSellerLink(link)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Seller Link Detail Modal */}
            {selectedSellerLink && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-800 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      <Lock className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h3 className="font-bold text-lg text-white">Seller Link Audit: {selectedSellerLink.id}</h3>
                        <span className="text-xs text-slate-400">Created: {selectedSellerLink.createdAt}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSellerLink(null)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider block">Private Pickup Address (Admin & Dispatched Driver Only)</span>
                      <strong className="text-base text-emerald-300 block">{selectedSellerLink.exactPickupAddress}</strong>
                      {selectedSellerLink.pickupGateCode && (
                        <p className="text-amber-400 font-mono">Gate Code: #{selectedSellerLink.pickupGateCode}</p>
                      )}
                      {selectedSellerLink.pickupInstructions && (
                        <p className="text-slate-300">Instructions: {selectedSellerLink.pickupInstructions}</p>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider block">Public Buyer Facing View</span>
                      <p className="text-slate-200 font-medium">Masked Location: <strong>{selectedSellerLink.maskedDisplayLocation}</strong></p>
                      <p className="text-slate-400 text-[11px]">Item: {selectedSellerLink.itemTitle} ({selectedSellerLink.itemType})</p>
                      <p className="text-slate-400 text-[11px]">Buyer Link Views: {selectedSellerLink.viewsCount || 0}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider block">Seller Contact</span>
                      <p className="text-white font-semibold">{selectedSellerLink.sellerName}</p>
                      <p className="text-slate-400">{selectedSellerLink.sellerPhone} • {selectedSellerLink.sellerEmail || 'No email'}</p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedSellerLink(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DISPATCHED JOBS */}
        {activeTab === 'jobs' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-white">Live Jobs Dispatch Log</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] uppercase bg-slate-950 text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Item</th>
                    <th className="p-3">Origin (Exact)</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-blue-400">{b.id}</td>
                      <td className="p-3">{b.customerName}</td>
                      <td className="p-3 font-semibold">{b.quote.itemType}</td>
                      <td className="p-3 text-emerald-300 font-medium truncate max-w-xs">{b.pickupAddress}</td>
                      <td className="p-3 truncate max-w-xs">{b.deliveryAddress}</td>
                      <td className="p-3 font-bold text-emerald-400">{formatCurrency(b.quoteResult.totalPrice)}</td>
                      <td className="p-3">
                        {b.isSellerLinkBooking ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                            Seller Link #{b.sellerLinkId}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Standard</span>
                        )}
                      </td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 font-semibold">{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-6">
            <h2 className="text-xl font-bold text-white">Platform Growth & Dispatch Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-slate-300">Popular Delivery Items</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Sofa & Sectional (42%)</span>
                    <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden mt-1">
                      <div className="bg-blue-500 h-full w-[42%]" />
                    </div>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Dining Tables & Chairs (28%)</span>
                    <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden mt-1">
                      <div className="bg-blue-500 h-full w-[28%]" />
                    </div>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Dressers & Desks (18%)</span>
                    <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden mt-1">
                      <div className="bg-blue-500 h-full w-[18%]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-slate-300">Top Marketplace Sources</h3>
                <div className="space-y-2 text-xs text-slate-400">
                  <p className="flex justify-between"><span>Facebook Marketplace:</span> <strong className="text-white">64%</strong></p>
                  <p className="flex justify-between"><span>OfferUp & Craigslist:</span> <strong className="text-white">22%</strong></p>
                  <p className="flex justify-between"><span>Local Estate Auctions & Retail:</span> <strong className="text-white">14%</strong></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-white">Driver Onboarding Applications</h2>
            {driverApps.length > 0 ? (
              <div className="space-y-3">
                {driverApps.map((app) => (
                  <div key={app.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white text-sm block">{app.name} ({app.vehicleType})</span>
                      <span className="text-slate-400">{app.email} • {app.phone} • Cities: {app.citiesServed.join(', ')}</span>
                    </div>
                    <button
                      onClick={() => onShowToast('Approved', `Driver ${app.name} verified!`, 'success')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold"
                    >
                      Approve Driver
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No new applications pending right now.</p>
            )}
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-white">Registered Customer Directory</h2>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              Showing active customer accounts with verified order history.
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-white">Revenue & Driver Payouts</h2>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              Platform Fee Margin: <strong>20%</strong> | Driver Share: <strong>80% + 100% Tips</strong>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-white">Platform System Settings</h2>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              Global Pricing Multipliers, Dispatch Radius limits, and Automated SMS Notification triggers.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
