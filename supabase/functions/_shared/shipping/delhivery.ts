// Delhivery adapter. UNVERIFIED: written from Delhivery's public developer documentation, staging first.
// Before go-live, check every endpoint and field below against the API documents issued with the
// owner's Delhivery account (see SETUP.md → Delhivery), then switch delhivery.mode to production.
import { mapDelhiveryStatus, type OurStatus } from './core.ts';

const BASE = { staging: 'https://staging-express.delhivery.com', production: 'https://track.delhivery.com' };

export interface DelhiveryConfig {
  token: string;
  mode: 'staging' | 'production';
  pickupLocation: string;
}

async function call<T>(cfg: DelhiveryConfig, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE[cfg.mode]}${path}`, {
    ...init,
    headers: { Authorization: `Token ${cfg.token}`, Accept: 'application/json', ...(init.headers ?? {}) },
  });
  const text = await res.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    // some endpoints answer with text
  }
  if (!res.ok) throw new Error(`Delhivery ${res.status}: ${typeof data === 'string' ? data.slice(0, 200) : JSON.stringify(data).slice(0, 200)}`);
  return data as T;
}

export async function serviceability(cfg: DelhiveryConfig, pincode: string): Promise<{ serviceable: boolean; cod: boolean }> {
  const data = await call<{ delivery_codes?: { postal_code: { pre_paid?: string; cod?: string; is_oda?: string } }[] }>(
    cfg,
    `/c/api/pin-codes/json/?filter_codes=${encodeURIComponent(pincode)}`,
  );
  const pc = data.delivery_codes?.[0]?.postal_code;
  if (!pc) return { serviceable: false, cod: false };
  return { serviceable: pc.pre_paid === 'Y' || pc.cod === 'Y', cod: pc.cod === 'Y' };
}

export interface ShipmentInput {
  orderNumber: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  codAmount: number;
  total: number;
  weightG: number;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  productsDesc: string;
  quantity: number;
  surface: boolean;
}

export async function createShipment(cfg: DelhiveryConfig, s: ShipmentInput): Promise<{ awb: string; refnum: string }> {
  const shipment = {
    name: s.name,
    add: s.address,
    pin: s.pincode,
    city: s.city,
    state: s.state,
    country: 'India',
    phone: s.phone,
    order: s.orderNumber,
    payment_mode: s.codAmount > 0 ? 'COD' : 'Prepaid',
    cod_amount: s.codAmount > 0 ? String(s.codAmount) : '0',
    total_amount: String(s.total),
    products_desc: s.productsDesc.slice(0, 200),
    quantity: String(s.quantity),
    weight: String(s.weightG),
    shipment_length: String(Math.ceil(s.lengthMm / 10)),
    shipment_width: String(Math.ceil(s.widthMm / 10)),
    shipment_height: String(Math.ceil(s.heightMm / 10)),
    shipping_mode: s.surface ? 'Surface' : 'Express',
  };
  const body = `format=json&data=${encodeURIComponent(JSON.stringify({ shipments: [shipment], pickup_location: { name: cfg.pickupLocation } }))}`;
  const data = await call<{ packages?: { waybill?: string; refnum?: string; status?: string; remarks?: string[] }[]; rmk?: string }>(cfg, '/api/cmu/create.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const pkg = data.packages?.[0];
  if (!pkg?.waybill || (pkg.status && pkg.status.toLowerCase() !== 'success')) {
    throw new Error(pkg?.remarks?.join(' ') || data.rmk || 'Delhivery did not return an AWB.');
  }
  return { awb: pkg.waybill, refnum: pkg.refnum ?? s.orderNumber };
}

export async function schedulePickup(cfg: DelhiveryConfig, count: number): Promise<Date> {
  const when = new Date(Date.now() + 24 * 3600 * 1000);
  const date = when.toISOString().slice(0, 10);
  await call(cfg, '/fm/request/new/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pickup_time: '11:00:00', pickup_date: date, pickup_location: cfg.pickupLocation, expected_package_count: count }),
  });
  return new Date(`${date}T11:00:00+05:30`);
}

export const labelUrl = (cfg: DelhiveryConfig, awb: string) => `${BASE[cfg.mode]}/api/p/packing_slip?wbns=${encodeURIComponent(awb)}&pdf=true`;

export async function cancel(cfg: DelhiveryConfig, awb: string): Promise<void> {
  await call(cfg, '/api/p/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ waybill: awb, cancellation: 'true' }),
  });
}

export async function track(cfg: DelhiveryConfig, awbs: string[]): Promise<{ awb: string; raw: string; status: OurStatus | null }[]> {
  if (!awbs.length) return [];
  const data = await call<{ ShipmentData?: { Shipment: { AWB: string; Status: { Status: string; StatusType: string } } }[] }>(
    cfg,
    `/api/v1/packages/json/?waybill=${encodeURIComponent(awbs.join(','))}`,
  );
  return (data.ShipmentData ?? []).map(({ Shipment }) => ({
    awb: Shipment.AWB,
    raw: `${Shipment.Status?.Status ?? ''} (${Shipment.Status?.StatusType ?? ''})`,
    status: mapDelhiveryStatus(Shipment.Status?.Status ?? '', Shipment.Status?.StatusType),
  }));
}

export async function createReturn(cfg: DelhiveryConfig, s: ShipmentInput): Promise<{ awb: string }> {
  // Reverse pickup: same create call with payment_mode Pickup. UNVERIFIED.
  const shipment = { ...s, codAmount: 0 };
  const body = `format=json&data=${encodeURIComponent(JSON.stringify({
    shipments: [{
      name: shipment.name, add: shipment.address, pin: shipment.pincode, city: shipment.city, state: shipment.state, country: 'India',
      phone: shipment.phone, order: `${shipment.orderNumber}-R`, payment_mode: 'Pickup', total_amount: String(shipment.total),
      products_desc: shipment.productsDesc.slice(0, 200), quantity: String(shipment.quantity), weight: String(shipment.weightG),
    }],
    pickup_location: { name: cfg.pickupLocation },
  }))}`;
  const data = await call<{ packages?: { waybill?: string; remarks?: string[] }[] }>(cfg, '/api/cmu/create.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const awb = data.packages?.[0]?.waybill;
  if (!awb) throw new Error(data.packages?.[0]?.remarks?.join(' ') || 'Delhivery did not return a return AWB.');
  return { awb };
}
