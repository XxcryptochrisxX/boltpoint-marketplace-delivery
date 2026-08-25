import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import type { AddressParts } from '../../lib/addressValidation';
import { resolveAddress, suggestAddresses, type AddressSuggestion } from '../../lib/addressAutocomplete';

interface AddressFieldsProps {
  legend: string;
  value: AddressParts;
  onChange: (value: AddressParts) => void;
  disabled?: boolean;
}

export function AddressFields({ legend, value, onChange, disabled = false }: AddressFieldsProps) {
  const update = (field: keyof AddressParts, next: string) => onChange({ ...value, [field]: next });
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sessionToken = useRef(crypto.randomUUID());

  useEffect(() => {
    const query = [value.street, value.city, value.state, value.zip].filter(Boolean).join(', ');
    if (disabled || value.street.trim().length < 3) { setSuggestions([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const matches = await suggestAddresses(query, sessionToken.current);
        if (!controller.signal.aborted) { setSuggestions(matches); setShowSuggestions(matches.length > 0); }
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 350);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [value.street, value.city, value.state, value.zip, disabled]);

  const chooseSuggestion = async (suggestion: AddressSuggestion) => {
    setIsSelecting(true);
    try {
      const parts = await resolveAddress(suggestion.placeId, sessionToken.current);
      onChange({ ...parts, unit: parts.unit || value.unit });
      setSuggestions([]);
      setShowSuggestions(false);
      sessionToken.current = crypto.randomUUID();
    } finally { setIsSelecting(false); }
  };
  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium disabled:bg-slate-100';
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{legend}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="relative z-20 sm:col-span-2 text-xs font-semibold text-slate-600">Street Address *
          <div className="relative mt-1">
            <input className={`${inputClass} pr-10`} value={value.street} disabled={disabled || isSelecting} onFocus={() => setShowSuggestions(suggestions.length > 0)} onChange={e => update('street', e.target.value)} placeholder="Start typing a street address" autoComplete="off" aria-autocomplete="list" aria-expanded={showSuggestions} />
            {(isSearching || isSelecting) && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-blue-600" />}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl" role="listbox">
                {suggestions.map((suggestion) => (
                  <button key={suggestion.placeId} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => void chooseSuggestion(suggestion)} className="flex w-full items-start gap-2 border-b border-slate-100 px-3 py-3 text-left text-sm font-medium text-slate-700 last:border-0 hover:bg-blue-50" role="option">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <span>{suggestion.description}</span>
                  </button>
                ))}
                <div className="flex justify-end bg-slate-50 px-3 py-1.5">
                  <img
                    src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png"
                    alt="Powered by Google"
                    className="h-3.5 w-auto"
                  />
                </div>
              </div>
            )}
          </div>
        </label>
        <label className="text-xs font-semibold text-slate-600">Apt / Suite
          <input className={`${inputClass} mt-1`} value={value.unit} disabled={disabled} onChange={e => update('unit', e.target.value)} placeholder="Apt 4B" autoComplete="address-line2" />
        </label>
        <label className="text-xs font-semibold text-slate-600">City *
          <input className={`${inputClass} mt-1`} value={value.city} disabled={disabled} onChange={e => update('city', e.target.value)} placeholder="Austin" autoComplete="address-level2" />
        </label>
        <label className="text-xs font-semibold text-slate-600">State *
          <input className={`${inputClass} mt-1`} value={value.state} disabled={disabled} maxLength={2} onChange={e => update('state', e.target.value.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase())} placeholder="TX" autoComplete="address-level1" />
        </label>
        <label className="text-xs font-semibold text-slate-600">ZIP Code *
          <input className={`${inputClass} mt-1`} value={value.zip} disabled={disabled} maxLength={10} inputMode="numeric" onChange={e => update('zip', e.target.value.replace(/[^0-9-]/g, '').slice(0, 10))} placeholder="78701" autoComplete="postal-code" />
        </label>
      </div>
    </fieldset>
  );
}
