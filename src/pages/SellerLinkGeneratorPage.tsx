import { useState, FormEvent } from 'react';
import { ViewMode, ItemCategory, SellerDeliveryLink, CreatedSellerDeliveryLink } from '../types';
import { ITEM_CATEGORIES, APP_NAME } from '../constants';
import { formatCurrency } from '../lib/pricing';
import { createSellerDeliveryLinkRemote, generateShareableSellerUrl, generateMaskedLocationString, requestSellerMagicLink } from '../lib/sellerLinkService';
import { SEOHead } from '../components/common/SEOHead';
import { AddressFields } from '../components/common/AddressFields';
import { AddressParts, EMPTY_ADDRESS, formatFullAddress, isCompleteAddressParts } from '../lib/addressValidation';
import { MAX_LISTING_PHOTOS, prepareListingImage } from '../lib/imageUpload';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  PlusCircle,
  Share2,
  Package,
  MapPin,
  Clock,
  Phone,
  DollarSign,
  Info,
  Shield,
  Eye,
  AlertCircle,
  Truck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Upload,
  X
} from 'lucide-react';

interface SellerLinkGeneratorPageProps {
  onNavigate: (view: ViewMode) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onOpenSellerLink?: (link: SellerDeliveryLink) => void;
}

export function SellerLinkGeneratorPage({ onNavigate, onShowToast, onOpenSellerLink }: SellerLinkGeneratorPageProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'guide'>('create');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  
  // Form State
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [itemTitle, setItemTitle] = useState('');
  const [itemType, setItemType] = useState<ItemCategory>('Sofa');
  const [askingPrice, setAskingPrice] = useState<string>('');
  const [itemDescription, setItemDescription] = useState('');
  const [conditionRating, setConditionRating] = useState<'Excellent' | 'Good' | 'Fair' | 'Needs Repair'>('Good');
  const [knownDefects, setKnownDefects] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [conditionFlags, setConditionFlags] = useState({ stainsOrOdors: false, petExposure: false, smokeExposure: false, structuralDamage: false, missingPieces: false, electricalComponents: false });
  const [conditionCertified, setConditionCertified] = useState(false);
  const [pickupAddressParts, setPickupAddressParts] = useState<AddressParts>({ ...EMPTY_ADDRESS });
  const exactPickupAddress = formatFullAddress(pickupAddressParts);
  const pickupZip = pickupAddressParts.zip;
  const pickupCityState = [pickupAddressParts.city, pickupAddressParts.state].filter(Boolean).join(', ');
  const [pickupGateCode, setPickupGateCode] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [pickupAvailability, setPickupAvailability] = useState('Flexible daytime pickup / Evenings after 5 PM');
  const [payer, setPayer] = useState<'buyer_pays' | 'seller_pays' | 'split_50_50'>('buyer_pays');
  const [itemPhotos, setItemPhotos] = useState<string[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);

  const [generatedLink, setGeneratedLink] = useState<CreatedSellerDeliveryLink | null>(null);
  const [showLinkPopup, setShowLinkPopup] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allLinks, setAllLinks] = useState<SellerDeliveryLink[]>([]);
  const [accountEmail, setAccountEmail] = useState('');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [isSendingAccountLink, setIsSendingAccountLink] = useState(false);
  const [accountEmailSent, setAccountEmailSent] = useState(false);

  const handleCreateLink = async (e: FormEvent) => {
    e.preventDefault();

    if (!sellerName.trim() || !sellerPhone.trim() || !sellerEmail.trim() || !itemTitle.trim() || !isCompleteAddressParts(pickupAddressParts)) {
      onShowToast('Missing Required Fields', 'Please provide your name, phone, email, item title, and exact pickup address.', 'error');
      return;
    }
    if (itemPhotos.length < 4 || !dimensions.trim() || !conditionCertified) {
      onShowToast('Complete Item Verification', 'Add at least four current photos, enter dimensions, and certify the condition disclosure.', 'error');
      return;
    }

    try {
    const newLink = await createSellerDeliveryLinkRemote({
      sellerName: sellerName.trim(),
      sellerPhone: sellerPhone.trim(),
      sellerEmail: sellerEmail.trim() || undefined,
      itemTitle: itemTitle.trim(),
      itemType,
      askingPrice: askingPrice ? parseFloat(askingPrice) : undefined,
      itemDescription: itemDescription.trim() || undefined,
      itemPhotos,
      conditionRating,
      knownDefects: knownDefects.trim() || 'No known defects disclosed.',
      dimensions: dimensions.trim(),
      hasStainsOrOdors: conditionFlags.stainsOrOdors,
      hasPetExposure: conditionFlags.petExposure,
      hasSmokeExposure: conditionFlags.smokeExposure,
      hasStructuralDamage: conditionFlags.structuralDamage,
      hasMissingPieces: conditionFlags.missingPieces,
      hasElectricalComponents: conditionFlags.electricalComponents,
      conditionCertifiedAt: new Date().toISOString(),
      exactPickupAddress: exactPickupAddress.trim(),
      pickupZip: pickupZip.trim(),
      pickupCityState: pickupCityState.trim(),
      pickupGateCode: pickupGateCode.trim() || undefined,
      pickupInstructions: pickupInstructions.trim() || undefined,
      pickupAvailability: pickupAvailability.trim() || undefined,
      payer,
    });

    setGeneratedLink(newLink);
    setAccountEmail(newLink.sellerEmail || sellerEmail.trim());
    setAcceptedLegal(false);
    setAccountEmailSent(false);
    setShowLinkPopup(true);
    setAllLinks((current) => [newLink, ...current.filter((link) => link.id !== newLink.id)]);
    onShowToast('Confidential Link Created!', `Link #${newLink.id} is ready to send to prospective buyers.`, 'success');
    } catch (error) {
      onShowToast('Unable to Create Link', error instanceof Error ? error.message : 'Please try again.', 'error');
    }
  };

  const handleSaveToAccount = async () => {
    if (!generatedLink?.claimToken || !accountEmail || !acceptedLegal) return;
    setIsSendingAccountLink(true);
    try {
      const result = await requestSellerMagicLink({ email: accountEmail, claimToken: generatedLink.claimToken, termsAccepted: true });
      setAccountEmailSent(true);
      onShowToast('Check Your Email', result.message, 'success');
    } catch (error) {
      onShowToast('Unable to Create Account', error instanceof Error ? error.message : 'Please try again.', 'error');
    } finally { setIsSendingAccountLink(false); }
  };

  const continueFromItem = () => {
    if (!itemTitle.trim()) {
      onShowToast('Add Your Item', 'Enter a listing title before continuing.', 'error');
      return;
    }
    if (itemPhotos.length < 4 || !dimensions.trim() || !conditionCertified) {
      onShowToast('Verify Item Condition', 'Add at least four current photos, enter the dimensions, and certify that all known defects are disclosed.', 'error');
      return;
    }
    setWizardStep(2);
  };

  const itemStepChecks = [
    { label: 'Listing title', complete: Boolean(itemTitle.trim()) },
    { label: 'Dimensions', complete: Boolean(dimensions.trim()) },
    { label: '4 current photos', complete: itemPhotos.length >= 4 },
    { label: 'Condition certification', complete: conditionCertified },
  ];
  const itemStepComplete = itemStepChecks.every((check) => check.complete);

  const continueFromPickup = () => {
    if (!isCompleteAddressParts(pickupAddressParts)) {
      onShowToast('Complete Pickup Address', 'Select or enter a complete street address, city, state, and ZIP code.', 'error');
      return;
    }
    setWizardStep(3);
  };

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const availableSlots = MAX_LISTING_PHOTOS - itemPhotos.length;
    if (availableSlots <= 0) {
      onShowToast('Photo Limit Reached', `You can add up to ${MAX_LISTING_PHOTOS} photos.`, 'info');
      return;
    }
    setIsProcessingPhotos(true);
    try {
      const preparedPhotos = await Promise.all(Array.from(files).slice(0, availableSlots).map(prepareListingImage));
      setItemPhotos((current) => [...current, ...preparedPhotos].slice(0, MAX_LISTING_PHOTOS));
      onShowToast('Photos Added', `${preparedPhotos.length} listing photo${preparedPhotos.length === 1 ? '' : 's'} ready.`, 'success');
    } catch (error) {
      onShowToast('Photo Upload Failed', error instanceof Error ? error.message : 'Please choose valid image files.', 'error');
    } finally {
      setIsProcessingPhotos(false);
    }
  };

  const removePhoto = (index: number) => setItemPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));

  const handleCopyLink = (link: SellerDeliveryLink) => {
    const fullUrl = generateShareableSellerUrl(link);
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(link.id);
    onShowToast('Link Copied to Clipboard!', 'Paste this into your Facebook Marketplace, OfferUp, or Craigslist message.', 'success');
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleTestBuyerView = (link: SellerDeliveryLink) => {
    if (onOpenSellerLink) {
      onOpenSellerLink(link);
    } else {
      // Navigate to booking page with seller link attached
      window.history.pushState({}, '', `/?seller_link=${link.id}`);
      onNavigate('book-now');
    }
  };

  const liveMaskedPreview = generateMaskedLocationString(exactPickupAddress || 'Your Street Address', pickupZip || '33602', pickupCityState || 'Tampa, FL');

  return (
    <div className="min-h-screen bg-slate-50 py-10 sm:py-14">
      <SEOHead
        customMetadata={{
          title: 'Sell Faster with Secure Local Delivery | Marketplace Delivery',
          description: 'Help marketplace buyers say yes by including simple, secure local delivery. Create a private delivery link with instant buyer pricing and a protected pickup address.',
        }}
      />

      {generatedLink && showLinkPopup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="seller-link-ready-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setShowLinkPopup(false);
          }}
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-emerald-200 bg-white p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() => setShowLinkPopup(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close link popup"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Check className="h-8 w-8" />
            </div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700">Seller link created</p>
            <h2 id="seller-link-ready-title" className="pr-8 text-2xl font-black text-slate-900">
              Your link is ready to send
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Share this private booking link with the buyer for <strong>{generatedLink.itemTitle}</strong>. Your exact pickup address remains protected.
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="break-all font-mono text-sm text-slate-700">{generateShareableSellerUrl(generatedLink)}</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleCopyLink(generatedLink)}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-700"
              >
                {copiedId === generatedLink.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedId === generatedLink.id ? 'Link Copied!' : 'Copy Buyer Link'}
              </button>
              <button
                type="button"
                onClick={() => handleTestBuyerView(generatedLink)}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-800 transition-colors hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4 text-blue-600" />
                Preview Buyer View
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <h3 className="font-black text-slate-900">Save and manage this link</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">Create your free seller account without re-entering your details. We’ll email you a secure sign-in link.</p>
              {accountEmailSent ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4 text-center shadow-sm" role="status">
                  <Check className="mx-auto h-9 w-9 rounded-full bg-emerald-100 p-2 text-emerald-700" />
                  <p className="mt-2 font-black text-slate-900">Confirmation email sent</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">We sent a one-time confirmation link to <strong>{accountEmail}</strong>. It will not expire. Once confirmed, your seller account and saved listings remain available whenever you sign in.</p>
                  <p className="mt-2 text-xs font-bold text-emerald-700">After confirmation, this site will automatically open your seller page with this listing saved.</p>
                  <p className="mt-3 text-[11px] text-slate-500">Don’t see it? Check your spam or promotions folder.</p>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <input type="email" required value={accountEmail} onChange={(event) => setAccountEmail(event.target.value)} placeholder="Your email address" className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500" />
                  <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                    <input type="checkbox" checked={acceptedLegal} onChange={(event) => setAcceptedLegal(event.target.checked)} className="mt-0.5 h-4 w-4 accent-orange-600" />
                    <span>I agree to the <button type="button" onClick={() => onNavigate('terms')} className="font-bold text-blue-700 underline">Terms of Service</button> and acknowledge the <button type="button" onClick={() => onNavigate('privacy')} className="font-bold text-blue-700 underline">Privacy Policy</button>.</span>
                  </label>
                  <button type="button" onClick={handleSaveToAccount} disabled={!accountEmail || !acceptedLegal || isSendingAccountLink} className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">
                    {isSendingAccountLink ? 'Sending secure email…' : 'Create Account & Save Link'}
                  </button>
                  <p className="text-center text-[11px] text-slate-500">No marketing emails. No password required.</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowLinkPopup(false)}
              className="mt-4 w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
            >
              Close and continue managing links
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Built to Help Marketplace Sellers Close Faster</span>
          </div>

          <h1 className="font-black tracking-tight">
            <span className="block whitespace-nowrap text-[clamp(1.55rem,5vw,3rem)] text-slate-900">Sell Your Listings Faster...</span>
            <span className="mt-1 block text-[clamp(1.25rem,3.8vw,2.25rem)] text-blue-600">Offer secure, local delivery</span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Enter your pickup address securely once. We generate a masked link to share with buyers. 
            Buyers get instant delivery pricing from your general area, while your exact address is only disclosed to the assigned, verified delivery partner upon confirmed booking.
          </p>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <EyeOff className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Address Masked for Buyers</h3>
              <p className="text-slate-500 text-xs mt-1 leading-normal">
                Buyers only see your verified neighborhood and ZIP code (e.g. <em>Central Tampa • 33602</em>). No strangers know your street or apartment.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Insured Direct Dispatch</h3>
              <p className="text-slate-500 text-xs mt-1 leading-normal">
                Only the assigned delivery partner receives full navigation details once the paid order and seller availability are confirmed.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Eliminate Flaky Buyers</h3>
              <p className="text-slate-500 text-xs mt-1 leading-normal">
                Buyers pay delivery upfront and schedule exact arrival times. No endless "is this available?" or missed pickups at your door.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-center">
          <div className="inline-flex bg-slate-200/80 p-1.5 rounded-2xl shadow-inner border border-slate-300">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'create'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Pickup Link</span>
            </button>

            <button
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'manage'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>My Active Links ({allLinks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'guide'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Seller Safety Guide</span>
            </button>
          </div>
        </div>

        {/* TAB 1: CREATE LINK */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Form: 7 Columns */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Create Confidential Pickup Link</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Fill out your item and private pickup location details.</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
              </div>

              <form onSubmit={handleCreateLink} className="space-y-6">
                <div className="grid grid-cols-3 gap-2" aria-label={`Step ${wizardStep} of 3`}>
                  {[
                    { number: 1, label: 'Item' },
                    { number: 2, label: 'Pickup' },
                    { number: 3, label: 'Contact' },
                  ].map((step) => (
                    <button key={step.number} type="button" onClick={() => step.number < wizardStep && setWizardStep(step.number as 1 | 2 | 3)} className={`rounded-xl border px-2 py-2.5 text-center transition-colors ${wizardStep === step.number ? 'border-blue-600 bg-blue-600 text-white shadow-md' : step.number < wizardStep ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                      <span className="block text-[10px] font-black uppercase tracking-wider">Step {step.number}</span>
                      <span className="block text-xs font-bold sm:text-sm">{step.label}</span>
                    </button>
                  ))}
                </div>

                {/* Section 1: Item Information */}
                <div className={`${wizardStep === 1 ? 'block' : 'hidden'} space-y-5 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6`}>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    <span>1. Item Details</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Listing Item Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. West Elm Haven Sectional Sofa (Grey)"
                        value={itemTitle}
                        onChange={(e) => setItemTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Item Category *
                      </label>
                      <select
                        value={itemType}
                        onChange={(e) => setItemType(e.target.value as ItemCategory)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      >
                        {ITEM_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Marketplace Asking Price (Optional)
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="number"
                          placeholder="e.g. 450"
                          value={askingPrice}
                          onChange={(e) => setAskingPrice(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Current Condition *</label>
                      <select value={conditionRating} onChange={(e) => setConditionRating(e.target.value as typeof conditionRating)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        <option>Excellent</option><option>Good</option><option>Fair</option><option>Needs Repair</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Dimensions (W × D × H) *</label>
                      <input value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="e.g. 84 × 36 × 34 inches" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>

                    <div className="sm:col-span-2 space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800">Condition & defect disclosure *</label>
                        <p className="mt-1 text-[11px] text-slate-600">Select everything that applies. Buyers see this before paying.</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {[
                          ['stainsOrOdors', 'Stains or odors'], ['petExposure', 'Pet exposure'], ['smokeExposure', 'Smoke exposure'],
                          ['structuralDamage', 'Tears or structural damage'], ['missingPieces', 'Missing pieces'], ['electricalComponents', 'Reclining/electrical components'],
                        ].map(([key, label]) => (
                          <label key={key} className="flex items-center gap-2 rounded-xl border border-amber-200 bg-white p-2.5 text-xs text-slate-700">
                            <input type="checkbox" checked={conditionFlags[key as keyof typeof conditionFlags]} onChange={(e) => setConditionFlags((current) => ({ ...current, [key]: e.target.checked }))} className="h-4 w-4 accent-orange-600" />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                      <textarea value={knownDefects} onChange={(e) => setKnownDefects(e.target.value)} rows={3} placeholder="Describe every stain, scratch, tear, broken part, odor, or other defect. Enter ‘None known’ if there are none." className="w-full rounded-xl border border-amber-200 bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                      <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
                        <input type="checkbox" checked={conditionCertified} onChange={(e) => setConditionCertified(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-orange-600" />
                        <span>I certify these photos are current and I have disclosed all known material defects. This disclosure will be saved with any completed order.</span>
                      </label>
                    </div>

                    <div className="sm:col-span-2">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="block text-xs font-semibold text-slate-700">Current Listing Photos (Minimum 4) *</label>
                        <span className="text-[11px] text-slate-500">{itemPhotos.length}/{MAX_LISTING_PHOTOS}</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {itemPhotos.map((photo, index) => (
                          <div key={index} className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            <img src={photo} alt={`Listing photo ${index + 1}`} className="h-full w-full object-cover" />
                            <button type="button" onClick={() => removePhoto(index)} aria-label={`Remove listing photo ${index + 1}`} className="absolute right-1.5 top-1.5 rounded-full bg-slate-900/80 p-1 text-white hover:bg-rose-600">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        {itemPhotos.length < MAX_LISTING_PHOTOS && (
                          <label className={`flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-blue-500 hover:bg-blue-50 ${isProcessingPhotos ? 'pointer-events-none opacity-60' : ''}`}>
                            <Upload className="mb-1 h-5 w-5 text-blue-600" />
                            <span className="text-[10px] font-bold">{isProcessingPhotos ? 'Processing...' : 'Add Photos'}</span>
                            <input type="file" accept="image/*" multiple className="hidden" disabled={isProcessingPhotos} onChange={(event) => { void handlePhotoUpload(event.target.files); event.target.value = ''; }} />
                          </label>
                        )}
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">Upload front, back, both sides, and close-ups of every defect. Up to 6 images, 10 MB each.</p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Your Email (Availability Confirmation) *</label>
                      <input type="email" required placeholder="you@example.com" value={sellerEmail} onChange={(e) => setSellerEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                      <p className="mt-1 text-[11px] text-slate-500">We will ask you to reconfirm that the item is available before dispatch.</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3" aria-live="polite">
                    <p className="mb-2 text-xs font-bold text-slate-700">Before continuing:</p>
                    <div className="grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2">
                      {itemStepChecks.map((check) => (
                        <div key={check.label} className={`flex items-center gap-1.5 text-xs font-semibold ${check.complete ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {check.complete ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                          <span>{check.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button type="button" onClick={continueFromItem} aria-describedby="item-step-help" className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:bg-blue-800">
                    Next: Private Pickup <ArrowRight className="h-4 w-4" />
                  </button>
                  <p id="item-step-help" className={`text-center text-xs ${itemStepComplete ? 'font-semibold text-emerald-700' : 'text-slate-500'}`}>
                    {itemStepComplete ? 'Item details complete — tap Next to continue.' : 'Tap Next at any time to see what still needs attention.'}
                  </p>
                </div>

                {/* Section 2: Confidential Pickup Details */}
                <div className={`${wizardStep === 2 ? 'block' : 'hidden'} space-y-5 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>2. Private Pickup Details (Protected)</span>
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Hidden from Buyer
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Privacy Promise:</strong> This exact street address and unit number will NEVER be shown on public booking links. Only the assigned dispatch driver receives it on pickup day.
                    </span>
                  </div>

                  <div className="space-y-4">
                    <AddressFields legend="Exact Pickup Address" value={pickupAddressParts} onChange={setPickupAddressParts} />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Gate Code / Building Entry (Driver Only)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. #4912 or Call Box 04"
                        value={pickupGateCode}
                        onChange={(e) => setPickupGateCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Preferred Pickup Availability
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Weekdays after 5pm, Saturday morning"
                        value={pickupAvailability}
                        onChange={(e) => setPickupAvailability(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Driver Pickup Instructions (Loading dock, stairs, elevator)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ground floor patio access, help load from garage"
                        value={pickupInstructions}
                        onChange={(e) => setPickupInstructions(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setWizardStep(1)} className="flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /> Back</button>
                    <button type="button" onClick={continueFromPickup} className="flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700">Next: Contact <ArrowRight className="h-4 w-4" /></button>
                  </div>
                </div>

                {/* Section 3: Seller Contact Details */}
                <div className={`${wizardStep === 3 ? 'block' : 'hidden'} space-y-5 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6`}>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>3. Seller Contact & Dispatch Coordination</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sarah J."
                        value={sellerName}
                        onChange={(e) => setSellerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Mobile Phone (For Driver Coordination) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="(512) 555-0199"
                        value={sellerPhone}
                        onChange={(e) => setSellerPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                {/* Delivery payment choice */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <label className="block text-xs font-semibold text-slate-700">
                    Delivery Payment Model
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPayer('buyer_pays')}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        payer === 'buyer_pays'
                          ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold ring-1 ring-blue-600'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block font-bold">Buyer Pays (Standard)</span>
                      <span className="text-[11px] font-normal text-slate-500 block mt-0.5">
                        Buyer pays full delivery at checkout.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayer('seller_pays')}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        payer === 'seller_pays'
                          ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold ring-1 ring-blue-600'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block font-bold">Seller Covers Delivery</span>
                      <span className="text-[11px] font-normal text-slate-500 block mt-0.5">
                        Free delivery incentive for buyer.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayer('split_50_50')}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        payer === 'split_50_50'
                          ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold ring-1 ring-blue-600'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block font-bold">Split 50 / 50</span>
                      <span className="text-[11px] font-normal text-slate-500 block mt-0.5">
                        Both parties share the transport cost.
                      </span>
                    </button>
                  </div>
                </div>

                  <div className="grid gap-3 sm:grid-cols-[auto,1fr]">
                    <button type="button" onClick={() => setWizardStep(2)} className="flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /> Back</button>
                    <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/35 active:scale-[0.99]">
                      <Lock className="w-5 h-5" /><span>Generate Confidential Seller Link</span><ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

              </form>
            </div>

            {/* Right Comparison & Link Output: 5 Columns */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Generated Link Card (If active) */}
              {generatedLink && (
                <div className="bg-emerald-950 text-white rounded-3xl p-6 border border-emerald-700 shadow-xl space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-900/80 px-3 py-1 rounded-full border border-emerald-600 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Link Ready ({generatedLink.id})</span>
                    </span>
                    <span className="text-xs text-emerald-300 font-medium">100% Address Protected</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{generatedLink.itemTitle}</h3>
                    <p className="text-xs text-emerald-200/80 mt-0.5">
                      Send this link to any prospective buyer on Facebook Marketplace or OfferUp.
                    </p>
                  </div>

                  <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-700 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-emerald-100 truncate">
                      {generateShareableSellerUrl(generatedLink)}
                    </span>
                    <button
                      onClick={() => handleCopyLink(generatedLink)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs shrink-0 flex items-center gap-1 transition-all"
                    >
                      {copiedId === generatedLink.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === generatedLink.id ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => handleTestBuyerView(generatedLink)}
                      className="py-2.5 px-3 rounded-xl bg-white text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      <span>Preview Buyer View</span>
                    </button>

                    <button
                      onClick={() => {
                        const text = `Hey! Here is the delivery booking link for the ${generatedLink.itemTitle}: ${generateShareableSellerUrl(generatedLink)}`;
                        navigator.clipboard.writeText(text);
                        onShowToast('Marketplace Message Copied!', 'Paste into your buyer chat.', 'success');
                      }}
                      className="py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Copy Chat Text</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Side-by-Side Visual Proof Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>How We Protect Your Privacy</span>
                </div>

                {/* What Buyer Sees */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>1. What The Buyer Sees (Public Link)</span>
                    </span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                      Safe & Masked
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="font-semibold text-slate-700">Pickup Area:</span>
                      <span className="text-slate-900 font-medium">{liveMaskedPreview}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
                      🔒 Street name, house number, and gate code are blocked. Real distance & quote is computed automatically without revealing your doorstep.
                    </div>
                  </div>
                </div>

                {/* What Driver & Admin See */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>2. What Dispatched Driver & Admin See</span>
                    </span>
                    <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">
                      Secured Dispatch
                    </span>
                  </div>

                  <div className="bg-slate-900 text-slate-200 rounded-2xl p-3.5 border border-slate-800 text-xs space-y-2 font-mono">
                    <div className="text-emerald-400 font-bold">● DISPATCH ACCESS UNLOCKED:</div>
                    <div className="text-xs space-y-1">
                      <p className="text-slate-300">Exact: {exactPickupAddress || '742 Evergreen Terrace, Apt 3B'}</p>
                      <p className="text-slate-400">Gate/Access: {pickupGateCode || '#4912 (Call upon arrival)'}</p>
                      <p className="text-slate-400">Seller Phone: {sellerPhone || '(512) 555-0199'} ({sellerName || 'Sarah'})</p>
                    </div>
                  </div>
                </div>

                {/* Quick Marketplace Tip */}
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-xs text-blue-900 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span>How to reply on Facebook Marketplace:</span>
                  </p>
                  <p className="text-slate-600 italic bg-white p-2.5 rounded-xl border border-blue-200">
                    "I can do $XXX. You can book safe delivery straight to your house with live tracking using this link: [Your Pickup Link]"
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 2: MANAGE ACTIVE LINKS */}
        {activeTab === 'manage' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Your Created Seller Links</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track link views, copy links for marketplace chats, and test buyer booking views.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('create')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Seller Link</span>
              </button>
            </div>

            {allLinks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allLinks.map((link) => (
                  <div
                    key={link.id}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={link.itemPhotos[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80'}
                          alt={link.itemTitle}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <span className="text-[11px] font-bold font-mono text-blue-600">{link.id}</span>
                          <h4 className="font-bold text-slate-900 text-sm leading-snug">{link.itemTitle}</h4>
                          <span className="text-xs text-slate-500">{link.itemType} • {link.pickupCityState}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          link.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {link.status === 'Active' ? '● Active' : '✓ Booked'}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                      <p className="text-slate-600">
                        <strong className="text-slate-800">Masked Display:</strong> {link.maskedDisplayLocation}
                      </p>
                      <p className="text-slate-500">
                        <strong className="text-slate-800">Private Address (Admin/Driver):</strong> {link.exactPickupAddress}
                      </p>
                      {link.askingPrice && (
                        <p className="text-slate-600">
                          <strong className="text-slate-800">Item Price:</strong> {formatCurrency(link.askingPrice)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => handleCopyLink(link)}
                        className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === link.id ? 'Copied' : 'Copy Link'}</span>
                      </button>

                      <button
                        onClick={() => handleTestBuyerView(link)}
                        className="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Buyer View</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700">No seller links created yet</h3>
                <p className="text-xs text-slate-500">Create your first masked pickup link to send to buyers.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  Create Link Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SELLER SAFETY GUIDE */}
        {activeTab === 'guide' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-2xl font-extrabold text-slate-900">Marketplace Seller Safety & Protection Guide</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Why should I never post my exact address on Facebook Marketplace?
                </h3>
                <p className="text-xs leading-relaxed">
                  Posting public addresses or giving street numbers to random marketplace accounts invites unverified visitors, no-shows, and scams. A masked delivery link limits the exact pickup address to the assigned delivery partner.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  How do I get paid for my item?
                </h3>
                <p className="text-xs leading-relaxed">
                  You can collect item payment directly through your preferred payment app (Venmo, Zelle, Cash, or Marketplace Pay) prior to release, while the delivery fee is handled separately through our platform.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-600" />
                  What happens on pickup day?
                </h3>
                <p className="text-xs leading-relaxed">
                  Our driver arrives during your designated time window, performs a timestamped inspection of the item, and loads it with blankets and heavy-duty straps.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  How is damage protection handled?
                </h3>
                <p className="text-xs leading-relaxed">
                  Coverage depends on the assigned carrier’s active policy and the booking terms. Pickup and delivery photos document condition and support any eligible claim; coverage is not an unconditional BoltPoint guarantee.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
