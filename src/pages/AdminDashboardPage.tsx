import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, RefreshCw, Shield, TriangleAlert } from 'lucide-react';
import { ViewMode } from '../types';
import { SEOHead } from '../components/common/SEOHead';

interface AdminOrder { session_id: string; order_number: string; status: string; amount_cents: number; seller_confirmation_status: string; pickup_status: string; shipday_order_id?: string; error?: string; created_at: string }
interface AdminOverview { admin: string; sellerAccounts: number; listingCounts: Array<{ status: string; total: number }>; orders: AdminOrder[] }
interface Props { onNavigate: (view: ViewMode) => void; onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void }

export function AdminDashboardPage({ onNavigate, onShowToast }: Props) {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const headers: HeadersInit = {};
      if (import.meta.env.DEV && import.meta.env.VITE_LOCAL_ADMIN_EMAIL) headers['x-bpl-local-admin-email'] = import.meta.env.VITE_LOCAL_ADMIN_EMAIL;
      const response = await fetch(`${import.meta.env.BASE_URL}api/admin/overview`, { headers });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load admin records.');
      setData(result);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load admin records.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const revenue = useMemo(() => (data?.orders || []).reduce((sum, order) => sum + Number(order.amount_cents || 0), 0) / 100, [data]);
  const activeListings = Number(data?.listingCounts.find((row) => row.status === 'Active')?.total || 0);
  const exportCsv = () => {
    if (!data) return;
    const headings = ['order_number','status','amount','seller_confirmation','pickup_status','shipday_order_id','created_at','error'];
    const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = data.orders.map((o) => [o.order_number,o.status,(o.amount_cents / 100).toFixed(2),o.seller_confirmation_status,o.pickup_status,o.shipday_order_id,o.created_at,o.error].map(escape).join(','));
    const url = URL.createObjectURL(new Blob([[headings.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `boltpoint-orders-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
    onShowToast('CSV Exported', `${data.orders.length} order records downloaded.`, 'success');
  };
  return <div className="min-h-screen bg-slate-950 py-8 text-slate-100"><SEOHead customMetadata={{ title: 'Admin Control Center | Marketplace Delivery', description: 'Protected BoltPoint operations dashboard.' }} /><div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="rounded-2xl bg-blue-600 p-3"><Shield className="h-6 w-6" /></div><div><h1 className="text-2xl font-black">Admin Control Center</h1><p className="text-xs text-slate-400">Protected operational records—not public navigation</p></div></div><div className="flex gap-2"><button onClick={() => void load()} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold"><RefreshCw className="h-4 w-4" />Refresh</button><button onClick={exportCsv} disabled={!data} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold disabled:opacity-50"><Download className="h-4 w-4" />Export orders</button></div></div>
    {loading && <div className="flex items-center justify-center gap-2 rounded-3xl border border-slate-800 bg-slate-900 p-12 text-sm"><Loader2 className="h-5 w-5 animate-spin" />Loading protected records…</div>}
    {error && <div className="rounded-3xl border border-rose-800 bg-rose-950/50 p-6"><div className="flex gap-3"><TriangleAlert className="h-5 w-5 text-rose-400" /><div><strong>Admin access unavailable</strong><p className="mt-1 text-sm text-rose-200">{error}</p><p className="mt-2 text-xs text-rose-300">For local testing, set VITE_LOCAL_ADMIN_EMAIL and ADMIN_EMAILS to the same approved address. Production will use Cloudflare Access.</p></div></div></div>}
    {data && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Collected delivery fees', `$${revenue.toFixed(2)}`],['Orders', data.orders.length],['Seller accounts', data.sellerAccounts],['Active listings', activeListings]].map(([label,value]) => <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}</div>
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900"><div className="border-b border-slate-800 p-5"><h2 className="font-black">Orders and dispatch handoff</h2><p className="mt-1 text-xs text-slate-400">Seller confirmation, Shipday state, pickup inspection, and errors.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-slate-950 text-slate-500"><tr>{['Order','Paid','Seller','Dispatch','Pickup','Shipday','Created','Issue'].map((h) => <th key={h} className="p-3 uppercase">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-800">{data.orders.map((o) => <tr key={o.session_id} className="hover:bg-slate-800/50"><td className="p-3 font-bold text-blue-400">{o.order_number}</td><td className="p-3">${(o.amount_cents / 100).toFixed(2)}</td><td className="p-3">{o.seller_confirmation_status}</td><td className="p-3">{o.status}</td><td className="p-3">{o.pickup_status}</td><td className="p-3">{o.shipday_order_id || '—'}</td><td className="p-3">{new Date(o.created_at).toLocaleString()}</td><td className="max-w-xs p-3 text-rose-300">{o.error || '—'}</td></tr>)}</tbody></table></div></div><button onClick={() => onNavigate('home')} className="text-xs font-bold text-slate-400 hover:text-white">Return to public site</button></>}
  </div></div>;
}
