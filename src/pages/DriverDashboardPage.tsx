import { useState } from 'react';
import { ViewMode, DriverJob } from '../types';
import { INITIAL_DRIVER_JOBS } from '../constants';
import { SEOHead } from '../components/common/SEOHead';
import { Truck, DollarSign, Star, Calendar, Clock, CheckCircle2, Navigation, Phone, Shield, ArrowRight, UserCheck } from 'lucide-react';
import { formatCurrency } from '../lib/pricing';

interface DriverDashboardPageProps {
  onNavigate: (view: ViewMode) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export function DriverDashboardPage({ onNavigate, onShowToast }: DriverDashboardPageProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'accepted' | 'completed' | 'earnings' | 'ratings' | 'schedule'>('available');
  
  const [jobsList, setJobsList] = useState<DriverJob[]>(INITIAL_DRIVER_JOBS);
  const [totalDriverEarnings, setTotalDriverEarnings] = useState(485);

  const handleAcceptJob = (jobId: string) => {
    setJobsList((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: 'Accepted' } : j))
    );
    const job = jobsList.find((j) => j.id === jobId);
    onShowToast('Job Accepted!', `Claimed job #${jobId} (${job?.itemType}) for ${formatCurrency(job?.payout || 0)}`, 'success');
  };

  const handleCompleteJob = (jobId: string) => {
    const job = jobsList.find((j) => j.id === jobId);
    setJobsList((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: 'Completed' } : j))
    );
    if (job) {
      setTotalDriverEarnings((prev) => prev + job.payout);
    }
    onShowToast('Job Completed!', `Earned ${formatCurrency(job?.payout || 0)}. Funds added to weekly balance.`, 'success');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-16">
        <SEOHead customMetadata={{ title: 'Driver Portal Login | Marketplace Delivery', description: 'Access available delivery jobs and track earnings.' }} />
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-xl space-y-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Truck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Driver Partner Login</h2>
          <button
            onClick={() => setIsLoggedIn(true)}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-sm"
          >
            Log In as Driver (Marcus V.)
          </button>
        </div>
      </div>
    );
  }

  const availableJobs = jobsList.filter((j) => j.status === 'Available');
  const acceptedJobs = jobsList.filter((j) => j.status === 'Accepted');
  const completedJobs = jobsList.filter((j) => j.status === 'Completed');

  return (
    <div className="min-h-screen bg-slate-900 text-white py-8">
      <SEOHead customMetadata={{ title: 'Driver Partner Portal | Marketplace Delivery', description: 'Available job board, earnings dashboard, and delivery navigation.' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header KPI Banner */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center border border-blue-500 shadow-md">
              MV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">Marcus Vance</h1>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                  Ford F-150 (Verified)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Austin Metro Dispatch • Cargo Insurance Active</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 block">Weekly Balance</span>
              <strong className="text-xl text-emerald-400 font-bold">{formatCurrency(totalDriverEarnings)}</strong>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 block">Rating</span>
              <strong className="text-xl text-amber-400 font-bold flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>4.98</span>
              </strong>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700 col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-400 block">Accepted Jobs</span>
              <strong className="text-xl text-blue-400 font-bold">{acceptedJobs.length} Active</strong>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'available' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Available Jobs ({availableJobs.length})
          </button>

          <button
            onClick={() => setActiveTab('accepted')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'accepted' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Accepted Jobs ({acceptedJobs.length})
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'completed' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Completed Jobs ({completedJobs.length})
          </button>

          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'earnings' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Earnings Breakdown
          </button>

          <button
            onClick={() => setActiveTab('ratings')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'ratings' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Customer Ratings
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'schedule' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            My Schedule
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Available Local Delivery Jobs</h2>
            
            {availableJobs.map((job) => (
              <div key={job.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4 hover:border-blue-500/60 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-lg">{job.itemType} Pickup</span>
                    <span className="text-xs text-blue-400 font-semibold bg-blue-950 px-2.5 py-0.5 rounded-md border border-blue-800">
                      {job.timeSlot} ({job.date})
                    </span>
                  </div>
                  <span className="text-2xl font-black text-emerald-400">
                    {formatCurrency(job.payout)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-400 block">Pickup Location (Seller)</span>
                    <p className="font-semibold text-white">{job.pickupAddress}</p>
                    <p className="text-slate-400 mt-1">Contact: {job.sellerName}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Delivery Location (Buyer)</span>
                    <p className="font-semibold text-white">{job.deliveryAddress}</p>
                    <p className="text-slate-400 mt-1">Contact: {job.buyerName}</p>
                  </div>
                </div>

                {job.notes && (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-300">
                    <strong>Special Instructions:</strong> {job.notes}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleAcceptJob(job.id)}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    <span>Accept Job & Claim {formatCurrency(job.payout)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'accepted' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Accepted Jobs in Progress</h2>
            {acceptedJobs.length > 0 ? (
              acceptedJobs.map((job) => (
                <div key={job.id} className="bg-slate-800 rounded-2xl p-6 border border-emerald-500/40 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                    <span className="font-bold text-white">{job.itemType} Delivery (#{job.id})</span>
                    <span className="text-emerald-400 font-black text-xl">{formatCurrency(job.payout)}</span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-2">
                    <p><strong>Pickup:</strong> {job.pickupAddress} ({job.sellerName})</p>
                    <p><strong>Delivery:</strong> {job.deliveryAddress} ({job.buyerName})</p>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={() => handleCompleteJob(job.id)}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                    >
                      Mark Job as Delivered & Collect Payout
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No active claimed jobs right now. Select an available job above!</p>
            )}
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 space-y-4">
            <h2 className="text-xl font-bold text-white">Payout & Earnings History</h2>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-xs space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Total Earned This Week:</span>
                <strong className="text-emerald-400 font-bold text-sm">{formatCurrency(totalDriverEarnings)}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Next Automatic Direct Deposit:</span>
                <strong className="text-white">Monday, Jul 27 (Chase Account •••• 8812)</strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ratings' && (
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 space-y-4">
            <h2 className="text-xl font-bold text-white">Customer Reviews & Ratings</h2>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-xs space-y-2">
              <span className="text-amber-400 font-bold text-base">★ 5.0 Rating</span>
              <p className="text-slate-300 italic">&ldquo;Marcus was super careful bringing our dining table up two flights of stairs. Highly recommended!&rdquo;</p>
              <span className="text-slate-500 block">— Sarah J. (Austin, 78704)</span>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 space-y-4">
            <h2 className="text-xl font-bold text-white">My Weekly Availability Schedule</h2>
            <p className="text-xs text-slate-400">Dispatch system matches jobs based on your set hours.</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold">Monday (8 AM - 6 PM)</span>
              <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold">Wednesday (8 AM - 6 PM)</span>
              <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold">Friday (8 AM - 6 PM)</span>
              <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold">Saturday (7 AM - 7 PM)</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
