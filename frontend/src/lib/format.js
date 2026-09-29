export const fdate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
export const fdatetime = (d) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const inr = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN');
export function addWorkingDays(n) {
  const d = new Date(); let added = 0;
  while (added < n) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) added++; }
  return d;
}
export function availability(p) {
  if (p.leadDays > 0) return { cls: 'mto', txt: `Made to order, ships in about ${Math.round(p.leadDays / 7)} weeks`, canBuy: true, max: 20 };
  if (p.stock <= 0) return { cls: 'out', txt: 'Sold out. Ask us about the next batch.', canBuy: false, max: 0 };
  if (p.stock <= 3) return { cls: '', txt: `In stock: only ${p.stock} left`, canBuy: true, max: p.stock };
  return { cls: '', txt: 'In stock, dispatched within 2 working days', canBuy: true, max: Math.min(p.stock, 20) };
}
