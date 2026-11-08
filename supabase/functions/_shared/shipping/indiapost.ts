// India Post adapter: AWAITING THE OWNER'S INDIA POST BUSINESS API DOCUMENTS.
//
// The owner is getting an India Post business account with API access. India Post's booking and tracking API is
// given to business customers with their account, so its exact endpoints, sign-in and field names are NOT written
// here from guesswork. When the documents arrive, implement the functions below with the same shapes as the
// Delhivery adapter (delhivery.ts); nothing else in the store needs to change:
//   * shipping/index.ts already sends India Post orders here when indiapost.enabled is on;
//   * the database books a packed order only with its own courier (0040_integrations_ready.sql);
//   * Admin → Connections shows India Post as "waiting for API details" until this is done.
//
// Until then India Post works by hand: book at the post office, then press Mark shipped and type the article number.
import type { OurStatus } from './core.ts';
import type { ShipmentInput } from './delhivery.ts';

export interface IndiaPostConfig {
  /** Filled from the India Post documents (e.g. customer id, contract number, API credentials). */
  credentials: Record<string, string>;
}

const NOT_READY = 'India Post automatic booking is not connected yet. Book at the post office and type the article number.';

export const ready = false;

export function createShipment(_cfg: IndiaPostConfig, _s: ShipmentInput): Promise<{ awb: string; refnum: string }> {
  return Promise.reject(new Error(NOT_READY));
}

export function cancel(_cfg: IndiaPostConfig, _awb: string): Promise<void> {
  return Promise.reject(new Error(NOT_READY));
}

export function track(_cfg: IndiaPostConfig, _awbs: string[]): Promise<{ awb: string; raw: string; status: OurStatus | null }[]> {
  return Promise.resolve([]);
}
