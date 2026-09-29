// Commerce rules: the single source of truth for pricing.
// The frontend reads the public parts of this via GET /api/config.
export const GST_RATE = 0.05; // verify the rate per HSN code with your CA
export const FREE_SHIP_IN = 5000; // INR
export const COD_MAX = 25000; // INR
export const PENDING_PAYMENT_MINUTES = 30;

// Indicative display rates (INR -> X). All charges are made in INR.
export const CURRENCIES = {
  INR: { rate: 1, locale: 'en-IN' },
  USD: { rate: 0.0113, locale: 'en-US' },
  EUR: { rate: 0.0104, locale: 'de-DE' },
  GBP: { rate: 0.0088, locale: 'en-GB' },
  AED: { rate: 0.0415, locale: 'en-AE' }
};

export const ZONES = {
  IN: { name: 'India', base: 250, extra: 0, days: [3, 6], expressFee: 450, expressDays: [1, 3] },
  A: { name: 'UAE, Gulf and Singapore', base: 2400, extra: 600, days: [5, 8], expressDays: [3, 5] },
  B: { name: 'UK and Europe', base: 3800, extra: 900, days: [7, 11], expressDays: [4, 6] },
  C: { name: 'USA, Canada, Australia, Japan', base: 4500, extra: 1100, days: [8, 12], expressDays: [4, 7] }
};

export const COUNTRIES = [
  ['IN', 'India', 'IN', 'INR'], ['AE', 'United Arab Emirates', 'A', 'AED'], ['SA', 'Saudi Arabia', 'A', 'USD'],
  ['QA', 'Qatar', 'A', 'USD'], ['OM', 'Oman', 'A', 'USD'], ['KW', 'Kuwait', 'A', 'USD'], ['BH', 'Bahrain', 'A', 'USD'],
  ['SG', 'Singapore', 'A', 'USD'], ['GB', 'United Kingdom', 'B', 'GBP'], ['DE', 'Germany', 'B', 'EUR'],
  ['FR', 'France', 'B', 'EUR'], ['IT', 'Italy', 'B', 'EUR'], ['NL', 'Netherlands', 'B', 'EUR'], ['ES', 'Spain', 'B', 'EUR'],
  ['CH', 'Switzerland', 'B', 'EUR'], ['IE', 'Ireland', 'B', 'EUR'], ['US', 'United States', 'C', 'USD'],
  ['CA', 'Canada', 'C', 'USD'], ['AU', 'Australia', 'C', 'USD'], ['NZ', 'New Zealand', 'C', 'USD'], ['JP', 'Japan', 'C', 'USD']
].map(([code, name, zone, currency]) => ({ code, name, zone, currency }));

export const STAGES = ['Order confirmed', 'Processing', 'Packed', 'Shipped', 'In transit', 'Out for delivery', 'Delivered'];

export const countryOf = (code) => COUNTRIES.find((c) => c.code === code);
