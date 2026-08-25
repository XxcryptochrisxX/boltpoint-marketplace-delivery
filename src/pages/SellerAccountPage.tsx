import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ExternalLink, Loader2, LogOut, Mail, Pause, Play, Store } from 'lucide-react';
import { ViewMode, SellerAccount } from '../types';
import { generateShareableSellerUrl, getSellerAccount, logoutSeller, requestSellerMagicLink, updateOwnedSellerLink } from '../lib/sellerLinkService';

interface Props {
  onNavigate: (view: ViewMode) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  justVerified?: boolean;
}

export function SellerAccountPage({ onNavigate, onShowToast, justVerified = false }: Props) {
  const [account, setAccount] = useState<SellerAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState('');

  const refresh = () => getSellerAccount().then(setAccount).finally(() => setLoading(false));
  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (justVerified && account) onShowToast('Seller Account Confirmed', 'You are signed in. Your saved listings are ready below.', 'success');
  }, [justVerified, account?.id]);

  const signIn = async (event: FormEvent) => {
    event.preventDefault(); setSending(true);
    try {
      const result = await requestSellerMagicLink({ email });
      setEmailSentTo(email);
      onShowToast('Check Your Email', result.message, 'success');
    } catch (error) {
      onShowToast('Unable to Sign In', error instanceof Error ? error.message : 'Please try again.', 'error');
    } finally { setSending(false); }
  };

  if (loading) return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  if (!account) return (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700"><Store /></div>
        <h1 className="text-2xl font-black text-slate-900">Seller account</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">Enter your email and we’ll send a secure, one-time sign-in link. No password to remember.</p>
        {emailSentTo ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h2 className="mt-3 text-lg font-black text-slate-900">Confirmation email sent</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">We sent a secure sign-in link to <strong>{emailSentTo}</strong>. Click it within 15 minutes and we’ll automatically open your seller workspace.</p>
            <button type="button" onClick={() => setEmailSentTo('')} className="mt-4 text-sm font-bold text-blue-700 underline">Use a different email</button>
          </div>
        ) : <form onSubmit={signIn} className="mt-6 space-y-4">
          <label className="block text-sm font-bold text-slate-700">Email address
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
          <button disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Email my sign-in link
          </button>
        </form>}
        <button onClick={() => onNavigate('for-sellers')} className="mt-4 flex w-full items-center justify-center gap-2 py-2 text-sm font-bold text-orange-700">Create a seller link <ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  );

  const changeStatus = async (id: string, status: 'Active' | 'Paused' | 'Expired') => {
    try { await updateOwnedSellerLink(id, status); await refresh(); onShowToast('Link Updated', `The link is now ${status.toLowerCase()}.`, 'success'); }
    catch (error) { onShowToast('Update Failed', error instanceof Error ? error.message : 'Please try again.', 'error'); }
  };

  return (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        {justVerified && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-sm" role="status">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
            <div><p className="font-black">Your seller account is confirmed</p><p className="mt-1 text-sm text-emerald-800">You’re signed in, and the listing you saved is available in your seller workspace below.</p></div>
          </div>
        )}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-xs font-extrabold uppercase tracking-wider text-orange-600">Seller workspace</p><h1 className="text-3xl font-black text-slate-900">Welcome, {account.name || 'Seller'}</h1><p className="mt-1 text-sm text-slate-600">Manage the links buyers can use to arrange delivery.</p></div>
          <button onClick={async () => { await logoutSeller(); setAccount(null); }} className="flex items-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
        <div className="grid gap-4">
          {account.links.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-bold text-slate-800">No saved links yet.</p><button onClick={() => onNavigate('for-sellers')} className="mt-4 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white">Create your first link</button></div>}
          {account.links.map((link) => (
            <article key={link.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${link.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{link.status}</span><span className="text-xs font-bold text-slate-400">{link.id}</span></div><h2 className="mt-2 text-lg font-black text-slate-900">{link.itemTitle}</h2><p className="mt-1 text-sm text-slate-500">{link.viewsCount} buyer views · Created {new Date(link.createdAt).toLocaleDateString()}</p></div>
                <div className="flex flex-wrap gap-2">
                  <a href={generateShareableSellerUrl(link)} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"><ExternalLink className="h-4 w-4" /> Buyer link</a>
                  {link.status === 'Active' ? <button onClick={() => changeStatus(link.id, 'Paused')} className="flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-sm font-bold text-white"><Pause className="h-4 w-4" /> Pause</button> : <button onClick={() => changeStatus(link.id, 'Active')} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white"><Play className="h-4 w-4" /> Reactivate</button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
