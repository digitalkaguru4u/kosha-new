import { useState } from 'react';
import { useStore } from '../context/Store.jsx';

export default function ShipCalc() {
  const { config, country, money } = useStore();
  const [c, setC] = useState(country); const [n, setN] = useState(1); const [out, setOut] = useState(null);
  if (!config) return null;
  const calc = (e) => {
    e.preventDefault();
    const info = config.countries.find((x) => x.code === c); const z = config.zones[info.zone]; const k = Math.max(1, Number(n) || 1);
    setOut({ name: info.name, india: info.zone === 'IN', cost: info.zone === 'IN' ? null : z.base + z.extra * (k - 1), z });
  };
  return (
    <div className="calc"><h3>Estimate shipping</h3>
      <form className="f" onSubmit={calc} style={{ marginTop: 16 }}>
        <label className="fl">Destination<select className="in" value={c} onChange={(e) => setC(e.target.value)}>{config.countries.map((x) => <option key={x.code} value={x.code}>{x.name}</option>)}</select></label>
        <label className="fl">Number of pieces<input className="in" type="number" min="1" max="50" value={n} onChange={(e) => setN(e.target.value)} /></label>
        <button className="btn" type="submit">Estimate</button></form>
      <div className="out" aria-live="polite">{out ? <>
        <div className="tot"><span>Standard to {out.name}</span><strong>{out.india ? `${money(config.zones.IN.base, 'INR')}, free above ${money(config.freeShipIN, 'INR')}` : money(out.cost)}</strong></div>
        <div className="tot"><span>Delivery after dispatch</span><span>{out.z.days[0]}–{out.z.days[1]} working days</span></div>
        <p className="small muted" style={{ marginTop: 8 }}>{out.india ? 'Prices include GST.' : 'Import duties and taxes are collected by the courier on delivery.'}</p>
      </> : <p className="muted small">Choose a destination to see the cost and delivery window.</p>}</div>
    </div>
  );
}
