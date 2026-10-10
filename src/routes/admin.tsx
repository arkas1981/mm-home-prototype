import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Lock, LogOut } from "lucide-react";
import { meta } from "@/lib/meta";
import { resetDemo, todayISO, uid, update, useStore, type State } from "@/lib/store";
import { addDays, diffDays, flexRateFor, genCode, minNightsFor, nightTaken, nonRefOf, quote, toISO, validateStay, type Booking, type RateType } from "@/lib/booking";
import { MonthCalendar } from "@/components/MonthCalendar";
import { Logo } from "@/components/site";
import { SLOGAN } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({
  head: () => ({ ...meta("Admin — MM Home", "MM Home owner dashboard (demo)."), meta: [...meta("Admin — MM Home", "MM Home owner dashboard (demo).").meta, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

const TABS = ["Dashboard", "Calendar", "Bookings", "Pricing", "Blocks", "Reviews", "Notifications", "Emails"] as const;
type Tab = (typeof TABS)[number];
const eur = (n: number) => `€${n.toLocaleString("en-GB")}`;
const fd = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
// Placeholder payment fee model (e.g. card processor) — replace once Stripe pricing is final.
const feeOf = (gross: number, count: number) => Math.round(gross * 0.015 + count * 0.25);

function Admin() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("Dashboard");
  const [detail, setDetail] = useState<string | null>(null);
  useEffect(() => { setAuthed(sessionStorage.getItem("mm-admin") === "1"); }, []);
  if (!authed) return <AdminLogin onIn={() => { sessionStorage.setItem("mm-admin", "1"); setAuthed(true); }} />;
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-30 bg-background border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><Logo size={32} /><span className="font-serif text-xl">MM Home Admin</span><span className="text-[10px] uppercase tracking-widest border rounded-full px-2 py-0.5 text-primary border-primary">Demo</span></div>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/" className="text-muted-foreground hidden sm:inline">View site</Link>
            <button onClick={() => { sessionStorage.removeItem("mm-admin"); setAuthed(false); }} aria-label="Log out"><LogOut size={18} /></button>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-4 flex gap-1 overflow-x-auto pb-2">
          {TABS.map((t) => <button key={t} onClick={() => { setTab(t); setDetail(null); }} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent"}`}>{t}</button>)}
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">
        {detail ? <BookingDetail id={detail} onBack={() => setDetail(null)} /> : (
          <>
            {tab === "Dashboard" && <Dashboard />}
            {tab === "Calendar" && <AdminCalendar onOpen={setDetail} />}
            {tab === "Bookings" && <Bookings onOpen={setDetail} />}
            {tab === "Pricing" && <Pricing />}
            {tab === "Blocks" && <Blocks />}
            {tab === "Reviews" && <ReviewsMod />}
            {tab === "Notifications" && <Notifications />}
            {tab === "Emails" && <Emails />}
          </>
        )}
      </div>
    </div>
  );
}

function AdminLogin({ onIn }: { onIn: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="panel p-8 w-full max-w-sm text-center space-y-4">
        <Logo size={56} />
        <h1 className="text-3xl">MM Home Admin</h1>
        <p className="text-sm text-muted-foreground">Demo access — real sign-in will be added with the live backend.</p>
        <input className="field" placeholder="Email" defaultValue="owner@mmhome.gr" disabled />
        <input className="field" type="password" placeholder="Password" defaultValue="demo" disabled />
        <button className="btn-gold w-full" onClick={onIn}><Lock size={14} /> Enter demo admin</button>
      </div>
    </div>
  );
}

const Card = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="panel p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p><p className="font-serif text-3xl mt-1">{value}</p>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div>
);

function revenueOf(b: Booking) { return b.status === "confirmed" ? b.total : b.total - (b.refund ?? 0); }

function Dashboard() {
  const s = useStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const months = useMemo(() => Array.from({ length: 12 }, (_, m) => {
    const inMonth = s.bookings.filter((b) => { const d = new Date(b.checkIn + "T12:00"); return d.getFullYear() === year && d.getMonth() === m; });
    const gross = inMonth.reduce((a, b) => a + revenueOf(b), 0);
    const days = new Date(year, m + 1, 0).getDate();
    let booked = 0; for (let d = 1; d <= days; d++) if (nightTaken(toISO(new Date(year, m, d)), s.bookings, []) === "booked") booked++;
    const conf = inMonth.filter((b) => b.status === "confirmed");
    return { m, gross, fees: feeOf(gross, inMonth.length), count: conf.length, nights: booked, occ: Math.round((booked / days) * 100) };
  }), [s.bookings, year]);
  const tot = months.reduce((a, x) => ({ gross: a.gross + x.gross, fees: a.fees + x.fees, count: a.count + x.count, nights: a.nights + x.nights }), { gross: 0, fees: 0, count: 0, nights: 0 });
  const daysYear = (year % 4 === 0 ? 366 : 365);
  const max = Math.max(1, ...months.map((x) => x.gross));
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><button onClick={() => setYear(year - 1)}><ChevronLeft /></button><h2 className="text-3xl">{year}</h2><button onClick={() => setYear(year + 1)}><ChevronRight /></button></div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card label="Gross" value={eur(tot.gross)} />
        <Card label="Fees" value={eur(tot.fees)} sub="placeholder" />
        <Card label="Net" value={eur(tot.gross - tot.fees)} />
        <Card label="Bookings" value={String(tot.count)} />
        <Card label="Nights" value={String(tot.nights)} />
        <Card label="Occupancy" value={`${Math.round((tot.nights / daysYear) * 100)}%`} sub="yearly" />
      </div>
      <div className="panel p-5">
        <p className="text-sm text-muted-foreground mb-4">Monthly gross revenue & occupancy</p>
        <div className="flex items-end gap-2 h-44">
          {months.map((x) => (
            <div key={x.m} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[10px] text-muted-foreground">{x.occ}%</span>
              <div className="w-full rounded-t bg-primary/70" style={{ height: `${(x.gross / max) * 100}%`, minHeight: 2 }} title={eur(x.gross)} />
              <span className="text-[10px]">{new Date(2000, x.m).toLocaleString("en-GB", { month: "narrow" })}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr>{["Month", "Gross", "Fees", "Net", "Bookings", "Nights", "Occ."].map((h) => <th key={h} className="p-3 font-normal">{h}</th>)}</tr></thead>
          <tbody>{months.map((x) => <tr key={x.m} className="border-t"><td className="p-3">{new Date(2000, x.m).toLocaleString("en-GB", { month: "short" })}</td><td className="p-3">{eur(x.gross)}</td><td className="p-3">{eur(x.fees)}</td><td className="p-3">{eur(x.gross - x.fees)}</td><td className="p-3">{x.count}</td><td className="p-3">{x.nights}</td><td className="p-3">{x.occ}%</td></tr>)}</tbody>
        </table>
      </div>
      <button className="text-xs text-muted-foreground underline" onClick={() => confirm("Reset all demo data?") && resetDemo()}>Reset demo data</button>
    </div>
  );
}

function AdminCalendar({ onOpen }: { onOpen: (id: string) => void }) {
  const s = useStore();
  const [off, setOff] = useState(0);
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + off);
  const info = (iso: string) => {
    const st = nightTaken(iso, s.bookings, s.blocks);
    const ci = s.bookings.some((b) => b.status === "confirmed" && b.checkIn === iso);
    const co = s.bookings.some((b) => b.status === "confirmed" && b.checkOut === iso);
    const flex = flexRateFor(iso, s.overrides);
    return {
      className: st === "booked" ? "bg-booked" : st === "blocked" ? "bg-blocked text-muted-foreground" : "bg-card hover:bg-accent border",
      mark: ci && co ? "out/in" : ci ? "in" : co ? "out" : st ? "" : `€${flex}`,
      title: st ?? "available",
    };
  };
  const pick = (iso: string) => { const b = s.bookings.find((b) => b.status === "confirmed" && iso >= b.checkIn && iso < b.checkOut) ?? s.bookings.find((b) => b.status === "confirmed" && b.checkOut === iso); if (b) onOpen(b.id); };
  return (
    <div className="panel p-5 max-w-xl">
      <div className="flex justify-between mb-2"><button onClick={() => setOff(off - 1)}><ChevronLeft /></button><button onClick={() => setOff(off + 1)}><ChevronRight /></button></div>
      <MonthCalendar year={d.getFullYear()} month={d.getMonth()} locale="en-GB" info={info} onPick={pick} />
      <div className="flex gap-4 mt-4 text-xs flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 border bg-card rounded" />Available</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-booked rounded" />Booked</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blocked rounded" />Blocked</span>
        <span>in = check-in 15:00 · out = check-out 11:00</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">Tap a booked day to open the booking.</p>
    </div>
  );
}

function Bookings({ onOpen }: { onOpen: (id: string) => void }) {
  const s = useStore();
  const [show, setShow] = useState(false);
  const list = [...s.bookings].sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  return (
    <div className="space-y-4">
      <button className="btn-gold" onClick={() => setShow(!show)}>{show ? "Close" : "+ Manual booking"}</button>
      {show && <ManualBooking onDone={() => setShow(false)} />}
      <div className="space-y-2">
        {list.map((b) => (
          <button key={b.id} onClick={() => onOpen(b.id)} className="panel p-4 w-full text-left flex justify-between items-center gap-3">
            <div><p className="font-medium">{b.name}</p><p className="text-xs text-muted-foreground">{b.code} · {fd(b.checkIn)} → {fd(b.checkOut)} · {b.guests}p · {b.rate === "flexible" ? "Flexible" : "Non-ref"}{b.source === "manual" ? " · manual" : ""}</p></div>
            <div className="text-right"><p className="font-serif text-xl">{eur(b.total)}</p><p className={`text-xs ${b.status === "cancelled" ? "text-destructive" : "text-olive"}`}>{b.status}</p></div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ManualBooking({ onDone }: { onDone: () => void }) {
  const s = useStore();
  const today = todayISO();
  const [f, setF] = useState({ name: "", email: "", phone: "", guests: 2, ci: addDays(today, 7), co: addDays(today, 9), rate: "flexible" as RateType });
  const err = f.co <= f.ci ? "Check-out must be after check-in" : (() => { const e = validateStay(f.ci, f.co, addDays(f.ci, -999), s.bookings, s.blocks, []); return e === "taken" ? "Dates unavailable" : null; })();
  const q = f.co > f.ci ? quote(f.ci, f.co, f.rate, s.overrides) : null;
  const save = () => {
    if (err || !q || !f.name.trim() || !f.email.trim()) return;
    update((st) => ({ ...st, bookings: [...st.bookings, { id: uid(), code: genCode(), checkIn: f.ci, checkOut: f.co, guests: f.guests, name: f.name.trim(), email: f.email.trim().toLowerCase(), phone: f.phone, rate: f.rate, total: q.total, status: "confirmed", createdAt: today, source: "manual" }] }));
    onDone();
  };
  return (
    <div className="panel p-5 grid sm:grid-cols-2 gap-3">
      <input className="field" placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input className="field" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input className="field" placeholder="Mobile" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      <select className="field" value={f.guests} onChange={(e) => setF({ ...f, guests: +e.target.value })}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select>
      <label className="text-xs">Check-in<input type="date" className="field" value={f.ci} onChange={(e) => setF({ ...f, ci: e.target.value })} /></label>
      <label className="text-xs">Check-out<input type="date" className="field" value={f.co} onChange={(e) => setF({ ...f, co: e.target.value })} /></label>
      <select className="field" value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value as RateType })}><option value="flexible">Flexible</option><option value="nonref">Non-refundable</option></select>
      <div className="flex items-center justify-between gap-3"><span className="font-serif text-2xl">{q ? eur(q.total) : "—"}</span><button className="btn-gold" disabled={!!err} onClick={save}>Save</button></div>
      {err && <p className="text-sm text-destructive sm:col-span-2">{err}</p>}
    </div>
  );
}

function BookingDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const s = useStore();
  const b = s.bookings.find((x) => x.id === id);
  if (!b) return null;
  const rows: [string, string][] = [["Code", b.code], ["Status", b.status], ["Guest", b.name], ["Email", b.email], ["Mobile", b.phone], ["Guests", String(b.guests)], ["Check-in", fd(b.checkIn) + " · 15:00"], ["Check-out", fd(b.checkOut) + " · 11:00"], ["Nights", String(diffDays(b.checkIn, b.checkOut))], ["Rate", b.rate === "flexible" ? "Flexible" : "Non-refundable"], ["Total paid (demo)", eur(b.total)], ["Refund", b.refund != null ? eur(b.refund) : "—"], ["Source", b.source], ["Review link", `/review/${b.code}`]];
  const setStatus = (status: "confirmed" | "cancelled") => {
    if (status === "confirmed" && validateStay(b.checkIn, b.checkOut, addDays(b.checkIn, -999), s.bookings.filter((x) => x.id !== b.id), s.blocks, []) === "taken") return alert("Dates are no longer free.");
    update((st) => ({ ...st, bookings: st.bookings.map((x) => { if (x.id !== b.id) return x; if (status === "cancelled") return { ...x, status, refund: x.refund ?? 0 }; const { refund: _refund, ...rest } = x; return { ...rest, status }; }) }));
  };
  return (
    <div className="space-y-4 max-w-xl">
      <button onClick={onBack} className="text-sm flex items-center gap-1"><ChevronLeft size={16} /> Back</button>
      <div className="panel p-5 text-sm">{rows.map(([k, v]) => <div key={k} className="flex justify-between py-2 border-b last:border-0 gap-3"><span className="text-muted-foreground">{k}</span><span className="text-right break-all">{v}</span></div>)}</div>
      {b.status === "confirmed" ? <button className="btn-line" onClick={() => setStatus("cancelled")}>Cancel booking (frees dates)</button> : <button className="btn-line" onClick={() => setStatus("confirmed")}>Reinstate booking</button>}
    </div>
  );
}

function Pricing() {
  const s = useStore();
  const today = todayISO();
  const [f, setF] = useState({ start: addDays(today, 30), end: addDays(today, 33), price: "", min: "", label: "" });
  const add = () => {
    if (f.end < f.start || (!f.price && !f.min)) return;
    update((st) => ({ ...st, overrides: [...st.overrides, { id: uid(), start: f.start, end: f.end, ...(f.price ? { price: Math.max(1, +f.price) } : {}), ...(f.min ? { minNights: Math.max(1, +f.min) } : {}), label: f.label }] }));
    setF({ ...f, price: "", min: "", label: "" });
  };
  return (
    <div className="space-y-4">
      <div className="panel p-5 text-sm">Default: Flexible €200 · Non-refundable €180 (always 10% below flexible) · Min 2 nights. Cleaning included.</div>
      <div className="panel p-5 grid sm:grid-cols-2 gap-3">
        <label className="text-xs">From<input type="date" className="field" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></label>
        <label className="text-xs">To (inclusive)<input type="date" className="field" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></label>
        <input className="field" type="number" placeholder="Flexible price € / night" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
        <input className="field" type="number" placeholder="Min nights" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} />
        <input className="field" placeholder="Label (internal)" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} />
        <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{f.price ? `Non-ref: €${nonRefOf(+f.price)}` : ""}</span><button className="btn-gold" onClick={add}>Apply</button></div>
      </div>
      {s.overrides.map((o) => (
        <div key={o.id} className="panel p-4 flex justify-between items-center gap-3 text-sm">
          <div><p>{fd(o.start)} → {fd(o.end)} {o.label && <span className="text-muted-foreground">· {o.label}</span>}</p><p className="text-xs text-muted-foreground">{o.price ? `Flex €${o.price} / Non-ref €${nonRefOf(o.price)}` : "Default price"} · {o.minNights ? `min ${o.minNights} nights` : "default min"}</p></div>
          <button className="text-destructive text-xs" onClick={() => update((st) => ({ ...st, overrides: st.overrides.filter((x) => x.id !== o.id) }))}>Remove</button>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Check today+30: flexible €{flexRateFor(addDays(today, 30), s.overrides)}, min {minNightsFor(addDays(today, 30), s.overrides)} nights.</p>
    </div>
  );
}

function Blocks() {
  const s = useStore();
  const today = todayISO();
  const [f, setF] = useState({ start: addDays(today, 14), end: addDays(today, 16), reason: "" });
  const add = () => { if (f.end <= f.start) return; update((st: State) => ({ ...st, blocks: [...st.blocks, { id: uid(), start: f.start, end: f.end, reason: f.reason.trim() || "—" }] })); setF({ ...f, reason: "" }); };
  return (
    <div className="space-y-4">
      <div className="panel p-5 grid sm:grid-cols-2 gap-3">
        <label className="text-xs">First blocked night<input type="date" className="field" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></label>
        <label className="text-xs">Until (free from)<input type="date" className="field" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></label>
        <input className="field sm:col-span-2" placeholder="Internal reason (not shown to guests)" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
        <button className="btn-gold sm:col-span-2" onClick={add}>Block dates</button>
      </div>
      {s.blocks.map((b) => (
        <div key={b.id} className="panel p-4 flex justify-between items-center text-sm gap-3">
          <div><p>{fd(b.start)} → {fd(b.end)}</p><p className="text-xs text-muted-foreground">{b.reason}</p></div>
          <button className="text-xs text-destructive" onClick={() => update((st) => ({ ...st, blocks: st.blocks.filter((x) => x.id !== b.id) }))}>Unblock</button>
        </div>
      ))}
    </div>
  );
}

function ReviewsMod() {
  const s = useStore();
  const set = (id: string, status: "approved" | "rejected" | "pending") => update((st) => ({ ...st, reviews: st.reviews.map((r) => (r.id === id ? { ...r, status } : r)) }));
  return (
    <div className="space-y-3">
      {["pending", "approved", "rejected"].map((st) => (
        <div key={st}>
          <p className="eyebrow my-3">{st}</p>
          {s.reviews.filter((r) => r.status === st).map((r) => (
            <div key={r.id} className="panel p-4 mb-2 text-sm">
              <div className="flex justify-between"><span>{r.name} · {"★".repeat(r.rating)}</span>{r.sample && <span className="text-xs text-primary">SAMPLE</span>}</div>
              <p className="mt-2 text-muted-foreground">{r.text}</p>
              <div className="flex gap-3 mt-3 text-xs">
                {st !== "approved" && <button className="text-olive" onClick={() => set(r.id, "approved")}>Approve</button>}
                {st !== "rejected" && <button className="text-destructive" onClick={() => set(r.id, "rejected")}>Reject</button>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Notifications() {
  const { settings } = useStore();
  const set = (p: Partial<typeof settings>) => update((st) => ({ ...st, settings: { ...st.settings, ...p } }));
  return (
    <div className="panel p-5 space-y-4 max-w-xl text-sm">
      <p className="font-serif text-2xl">New paid booking alerts</p>
      <label className="flex items-center justify-between">Email notification<input type="checkbox" className="accent-primary scale-125" checked={settings.notifyEmail} onChange={(e) => set({ notifyEmail: e.target.checked })} /></label>
      <input className="field" value={settings.ownerEmail} onChange={(e) => set({ ownerEmail: e.target.value })} />
      <label className="flex items-center justify-between">Push notification (mobile)<input type="checkbox" className="accent-primary scale-125" checked={settings.notifyPush} onChange={(e) => set({ notifyPush: e.target.checked })} /></label>
      <p className="text-xs text-muted-foreground">Demo only — nothing is sent yet.</p>
      <hr />
      <p className="font-serif text-2xl">Public details</p>
      <label className="block">Public address<input className="field mt-1" placeholder="Leave empty until final" value={settings.address} onChange={(e) => set({ address: e.target.value })} /></label>
      <label className="block">Phone / Viber<input className="field mt-1" value={settings.phone} onChange={(e) => set({ phone: e.target.value })} /></label>
    </div>
  );
}

function Emails() {
  const s = useStore();
  const b = s.bookings.find((x) => x.status === "confirmed" && x.checkIn >= todayISO()) ?? s.bookings[0];
  const [which, setWhich] = useState(0);
  if (!b) return null;
  const list = [
    { t: "Booking confirmation — guest", subj: `Your MM Home booking ${b.code} is confirmed`, body: [`Dear ${b.name},`, `Thank you for booking MM Home. Your stay from ${fd(b.checkIn)} to ${fd(b.checkOut)} for ${b.guests} guests is confirmed.`, `Rate: ${b.rate === "flexible" ? "Flexible" : "Non-refundable"} · Total paid: ${eur(b.total)} (cleaning included).`, `Personal check-in from 15:00 — we will welcome you in person. Please bring an ID card or passport. Check-out by 11:00.`, `Manage your booking with your email and code ${b.code}.`] },
    { t: "Booking confirmation — owner", subj: `New paid booking ${b.code}`, body: [`${b.name} · ${b.email} · ${b.phone}`, `${fd(b.checkIn)} → ${fd(b.checkOut)} · ${b.guests} guests · ${b.rate}`, `Total ${eur(b.total)}`] },
    { t: "Pre-arrival (2 days before)", subj: `See you soon at MM Home`, body: [`Dear ${b.name},`, `We're looking forward to welcoming you on ${fd(b.checkIn)}. Personal check-in is from 15:00.`, `Safe travels! If you need anything at all, contact us at ${s.settings.phone} (phone/Viber) or info@mmhome.gr.`] },
    { t: "Post-checkout thank-you", subj: `Thank you for staying at MM Home`, body: [`Dear ${b.name},`, `Thank you for choosing MM Home. We hope you felt at home.`, `We'd love to hear about your stay: https://mmhome.gr/review/${b.code} (unique verified-stay link).`] },
  ];
  const e = list[which];
  if (!e) return null;
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">{list.map((x, i) => <button key={x.t} onClick={() => setWhich(i)} className={`px-3 py-1.5 rounded-full text-xs border ${i === which ? "bg-foreground text-background" : ""}`}>{x.t}</button>)}</div>
      <div className="panel max-w-xl overflow-hidden">
        <div className="bg-secondary p-6 text-center"><Logo /><p className="font-serif text-2xl mt-2">MM Home</p><p className="font-serif italic text-sm text-muted-foreground">{SLOGAN}</p></div>
        <div className="p-6 text-sm space-y-3"><p className="text-xs text-muted-foreground">Subject: {e.subj}</p>{e.body.map((p) => <p key={p}>{p}</p>)}<p className="pt-2">— MM Home</p></div>
      </div>
      <p className="text-xs text-muted-foreground">Preview only — no emails are sent in this prototype.</p>
    </div>
  );
}
