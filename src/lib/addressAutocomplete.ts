import type { AddressParts } from './addressValidation';

export interface AddressSuggestion {
  placeId: string;
  description: string;
}

const api = (path: string) => `${import.meta.env.BASE_URL}api/${path}`;

export async function suggestAddresses(input: string, sessionToken: string): Promise<AddressSuggestion[]> {
  const response = await fetch(api('address-suggestions'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input, sessionToken }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Address suggestions are unavailable.');
  return result.suggestions || [];
}

export async function resolveAddress(placeId: string, sessionToken: string): Promise<AddressParts> {
  const response = await fetch(api('address-details'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ placeId, sessionToken }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Unable to select this address.');
  return result.parts;
}
