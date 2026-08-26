import { useEffect, useMemo, useState } from 'react';
import { BellRing, Download, ExternalLink, Loader2, LogIn, RefreshCw, Shield, TriangleAlert } from 'lucide-react';
import { ViewMode } from '../types';
import { SEOHead } from '../components/common/SEOHead';

interface AdminOrder { session_id: string; order_number: string; status: string; amount_cents: number; seller_confirmation_status: string; scheduling_status: string; selected_delivery_window?: string; pickup_status: string; shipday_order_id?: string; error?: string; created_at: string }
interface AdminOverview { admin: string; sellerAccounts: number; listingCounts: Array<{ status: string; total: number }>; orders: AdminOrder[]; services?: Record<string, boolean> }
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
  const adminLoginUrl = `${import.meta.env.BASE_URL}api/admin/login`;
  const services = [
    { key: 'cloudflare', name: 'Cloudflare Workers, Access, D1 & R2', detail: 'Hosting, security, database and image storage', url: 'https://dash.cloudflare.com/' },
    { key: 'googleMaps', name: 'Google Maps Platform', detail: 'Address autocomplete and route mileage', url: 'https://console.cloud.google.com/google/maps-apis/metrics' },
    { key: 'stripe', name: 'Stripe', detail: 'Checkout, payments and refunds', url: 'https://dashboard.stripe.com/' },
    { key: 'resend', name: 'Resend', detail: 'Transactional email delivery', url: 'https://resend.com/overview' },
    { key: 'shipday', name: 'Shipday', detail: 'Dispatch and driver handoff', url: 'https://dispatch.shipday.com/' },
  ];
  const exportCsv = () => {
    if (!data) return;
    const headings = ['order_number','status','amount','seller_confirmation','pickup_status','shipday_order_id','created_at','error'];
    const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = data.orders.map((o) => [o.order_number,o.status,(o.amount_cents / 100).toFixed(2),o.seller_confirmation_status,o.pickup_status,o.shipday_order_id,o.created_at,o.error].map(escape).join(','));
    const url = URL.createObjectURL(new Blob([[headings.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `boltpoint-orders-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
    onShowToast('CSV Exported', `${data.orders.length} order records downloaded.`, 'success');
  };
  const confirmSchedule = async (order: AdminOrder) => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (import.meta.env.DEV && import.meta.env.VITE_LOCAL_ADMIN_EMAIL) headers['x-bpl-local-admin-email'] = import.meta.env.VITE_LOCAL_ADMIN_EMAIL;
      const response = await fetch(`${import.meta.env.BASE_URL}api/admin/orders/${order.order_number}/confirm-schedule`, { method: 'POST', headers });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to confirm this schedule.');
      onShowToast('Order Released to Dispatch', `${order.order_number} was sent to Shipday.`, 'success');
      await load();
    } catch (caught) { onShowToast('Schedule Not Confirmed', caught instanceof Error ? caught.message : 'Please try again.', 'error'); }
  };
  return <div className="min-h-screen bg-slate-950 py-8 text-slate-100"><SEOHead customMetadata={{ title: 'Admin Control Center | Marketplace Delivery', description: 'Protected BoltPoint operations dashboard.' }} /><div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="rounded-2xl bg-blue-600 p-3"><Shield className="h-6 w-6" /></div><div><h1 className="text-2xl font-black">Admin Control Center</h1><p className="text-xs text-slate-400">Protected operational records—not public navigation</p></div></div><div className="flex gap-2"><button onClick={() => void load()} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold"><RefreshCw className="h-4 w-4" />Refresh</button><button onClick={exportCsv} disabled={!data} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold disabled:opacity-50"><Download className="h-4 w-4" />Export orders</button></div></div>
    {loading && <div className="flex items-center justify-center gap-2 rounded-3xl border border-slate-800 bg-slate-900 p-12 text-sm"><Loader2 className="h-5 w-5 animate-spin" />Loading protected records…</div>}
    {error && <div className="rounded-3xl border border-rose-800 bg-rose-950/50 p-6"><div className="flex gap-3"><TriangleAlert className="h-5 w-5 shrink-0 text-rose-400" /><div><strong>Sign in required</strong><p className="mt-1 text-sm text-rose-200">Your protected admin session has not been established yet.</p><a href={adminLoginUrl} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-500"><LogIn className="h-4 w-4" />Sign in to Admin</a><p className="mt-3 text-xs text-rose-300">Use admin@boltpointlogistics.com and the one-time code Cloudflare emails you. You will return here automatically.</p></div></div></div>}
    {data && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Collected delivery fees', `$${revenue.toFixed(2)}`],['Orders', data.orders.length],['Seller accounts', data.sellerAccounts],['Active listings', activeListings]].map(([label,value]) => <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}</div>
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900"><div className="border-b border-slate-800 p-5"><h2 className="font-black">Orders and dispatch handoff</h2><p className="mt-1 text-xs text-slate-400">Seller availability, buyer selection, final schedule approval, and Shipday state.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-xs"><thead className="bg-slate-950 text-slate-500"><tr>{['Order','Paid','Seller','Scheduling','Selected window','Dispatch','Shipday','Action','Issue'].map((h) => <th key={h} className="p-3 uppercase">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-800">{data.orders.map((o) => <tr key={o.session_id} className="hover:bg-slate-800/50"><td className="p-3 font-bold text-blue-400">{o.order_number}</td><td className="p-3">${(o.amount_cents / 100).toFixed(2)}</td><td className="p-3">{o.seller_confirmation_status}</td><td className="p-3">{o.scheduling_status}</td><td className="p-3">{o.selected_delivery_window ? new Date(o.selected_delivery_window).toLocaleString() : '—'}</td><td className="p-3">{o.status}</td><td className="p-3">{o.shipday_order_id || '—'}</td><td className="p-3">{o.scheduling_status === 'ready_to_schedule' ? <button onClick={() => void confirmSchedule(o)} className="rounded-lg bg-orange-500 px-3 py-2 font-black text-white">Confirm &amp; Dispatch</button> : '—'}</td><td className="max-w-xs p-3 text-rose-300">{o.error || '—'}</td></tr>)}</tbody></table></div></div>
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5"><div className="flex items-start gap-3"><div className="rounded-xl bg-amber-500/15 p-2 text-amber-400"><BellRing className="h-5 w-5" /></div><div><h2 className="font-black">Service Usage &amp; Billing</h2><p className="mt-1 text-xs text-slate-400">Central shortcuts and configuration checks. Provider billing alerts remain active in each provider’s own account so an app outage cannot hide a cost warning.</p></div></div><div className="mt-5 grid gap-3 md:grid-cols-2">{services.map((service) => <a key={service.key} href={service.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-950 p-4 hover:border-blue-500"><div><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${data.services?.[service.key] === false ? 'bg-rose-500' : 'bg-emerald-500'}`} /><strong className="text-sm">{service.name}</strong></div><p className="mt-1 text-xs text-slate-400">{service.detail}</p></div><ExternalLink className="h-4 w-4 shrink-0 text-slate-400" /></a>)}</div><div className="mt-4 rounded-2xl border border-amber-800/60 bg-amber-950/30 p-4 text-xs text-amber-100"><strong>Alert coverage:</strong> Cloudflare and Google Cloud should have budget thresholds emailed to admin@boltpointlogistics.com. Stripe, Resend, and Shipday usage should be reviewed through the linked provider dashboards because their alert options depend on the active plan.</div></section><button onClick={() => onNavigate('home')} className="text-xs font-bold text-slate-400 hover:text-white">Return to public site</button></>}
  </div></div>;
}

