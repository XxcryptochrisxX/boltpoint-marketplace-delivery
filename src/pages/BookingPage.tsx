import { useState, useMemo, useEffect, FormEvent } from 'react';
import { ViewMode, QuoteInput, BookingDetails, SellerDeliveryLink } from '../types';
import { calculateQuote, formatCurrency, COST_PER_ESTIMATED_MILE, INCLUDED_MILES } from '../lib/pricing';
import { getAccurateDeliveryDistance } from '../lib/mapsService';
import { getSellerDeliveryLinkByIdRemote, incrementSellerLinkViewsRemote } from '../lib/sellerLinkService';
import { SEOHead } from '../components/common/SEOHead';
import { AddressFields } from '../components/common/AddressFields';
import { AddressParts, EMPTY_ADDRESS, formatFullAddress, isCompleteAddressParts, parseFullAddress } from '../lib/addressValidation';
import {
  Truck,
  ShieldCheck,
  CheckCircle2,
  Upload,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  User,
  Phone,
  Mail,
  FileText,
  ArrowRight,
  X,
  Loader2,
  Compass,
  Lock,
  EyeOff,
  Sparkles,
  Package,
  Info,
  DollarSign
} from 'lucide-react';

interface BookingPageProps {
  initialQuote: QuoteInput | null;
  activeSellerLink?: SellerDeliveryLink | null;
  onNavigate: (view: ViewMode) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export function BookingPage({ initialQuote, activeSellerLink: propSellerLink, onNavigate, onShowToast }: BookingPageProps) {
  // Seller Link State (either passed via props or from URL ?seller_link=SL-...)
  const [sellerLink, setSellerLink] = useState<SellerDeliveryLink | null>(propSellerLink || null);

  useEffect(() => {
    if (propSellerLink) {
      setSellerLink(propSellerLink);
      return;
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const linkId = params.get('seller_link');
      if (linkId) {
        void getSellerDeliveryLinkByIdRemote(linkId).then((found) => {
          if (found) {
            setSellerLink(found);
            void incrementSellerLinkViewsRemote(found.id);
            onShowToast('Seller Link Loaded', `Loaded pickup details for ${found.itemTitle}`, 'info');
          } else {
            onShowToast('Seller Link Not Found', 'This seller link is unavailable or expired.', 'error');
          }
        }).catch((error) => onShowToast('Unable to Load Seller Link', error instanceof Error ? error.message : 'Please try again.', 'error'));
      }
    }
  }, [propSellerLink]);

  // Quote State
  const [quoteInput, setQuoteInput] = useState<QuoteInput>(
    initialQuote || {
      pickupZip: sellerLink?.pickupZip || '78701',
      deliveryZip: '78704',
      itemType: sellerLink?.itemType || 'Sofa',
      stairs: 0,
      elevator: false,
      assemblyNeeded: false,
      rushDelivery: false,
    }
  );

  // Sync state if seller link loads dynamically
  useEffect(() => {
    if (sellerLink) {
      setQuoteInput((prev) => ({
        ...prev,
        pickupZip: sellerLink.pickupZip,
        itemType: sellerLink.itemType,
      }));
      setPickupAddress(sellerLink.exactPickupAddress);
      setPickupParts(parseFullAddress(sellerLink.exactPickupAddress));
      setSellerName(sellerLink.sellerName);
      setSellerPhone(sellerLink.sellerPhone);
      if (sellerLink.itemDescription) {
        setItemDescription(sellerLink.itemDescription);
      }
      if (sellerLink.itemPhotos && sellerLink.itemPhotos.length > 0) {
        setUploadedPhotos(sellerLink.itemPhotos);
      }
    }
  }, [sellerLink]);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [pickupAddress, setPickupAddress] = useState(
    sellerLink?.exactPickupAddress || initialQuote?.pickupZip || ''
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    initialQuote?.deliveryZip || ''
  );
  const [pickupParts, setPickupParts] = useState<AddressParts>(() => parseFullAddress(sellerLink?.exactPickupAddress || initialQuote?.pickupZip || ''));
  const [deliveryParts, setDeliveryParts] = useState<AddressParts>(() => parseFullAddress(initialQuote?.deliveryZip || ''));
  const [routeConfirmed, setRouteConfirmed] = useState(Boolean(initialQuote?.accurateMiles && initialQuote?.isOpenStreetMapVerified));
  const [routeError, setRouteError] = useState('');
  const [sellerName, setSellerName] = useState(sellerLink?.sellerName || '');
  const [sellerPhone, setSellerPhone] = useState(sellerLink?.sellerPhone || '');
  const [itemDescription, setItemDescription] = useState(sellerLink?.itemDescription || '');
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  });
  const [preferredDeliveryTimeSlot, setPreferredDeliveryTimeSlot] = useState('2:00 PM - 3:00 PM');
  const [specialNotes, setSpecialNotes] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(sellerLink?.itemPhotos || []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<BookingDetails | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (params.get('checkout') === 'cancelled') {
      onShowToast('Checkout Cancelled', 'No payment was taken. Your delivery has not been dispatched.', 'info');
    }
    if (params.get('checkout') !== 'success' || !sessionId) return;
    fetch(`${import.meta.env.BASE_URL}api/checkout-session/${encodeURIComponent(sessionId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.paid) throw new Error(data.error || 'Payment is still processing.');
        setCompletedBooking({ ...data.booking, id: data.orderNumber, status: 'Pending', createdAt: new Date().toISOString() });
        onShowToast('Payment Confirmed', `Order ${data.orderNumber} is being processed for dispatch.`, 'success');
      })
      .catch((error) => onShowToast('Confirmation Pending', error.message, 'info'));
  }, []);

  const [isRecalculatingRoute, setIsRecalculatingRoute] = useState(false);

  const confirmRoute = async () => {
    const pickup = sellerLink?.exactPickupAddress || formatFullAddress(pickupParts);
    const delivery = formatFullAddress(deliveryParts);
    if ((!sellerLink && !isCompleteAddressParts(pickupParts)) || !isCompleteAddressParts(deliveryParts)) {
      setRouteError('Complete every required address field before calculating distance.');
      return;
    }
    setIsRecalculatingRoute(true);
    try {
      setRouteError('');
      const res = await getAccurateDeliveryDistance(pickup, delivery);
      setPickupAddress(pickup);
      setDeliveryAddress(delivery);
      setQuoteInput(prev => ({ ...prev, pickupZip: pickup, deliveryZip: delivery, accurateMiles: res.miles, drivingDuration: res.durationFormatted, isOpenStreetMapVerified: true }));
      setRouteConfirmed(true);
    } catch (err) {
      setRouteConfirmed(false);
      setRouteError(err instanceof Error ? err.message : 'Unable to confirm this route.');
    } finally {
      setIsRecalculatingRoute(false);
    }
  };

  const changePickupParts = (value: AddressParts) => { setPickupParts(value); setRouteConfirmed(false); setRouteError(''); };
  const changeDeliveryParts = (value: AddressParts) => { setDeliveryParts(value); setRouteConfirmed(false); setRouteError(''); };

  const rawQuoteResult = useMemo(() => calculateQuote(quoteInput), [quoteInput]);
  const unconfirmedQuoteResult = useMemo(() => ({ ...rawQuoteResult, basePrice: 69, distanceFee: 0, stairsFee: 0, assemblyFee: 0, rushFee: 0, totalPrice: 69, estimatedMiles: 0, drivingDuration: undefined }), [rawQuoteResult]);
  const pricedQuoteResult = routeConfirmed ? rawQuoteResult : unconfirmedQuoteResult;

  // Adjust final price if seller pays or splits
  const quoteResult = useMemo(() => {
    if (!sellerLink) return pricedQuoteResult;
    
    if (sellerLink.payer === 'seller_pays') {
      return {
        ...pricedQuoteResult,
        totalPrice: 0,
      };
    } else if (sellerLink.payer === 'split_50_50') {
      return {
        ...pricedQuoteResult,
        totalPrice: Math.round(pricedQuoteResult.totalPrice / 2),
      };
    }
    return pricedQuoteResult;
  }, [pricedQuoteResult, sellerLink]);

  const handlePhotoUpload = (files: FileList | null) => {
    if (files && files[0]) {
      const simulatedUrl = URL.createObjectURL(files[0]);
      setUploadedPhotos((prev) => [...prev, simulatedUrl]);
      onShowToast('Photo Attached', 'Item photo added to seller inspection sheet.', 'info');
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitBooking = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerEmail || !pickupAddress || !deliveryAddress) {
      onShowToast('Missing Fields', 'Please complete your contact info and delivery address.', 'error');
      return;
    }
    if (!routeConfirmed) {
      onShowToast('Confirm Delivery Address', 'Confirm the pickup and delivery addresses and calculate the route before checkout.', 'error');
      return;
    }
    if (sellerLink && sellerLink.payer !== 'buyer_pays') {
      onShowToast('Dispatch Assistance Required', 'Seller-paid and split-payment bookings require manual dispatch until account billing is enabled.', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      const booking = {
        sellerLinkId: sellerLink?.id,
        isSellerLinkBooking: Boolean(sellerLink),
        maskedPickupLocation: sellerLink?.maskedDisplayLocation,
        quote: quoteInput,
        quoteResult,
        customerName,
        customerPhone,
        customerEmail,
        pickupAddress: sellerLink?.exactPickupAddress || pickupAddress,
        deliveryAddress,
        sellerName: sellerName || sellerLink?.sellerName || 'Seller (To Be Contacted)',
        sellerPhone: sellerPhone || sellerLink?.sellerPhone || 'N/A',
        itemDescription: itemDescription || sellerLink?.itemTitle || `${quoteInput.itemType} from local seller`,
        preferredDeliveryDate,
        preferredDeliveryTimeSlot,
        itemPhotos: uploadedPhotos,
        specialNotes: specialNotes + (sellerLink?.pickupInstructions ? ` | Seller Notes: ${sellerLink.pickupInstructions}` : ''),
      };
      const response = await fetch(`${import.meta.env.BASE_URL}api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Unable to start secure checkout.');
      window.location.assign(data.url);
    } catch (err) {
      onShowToast('Checkout Error', err instanceof Error ? err.message : 'Unable to start checkout. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <SEOHead customMetadata={{ title: 'Complete Booking | Marketplace Delivery', description: 'Schedule pickup and delivery with Google-validated address and route mileage.' }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Step 2: Confirm Order & Schedule
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Schedule Your Item Delivery
          </h1>
          <p className="text-slate-600 text-sm">
            Fill in delivery details so our insured delivery partner can pick up and deliver your item.
          </p>
        </div>

        {/* CONFIDENTIAL SELLER LINK VERIFICATION CARD */}
        {sellerLink && (
          <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500/40 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      🔒 Verified Seller Link #{sellerLink.id}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Item listed by {sellerLink.sellerName}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">{sellerLink.itemTitle}</h2>
                </div>
              </div>

              {sellerLink.askingPrice && (
                <div className="text-left sm:text-right bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Item Listed Price</span>
                  <strong className="text-lg text-slate-900 font-extrabold">{formatCurrency(sellerLink.askingPrice)}</strong>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Confidential Pickup Location:</strong>
                  <span>{sellerLink.maskedDisplayLocation}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-950 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Protected Address Dispatch:</strong>
                  <span>The seller's exact house/unit address is routed directly to your assigned driver once pickup starts.</span>
                </div>
              </div>
            </div>

            {sellerLink.payer === 'seller_pays' && (
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Great news! The seller has agreed to cover 100% of your delivery cost. Your delivery fee is $0.00.</span>
              </div>
            )}

            {sellerLink.payer === 'split_50_50' && (
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>50/50 Delivery Split: The seller is paying half the delivery cost. 50% discount applied at checkout.</span>
              </div>
            )}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Form (Collect Customer & Seller details) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-8">
            
            <form onSubmit={handleSubmitBooking} className="space-y-8">
              
              {/* Section 1: Customer Contact */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                  1. Your Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(512) 555-0144"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Section 2: Addresses */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                  2. Pickup & Delivery Addresses
                </h3>

                {/* Pickup Address: Masked if from Seller Link */}
                {sellerLink ? (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Pickup Location (Protected Seller Address)
                    </label>
                    <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900">{sellerLink.maskedDisplayLocation}</p>
                          <p className="text-[11px] text-slate-500">Exact address securely saved with dispatch. Mileage calculated accurately.</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                        Masked
                      </span>
                    </div>
                  </div>
                ) : (
                  <AddressFields legend="Pickup Address (Seller Location)" value={pickupParts} onChange={changePickupParts} />
                )}

                <AddressFields legend="Delivery Address (Buyer Location)" value={deliveryParts} onChange={changeDeliveryParts} />
                <button type="button" onClick={confirmRoute} disabled={isRecalculatingRoute || (!sellerLink && !isCompleteAddressParts(pickupParts)) || !isCompleteAddressParts(deliveryParts)}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
                  {isRecalculatingRoute && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isRecalculatingRoute ? 'Confirming Address & Distance…' : routeConfirmed ? 'Address Confirmed — Recalculate' : 'Confirm Address & Calculate Distance'}
                </button>
                {routeError && <p className="text-xs font-medium text-red-600">{routeError}</p>}
                {!routeConfirmed && !routeError && <p className="text-xs text-slate-500">Price stays at $69 until the address and driving distance are confirmed.</p>}
              </div>

              {/* Section 3: Seller Info (Hidden or Simplified if Seller Link Active) */}
              {!sellerLink && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                    3. Seller Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Seller Name / Store Name</label>
                      <input
                        type="text"
                        value={sellerName}
                        onChange={(e) => setSellerName(e.target.value)}
                        placeholder="David Miller (Facebook Seller)"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Seller Phone Number</label>
                      <input
                        type="tel"
                        value={sellerPhone}
                        onChange={(e) => setSellerPhone(e.target.value)}
                        placeholder="(512) 555-0182"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Item Description</label>
                    <input
                      type="text"
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      placeholder="Grey Velvet 3-Seater Mid-Century Sofa in great shape"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Section 4: Time Window & Options */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                  {sellerLink ? '3.' : '4.'} Delivery Schedule & Preferences
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preferred Date</label>
                    <input
                      type="date"
                      value={preferredDeliveryDate}
                      onChange={(e) => setPreferredDeliveryDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Arrival Window</label>
                    <select
                      value={preferredDeliveryTimeSlot}
                      onChange={(e) => setPreferredDeliveryTimeSlot(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium bg-white"
                    >
                      <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                      <option value="12:00 PM - 1:00 PM">12:00 PM - 1:00 PM</option>
                      <option value="2:00 PM - 3:00 PM">2:00 PM - 3:00 PM</option>
                      <option value="4:30 PM - 5:30 PM">4:30 PM - 5:30 PM</option>
                      <option value="6:00 PM - 7:00 PM">6:00 PM - 7:00 PM</option>
                    </select>
                  </div>
                </div>

                {/* Additional services */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={quoteInput.stairs > 0}
                      onChange={(e) => setQuoteInput((prev) => ({ ...prev, stairs: e.target.checked ? 1 : 0 }))}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-800">Flight of Stairs (+ $15)</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={quoteInput.assemblyNeeded}
                      onChange={(e) => setQuoteInput((prev) => ({ ...prev, assemblyNeeded: e.target.checked }))}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-800">Assembly (+ $35)</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={quoteInput.rushDelivery}
                      onChange={(e) => setQuoteInput((prev) => ({ ...prev, rushDelivery: e.target.checked }))}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-800">Rush Delivery (+ $25)</span>
                  </label>
                </div>

                {/* Seller photos are view-only for buyers using a seller link. */}
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      {sellerLink ? 'Seller Item Photos' : 'Upload Item Photos (Marketplace Listing)'}
                    </label>
                    {sellerLink && uploadedPhotos.length > 0 && (
                      <span className="text-[11px] font-medium text-slate-500">Provided by seller</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {uploadedPhotos.map((imgUrl, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={imgUrl} alt={`Item photo ${idx + 1}`} className="w-full h-full object-cover" />
                        {!sellerLink && (
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            aria-label={`Remove item photo ${idx + 1}`}
                            className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}

                    {!sellerLink && (
                      <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all text-slate-500">
                        <Upload className="w-5 h-5 mb-1 text-blue-600" />
                        <span className="text-[10px] font-bold">Add Photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e.target.files)} />
                      </label>
                    )}
                    {sellerLink && uploadedPhotos.length === 0 && (
                      <p className="text-xs text-slate-500">The seller did not add listing photos.</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes for Driver / Drop-off Instructions</label>
                  <textarea
                    rows={2}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="e.g. Elevator in back lobby. Please call upon arrival."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                  />
                </div>

              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-base shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Opening Secure Checkout...' : `Pay & Book Delivery (${formatCurrency(quoteResult.totalPrice)})`}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

            </form>

          </div>

          {/* Right Quote Summary Sidebar */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6 sticky top-24">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                Google-Validated Route Rate
              </span>
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500">Item Type:</span>
                <strong className="text-slate-900">{quoteInput.itemType}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-500">Calculated Distance:</span>
                <strong className="text-slate-900 flex items-center gap-1.5">
                  {isRecalculatingRoute ? (
                    <span className="text-xs text-blue-600 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Recalculating...
                    </span>
                  ) : (
                    <span>{rawQuoteResult.estimatedMiles} Miles ({rawQuoteResult.drivingDuration || '15 mins'})</span>
                  )}
                </strong>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500">Vehicle:</span>
                <strong className="text-slate-900">{rawQuoteResult.vehicleTypeRecommended}</strong>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500">Arrival Window:</span>
                <strong className="text-slate-900">{rawQuoteResult.estimatedDeliveryTime}</strong>
              </div>
            </div>

            {/* Itemized Pricing */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Base Delivery (first {INCLUDED_MILES} miles):</span>
                <span className="font-semibold text-slate-900">{formatCurrency(rawQuoteResult.basePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Additional Mileage ({Math.max(0, Math.round((rawQuoteResult.estimatedMiles - INCLUDED_MILES) * 10) / 10)} mi @ ${COST_PER_ESTIMATED_MILE.toFixed(2)}/mi):</span>
                <span className="font-semibold text-slate-900">{formatCurrency(rawQuoteResult.distanceFee)}</span>
              </div>
              {rawQuoteResult.stairsFee > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Stairs Surcharge:</span>
                  <span className="font-semibold">+{formatCurrency(rawQuoteResult.stairsFee)}</span>
                </div>
              )}
              {rawQuoteResult.assemblyFee > 0 && (
                <div className="flex justify-between text-blue-700">
                  <span>Assembly Needed:</span>
                  <span className="font-semibold">+{formatCurrency(rawQuoteResult.assemblyFee)}</span>
                </div>
              )}
              {rawQuoteResult.rushFee > 0 && (
                <div className="flex justify-between text-purple-700">
                  <span>Rush 90-Min Delivery:</span>
                  <span className="font-semibold">+{formatCurrency(rawQuoteResult.rushFee)}</span>
                </div>
              )}

              {sellerLink?.payer === 'seller_pays' && (
                <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                  <span>Seller Covered Subsidy:</span>
                  <span>-{formatCurrency(rawQuoteResult.totalPrice)}</span>
                </div>
              )}

              {sellerLink?.payer === 'split_50_50' && (
                <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                  <span>50% Seller Co-Pay:</span>
                  <span>-{formatCurrency(Math.round(rawQuoteResult.totalPrice / 2))}</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Buyer Checkout Total</span>
                <span>Pickup and drop-off documentation included</span>
              </div>
              <div className="text-3xl font-black">{formatCurrency(quoteResult.totalPrice)}</div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero charge until driver inspects & loads item at seller location</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Free cancellation up to 1 hour before scheduled arrival</span>
              </p>
            </div>
          </div>

        </div>

        {/* Confirmation Modal */}
        {completedBooking && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 text-center">
              
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h3 className="text-2xl font-extrabold text-slate-900">Payment Confirmed!</h3>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
                  <span>Tracking Order ID:</span>
                  <span className="text-blue-600">{completedBooking.id}</span>
                </div>
                {completedBooking.isSellerLinkBooking && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Seller Link Verified:</span>
                    <span>Locked with {completedBooking.sellerName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Name:</span>
                  <span className="font-medium text-slate-800">{completedBooking.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Route Mileage:</span>
                  <span className="font-medium text-slate-800">{completedBooking.quoteResult.estimatedMiles} Miles</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Arrival:</span>
                  <span className="font-medium text-slate-800">{completedBooking.preferredDeliveryDate} ({completedBooking.preferredDeliveryTimeSlot})</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Total Charged:</span>
                  <span className="text-emerald-600 text-sm">{formatCurrency(completedBooking.quoteResult.totalPrice)}</span>
                </div>
              </div>

              <p className="text-slate-600 text-xs leading-relaxed">
                Your paid order is being processed for dispatch. A confirmation email will be sent to <strong>{completedBooking.customerEmail}</strong>; we will contact you when a driver is assigned.
              </p>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => onNavigate('customer-dashboard')}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all"
                >
                  Track in Customer Portal
                </button>
                <button
                  onClick={() => setCompletedBooking(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200"
                >
                  Close Receipt
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
