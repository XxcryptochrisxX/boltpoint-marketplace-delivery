import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, Copy, Edit3, ExternalLink, Loader2, LogOut, Mail, MapPin, Pause, Phone, Play, Store, User, X } from 'lucide-react';
import { ITEM_CATEGORIES } from '../constants';
import { ViewMode, SellerAccount, SellerDeliveryLink } from '../types';
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
  const [copiedLinkId, setCopiedLinkId] = useState('');
  const [editingLinkId, setEditingLinkId] = useState('');
  const [editDraft, setEditDraft] = useState<SellerDeliveryLink | null>(null);
  const [savingLink, setSavingLink] = useState(false);

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

  const copyBuyerLink = async (link: SellerDeliveryLink) => {
    try {
      await navigator.clipboard.writeText(generateShareableSellerUrl(link));
      setCopiedLinkId(link.id);
      window.setTimeout(() => setCopiedLinkId(''), 2000);
      onShowToast('Buyer Link Copied', 'Paste it into your marketplace conversation.', 'success');
    } catch { onShowToast('Copy Failed', 'Select the link and copy it manually.', 'error'); }
  };

  const startEditing = (link: SellerDeliveryLink) => { setEditingLinkId(link.id); setEditDraft({ ...link }); };
  const saveListing = async () => {
    if (!editDraft || !editDraft.itemTitle.trim() || !editDraft.sellerName.trim() || !editDraft.sellerPhone.trim()) {
      onShowToast('Missing Information', 'Item title, seller name, and phone are required.', 'error'); return;
    }
    setSavingLink(true);
    try {
      await updateOwnedSellerLink(editDraft.id, {
        itemTitle: editDraft.itemTitle, itemType: editDraft.itemType, askingPrice: editDraft.askingPrice,
        itemDescription: editDraft.itemDescription, sellerName: editDraft.sellerName, sellerPhone: editDraft.sellerPhone,
        sellerEmail: editDraft.sellerEmail, pickupAvailability: editDraft.pickupAvailability,
        pickupInstructions: editDraft.pickupInstructions, pickupGateCode: editDraft.pickupGateCode, payer: editDraft.payer,
      });
      await refresh(); setEditingLinkId(''); setEditDraft(null);
      onShowToast('Listing Updated', 'Buyers will see the revised listing immediately.', 'success');
    } catch (error) { onShowToast('Update Failed', error instanceof Error ? error.message : 'Please try again.', 'error'); }
    finally { setSavingLink(false); }
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
        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm" aria-labelledby="seller-contact-heading">
          <div className="flex items-center gap-2 text-blue-700"><User className="h-5 w-5" /><h2 id="seller-contact-heading" className="font-black">Saved seller contact</h2></div>
          <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
            <p><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Name</span>{account.name || account.links[0]?.sellerName || 'Not provided'}</p>
            <p><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Email</span><span className="mt-1 flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600" />{account.email}</span></p>
            <p><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Phone</span><span className="mt-1 flex items-center gap-2"><Phone className="h-4 w-4 text-blue-600" />{account.phone || account.links[0]?.sellerPhone || 'Not provided'}</span></p>
          </div>
        </section>
        <div className="grid gap-4">
          {account.links.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-bold text-slate-800">No saved links yet.</p><button onClick={() => onNavigate('for-sellers')} className="mt-4 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white">Create your first link</button></div>}
          {account.links.map((link) => (
            <article key={link.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-orange-700">Share this buyer checkout link</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input readOnly value={generateShareableSellerUrl(link)} onFocus={(event) => event.currentTarget.select()} aria-label={`Buyer checkout link for ${link.itemTitle}`} className="min-w-0 flex-1 rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700" />
                  <button type="button" onClick={() => copyBuyerLink(link)} className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-white hover:bg-orange-600">
                    {copiedLinkId === link.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copiedLinkId === link.id ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${link.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{link.status}</span><span className="text-xs font-bold text-slate-400">{link.id}</span></div><h2 className="mt-2 text-lg font-black text-slate-900">{link.itemTitle}</h2><p className="mt-1 text-sm text-slate-500">{link.viewsCount} buyer views · Created {new Date(link.createdAt).toLocaleDateString()}</p><p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4 text-orange-500" />{link.pickupCityState} {link.pickupZip}</p><p className="mt-1 text-sm text-slate-600">Contact: {link.sellerName} · {link.sellerPhone}{link.sellerEmail ? ` · ${link.sellerEmail}` : ''}</p></div>
                <div className="flex flex-wrap gap-2">
                  <a href={generateShareableSellerUrl(link)} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"><ExternalLink className="h-4 w-4" /> Preview Buyer View</a>
                  {link.status !== 'Booked' && <button onClick={() => startEditing(link)} className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700"><Edit3 className="h-4 w-4" /> Edit Listing</button>}
                  {link.status === 'Active' ? <button onClick={() => changeStatus(link.id, 'Paused')} className="flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-sm font-bold text-white"><Pause className="h-4 w-4" /> Pause</button> : link.status !== 'Booked' && <button onClick={() => changeStatus(link.id, 'Active')} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white"><Play className="h-4 w-4" /> Reactivate</button>}
                </div>
              </div>
              {link.status === 'Booked' && <p className="mt-4 rounded-xl bg-slate-100 p-3 text-xs font-semibold text-slate-600">This listing is locked because a buyer completed checkout.</p>}
              {editingLinkId === link.id && editDraft && (
                <div className="mt-5 space-y-4 border-t border-slate-200 pt-5">
                  <div className="flex items-center justify-between"><div><h3 className="font-black text-slate-900">Edit listing</h3><p className="text-xs text-slate-500">Changes appear in the buyer link immediately after saving.</p></div><button type="button" onClick={() => { setEditingLinkId(''); setEditDraft(null); }} aria-label="Close editor" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-bold text-slate-700 sm:col-span-2">Item title *<input value={editDraft.itemTitle} onChange={(e) => setEditDraft({ ...editDraft, itemTitle: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /></label>
                    <label className="text-xs font-bold text-slate-700">Category<select value={editDraft.itemType} onChange={(e) => setEditDraft({ ...editDraft, itemType: e.target.value as SellerDeliveryLink['itemType'] })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">{ITEM_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
                    <label className="text-xs font-bold text-slate-700">Asking price<input type="number" min="0" value={editDraft.askingPrice ?? ''} onChange={(e) => setEditDraft({ ...editDraft, askingPrice: e.target.value ? Number(e.target.value) : undefined })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /></label>
                    <label className="text-xs font-bold text-slate-700 sm:col-span-2">Description<textarea value={editDraft.itemDescription || ''} onChange={(e) => setEditDraft({ ...editDraft, itemDescription: e.target.value })} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /></label>
                    <label className="text-xs font-bold text-slate-700">Seller name *<input value={editDraft.sellerName} onChange={(e) => setEditDraft({ ...editDraft, sellerName: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /></label>
                    <label className="text-xs font-bold text-slate-700">Seller phone *<input type="tel" value={editDraft.sellerPhone} onChange={(e) => setEditDraft({ ...editDraft, sellerPhone: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /></label>
                    <label className="text-xs font-bold text-slate-700 sm:col-span-2">Pickup availability<input value={editDraft.pickupAvailability || ''} onChange={(e) => setEditDraft({ ...editDraft, pickupAvailability: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /></label>
                    <label className="text-xs font-bold text-slate-700 sm:col-span-2">Private driver pickup instructions<textarea value={editDraft.pickupInstructions || ''} onChange={(e) => setEditDraft({ ...editDraft, pickupInstructions: e.target.value })} rows={2} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /></label>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => { setEditingLinkId(''); setEditDraft(null); }} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700">Cancel</button><button type="button" disabled={savingLink} onClick={saveListing} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-60">{savingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save Changes</button></div>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
