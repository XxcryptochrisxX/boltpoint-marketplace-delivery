export function isFullStreetAddress(value: string): boolean {
  const address = value.trim();
  return /^\d+[A-Za-z-]*\s+[^,]+(?:,\s*[^,]+)?,\s*[^,]+,\s*[A-Za-z]{2}\s+\d{5}(?:-\d{4})?$/.test(address);
}

export const FULL_ADDRESS_EXAMPLE = '123 Main St, Austin, TX 78701';

export interface AddressParts {
  street: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
}

export const EMPTY_ADDRESS: AddressParts = { street: '', unit: '', city: '', state: '', zip: '' };

export function formatFullAddress(parts: AddressParts): string {
  const unit = parts.unit.trim() ? `, ${parts.unit.trim()}` : '';
  return `${parts.street.trim()}${unit}, ${parts.city.trim()}, ${parts.state.trim().toUpperCase()} ${parts.zip.trim()}`;
}

export function isCompleteAddressParts(parts: AddressParts): boolean {
  return isFullStreetAddress(formatFullAddress(parts));
}

export function parseFullAddress(value: string): AddressParts {
  const sections = value.split(',').map(part => part.trim());
  const stateZip = sections.at(-1)?.match(/^([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (sections.length < 3 || !stateZip) return { ...EMPTY_ADDRESS };
  return {
    street: sections[0] || '',
    unit: sections.length > 3 ? sections.slice(1, -2).join(', ') : '',
    city: sections.at(-2) || '',
    state: stateZip[1].toUpperCase(),
    zip: stateZip[2],
  };
}
