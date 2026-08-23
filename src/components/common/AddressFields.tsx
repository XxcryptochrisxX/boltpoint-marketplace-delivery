import type { AddressParts } from '../../lib/addressValidation';

interface AddressFieldsProps {
  legend: string;
  value: AddressParts;
  onChange: (value: AddressParts) => void;
  disabled?: boolean;
}

export function AddressFields({ legend, value, onChange, disabled = false }: AddressFieldsProps) {
  const update = (field: keyof AddressParts, next: string) => onChange({ ...value, [field]: next });
  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium disabled:bg-slate-100';
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{legend}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="sm:col-span-2 text-xs font-semibold text-slate-600">Street Address *
          <input className={`${inputClass} mt-1`} value={value.street} disabled={disabled} onChange={e => update('street', e.target.value)} placeholder="123 Main St" autoComplete="address-line1" />
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
