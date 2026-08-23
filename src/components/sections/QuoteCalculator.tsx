import { useState, useMemo } from 'react';
import { ItemCategory, QuoteInput } from '../../types';
import { calculateQuote, formatCurrency, COST_PER_ESTIMATED_MILE, BASE_DELIVERY_PRICE, INCLUDED_MILES } from '../../lib/pricing';
import { getAccurateDeliveryDistance, DistanceCalculationResult } from '../../lib/mapsService';
import { AddressParts, EMPTY_ADDRESS, formatFullAddress, isCompleteAddressParts } from '../../lib/addressValidation';
import { AddressFields } from '../common/AddressFields';
import { ITEM_CATEGORIES } from '../../constants';
import { Calculator, ArrowRight, Shield, Zap, Sparkles, Truck, CheckCircle2, Loader2, Compass } from 'lucide-react';

interface QuoteCalculatorProps {
  onBookNow: (quoteInput: QuoteInput) => void;
  title?: string;
  subtitle?: string;
}

export function QuoteCalculator({ onBookNow, title, subtitle }: QuoteCalculatorProps) {
  const [pickupParts, setPickupParts] = useState<AddressParts>({ ...EMPTY_ADDRESS });
  const [deliveryParts, setDeliveryParts] = useState<AddressParts>({ ...EMPTY_ADDRESS });
  const [confirmedAddresses, setConfirmedAddresses] = useState<{ pickup: string; delivery: string } | null>(null);
  const [itemType, setItemType] = useState<ItemCategory>('Sofa');
  const [stairs, setStairs] = useState<number>(0);
  const [elevator, setElevator] = useState<boolean>(false);
  const [assemblyNeeded, setAssemblyNeeded] = useState<boolean>(false);
  const [rushDelivery, setRushDelivery] = useState<boolean>(false);

  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

  // Distance calculation state from Google Address Validation + Routes.
  const [distanceInfo, setDistanceInfo] = useState<DistanceCalculationResult>({
    miles: 2.9,
    durationMinutes: 7,
    durationFormatted: '7 mins',
    source: 'google_routes',
    originFormatted: '78701 (Downtown Austin, TX)',
    destinationFormatted: '78704 (South Congress / Zilker, Austin, TX)',
    isOpenStreetMapVerified: true,
    distanceFee: 6,
  });
  const [isLoadingDistance, setIsLoadingDistance] = useState<boolean>(false);
  const [distanceError, setDistanceError] = useState<string>('');
  const handleConfirmAddresses = async () => {
    if (!isCompleteAddressParts(pickupParts) || !isCompleteAddressParts(deliveryParts)) {
      setDistanceError('Complete every required pickup and delivery address field.');
      return;
    }
    const pickup = formatFullAddress(pickupParts);
    const delivery = formatFullAddress(deliveryParts);
    setIsLoadingDistance(true);
    try {
      setDistanceError('');
      const result = await getAccurateDeliveryDistance(pickup, delivery);
      setDistanceInfo(result);
      setConfirmedAddresses({ pickup, delivery });
    } catch (err) {
      setConfirmedAddresses(null);
      setDistanceError(err instanceof Error ? err.message : 'Unable to calculate this route.');
    } finally {
      setIsLoadingDistance(false);
    }
  };

  const quoteInput: QuoteInput = useMemo(
    () => ({
      pickupZip: confirmedAddresses?.pickup || formatFullAddress(pickupParts),
      deliveryZip: confirmedAddresses?.delivery || formatFullAddress(deliveryParts),
      itemType,
      stairs,
      elevator,
      assemblyNeeded,
      rushDelivery,
      accurateMiles: confirmedAddresses ? distanceInfo.miles : undefined,
      drivingDuration: distanceInfo.durationFormatted,
      isOpenStreetMapVerified: distanceInfo.isOpenStreetMapVerified,
    }),
    [pickupParts, deliveryParts, confirmedAddresses, itemType, stairs, elevator, assemblyNeeded, rushDelivery, distanceInfo]
  );

  const quoteResult = useMemo(() => calculateQuote(quoteInput), [quoteInput]);
  const hasValidAddresses = isCompleteAddressParts(pickupParts) && isCompleteAddressParts(deliveryParts);
  const displayedTotal = confirmedAddresses ? quoteResult.totalPrice : BASE_DELIVERY_PRICE;

  const changePickup = (value: AddressParts) => { setPickupParts(value); setConfirmedAddresses(null); setDistanceError(''); };
  const changeDelivery = (value: AddressParts) => { setDeliveryParts(value); setConfirmedAddresses(null); setDistanceError(''); };

  return (
    <section id="quote-calculator" className="py-12 sm:py-16 bg-slate-50 border-y border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Calculator className="w-3.5 h-3.5" />
            <span>Instant Quote Calculator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {title || "Calculate Your Delivery Price"}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            {subtitle || "Accurate real-time mileage routing with flat-rate transparent pricing. No surprise fees."}
          </p>
          <div className="mt-5 inline-flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 rounded-2xl bg-blue-50 border border-blue-200 px-5 py-3 text-blue-950 shadow-sm">
            <span className="text-xl sm:text-2xl font-black text-blue-700">Starting at $69</span>
            <span className="text-sm font-semibold">up to 10 miles from pickup location</span>
            <span className="hidden sm:inline text-blue-300">•</span>
            <span className="text-sm font-bold text-blue-800">+ $2.20/mile over the first 10</span>
          </div>
        </div>

        {/* Calculator Main Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Form Column (Inputs) */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
            
            <div className="space-y-6">
              <AddressFields legend="Pickup Address" value={pickupParts} onChange={changePickup} />
              <AddressFields legend="Delivery Address" value={deliveryParts} onChange={changeDelivery} />
              <button type="button" onClick={handleConfirmAddresses} disabled={!hasValidAddresses || isLoadingDistance}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-sm transition-colors">
                {isLoadingDistance ? 'Confirming Addresses & Distance…' : confirmedAddresses ? 'Addresses Confirmed — Recalculate' : 'Confirm Addresses & Calculate Distance'}
              </button>
              {distanceError && <p className="text-xs font-medium text-red-600">{distanceError}</p>}
            </div>

            {/* Live Distance Status Bar */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isLoadingDistance ? (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                ) : (
                  <Compass className="w-4 h-4 text-blue-600" />
                )}
                <div>
                  <span className="font-semibold text-slate-800">
                    {isLoadingDistance ? 'Calculating driving route...' : confirmedAddresses ? `${distanceInfo.miles} miles route confirmed` : 'Price remains $69 until addresses are confirmed'}
                  </span>
                  <span className="text-slate-500 ml-1.5">
                    {confirmedAddresses ? `(${distanceInfo.durationFormatted} drive)` : ''}
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                <span>${BASE_DELIVERY_PRICE} up to {INCLUDED_MILES} mi</span>
              </span>
            </div>

            {/* Item Type Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Item Type
              </label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as ItemCategory)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 font-semibold text-sm transition-all bg-white"
              >
                {ITEM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Stairs & Elevator Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Number of Stairs
                </label>
                <select
                  value={stairs}
                  onChange={(e) => setStairs(parseInt(e.target.value, 10))}
                  disabled={elevator}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 font-semibold text-sm transition-all disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value={0}>0 Flights (Ground Floor)</option>
                  <option value={1}>1 Flight (+$15)</option>
                  <option value={2}>2 Flights (+$30)</option>
                  <option value={3}>3+ Flights (+$45)</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-300 hover:border-blue-300 cursor-pointer transition-all bg-white">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Elevator Available</span>
                  <input
                    type="checkbox"
                    checked={elevator}
                    onChange={(e) => setElevator(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            {/* Additional Services Toggles */}
            <div className="space-y-3 pt-2">
              <label className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 cursor-pointer transition-all bg-slate-50/50">
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Furniture Assembly Needed</span>
                  <span className="text-xs text-slate-500">Driver carries tools to assemble bed frames, tables, brackets (+$35)</span>
                </div>
                <input
                  type="checkbox"
                  checked={assemblyNeeded}
                  onChange={(e) => setAssemblyNeeded(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0 ml-2"
                />
              </label>

              <label className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 cursor-pointer transition-all bg-slate-50/50">
                <div>
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Rush Delivery (Express 90 Mins)</span>
                  </span>
                  <span className="text-xs text-slate-500">Priority dispatch for immediate pickup window (+$40)</span>
                </div>
                <input
                  type="checkbox"
                  checked={rushDelivery}
                  onChange={(e) => setRushDelivery(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0 ml-2"
                />
              </label>
            </div>

          </div>

          {/* Right Summary Column (Outputs) */}
          <div className="lg:col-span-5 bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-800">
            
            <div className="space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Live Quote Output
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Accurate Distance
                </span>
              </div>

              {/* Price Display */}
              <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Delivery Price</span>
                  {isLoadingDistance && (
                    <span className="text-[10px] text-blue-400 flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Updating...
                    </span>
                  )}
                </div>
                <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {formatCurrency(displayedTotal)}
                </div>
                {confirmedAddresses && (quoteResult.stairsFee + quoteResult.assemblyFee + quoteResult.rushFee) > 0 && (
                  <p className="text-[11px] text-amber-300 font-semibold">
                    Includes {formatCurrency(quoteResult.stairsFee + quoteResult.assemblyFee + quoteResult.rushFee)} in selected add-ons; route charge is {formatCurrency(quoteResult.basePrice + quoteResult.distanceFee)}.
                  </p>
                )}
                <div className="text-xs text-slate-300 pt-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Vehicle: <strong className="text-white">{quoteResult.vehicleTypeRecommended}</strong></span>
                </div>
              </div>

              {/* Route & Distance Metrics */}
              <div className="space-y-2.5 text-sm bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center text-slate-300 text-xs sm:text-sm">
                  <span>Actual Route Mileage:</span>
                  <strong className="text-white font-bold flex items-center gap-1.5">
                    <span>{confirmedAddresses ? `${quoteResult.estimatedMiles} Miles` : 'Awaiting confirmation'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                      Calculated
                    </span>
                  </strong>
                </div>
                <div className="flex justify-between items-center text-slate-300 text-xs sm:text-sm">
                  <span>Estimated Driving Time:</span>
                  <strong className="text-white font-semibold">{quoteResult.drivingDuration}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-300 text-xs sm:text-sm">
                  <span>Delivery Arrival Window:</span>
                  <strong className="text-white font-semibold">{quoteResult.estimatedDeliveryTime}</strong>
                </div>
              </div>

              {/* Toggleable Price Breakdown */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  disabled={!confirmedAddresses}
                  className="text-xs text-blue-400 hover:text-blue-300 disabled:text-slate-500 disabled:no-underline underline font-medium flex items-center gap-1"
                >
                  <span>{!confirmedAddresses ? 'Confirm addresses to view breakdown' : showBreakdown ? 'Hide Fee Breakdown' : 'View Detailed Breakdown'}</span>
                </button>

                {showBreakdown && confirmedAddresses && (
                  <div className="mt-3 p-3.5 rounded-lg bg-slate-800/60 border border-slate-700 text-xs space-y-2 text-slate-300">
                    <div className="flex justify-between">
                      <span>Base delivery (first {INCLUDED_MILES} miles):</span>
                      <span className="font-semibold text-white">{formatCurrency(quoteResult.basePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Additional mileage ({Math.max(0, Math.round((quoteResult.estimatedMiles - INCLUDED_MILES) * 10) / 10)} mi @ ${COST_PER_ESTIMATED_MILE.toFixed(2)}/mi):</span>
                      <span className="font-semibold text-white">{formatCurrency(quoteResult.distanceFee)}</span>
                    </div>
                    {quoteResult.stairsFee > 0 && (
                      <div className="flex justify-between text-amber-300">
                        <span>Stairs Surcharge ({stairs} flight{stairs > 1 ? 's' : ''}):</span>
                        <span className="font-semibold">+{formatCurrency(quoteResult.stairsFee)}</span>
                      </div>
                    )}
                    {quoteResult.assemblyFee > 0 && (
                      <div className="flex justify-between text-blue-300">
                        <span>Furniture Assembly:</span>
                        <span className="font-semibold">+{formatCurrency(quoteResult.assemblyFee)}</span>
                      </div>
                    )}
                    {quoteResult.rushFee > 0 && (
                      <div className="flex justify-between text-amber-400">
                        <span>Rush Express Window:</span>
                        <span className="font-semibold">+{formatCurrency(quoteResult.rushFee)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Trust Guarantee */}
              <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-800/60 text-xs text-blue-200 space-y-1">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>Transparent Price Breakdown</span>
                </p>
                <p>Includes driver pickup, seller check, room placement, and $50k cargo protection.</p>
              </div>

            </div>

            {/* Book Now Button */}
            <div className="pt-6">
              <button
                onClick={() => onBookNow(quoteInput)}
                disabled={!confirmedAddresses || isLoadingDistance || Boolean(distanceError)}
                className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold text-base shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>{confirmedAddresses ? `Book Now (${formatCurrency(quoteResult.totalPrice)})` : 'Confirm Addresses to Continue'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
