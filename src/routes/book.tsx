import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { fmtDate, useT } from "@/lib/i18n";
import { meta } from "@/lib/meta";
import { todayISO, uid, update, useStore } from "@/lib/store";
import { MonthCalendar } from "@/components/MonthCalendar";
import { PageTitle } from "@/components/site";
import { diffDays, genCode, LEAD_DAYS, MAX_GUESTS, minNightsFor, nightTaken, nightsOf, quote, validateStay, type Booking, type RateType } from "@/lib/booking";

export const Route = createFileRoute("/book")({
  head: () => meta("Κράτηση — MM Home Τρίκαλα", "Κάντε απευθείας κράτηση στο MM Home. Ενιαία τιμή για 1–6 επισκέπτες, χωρίς κρυφές χρεώσεις."),
  component: Book,
});

import { DepositNotice } from "@/components/DepositNotice";
import { acceptanceValid, feeBreakdown } from "@/lib/policies";
import { trackFunnel } from "@/lib/analytics";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Book() {
  const { t, lang } = useT();
  const s = useStore();
  const today = todayISO();
  useEffect(() => { trackFunnel("availability_opened"); }, []);
  const [step, setStep] = useState(0);
  const [ci, setCi] = useState<string | null>(null);
  const [co, setCo] = useState<string | null>(null);
  const [rate, setRate] = useState<RateType>("flexible");
  const [f, setF] = useState({ name: "", email: "", phone: "", guests: 2, adult: false, terms: false, nrAck: false });
  const [err, setErr] = useState("");
  const [done, setDone] = useState<Booking | null>(null);
  const [off, setOff] = useState(0);

  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + off);
  const m2 = new Date(base); m2.setMonth(m2.getMonth() + 1);

  const stayErr = ci && co ? validateStay(ci, co, today, s.bookings, s.blocks, s.overrides) : null;
  const flexQ = useMemo(() => (ci && co ? quote(ci, co, "flexible", s.overrides) : null), [ci, co, s.overrides]);
  const nrQ = useMemo(() => (ci && co ? quote(ci, co, "nonref", s.overrides) : null), [ci, co, s.overrides]);
  const q = rate === "flexible" ? flexQ : nrQ;
  const n = ci && co ? diffDays(ci, co) : 0;

  const pick = (iso: string) => {
    if (!ci || co || iso <= ci) { setCi(iso); setCo(null); } else setCo(iso);
  };
  const info = (iso: string) => {
    const past = diffDays(today, iso) < LEAD_DAYS;
    const taken = nightTaken(iso, s.bookings, s.blocks);
    const sel = ci && (iso === ci || iso === co || (co && iso > ci && iso < co));
    const canCheckout = ci && !co && iso > ci && !nightsOf(ci, iso).some((d) => nightTaken(d, s.bookings, s.blocks));
    const disabled = past || (taken && !canCheckout);
    return {
      disabled: !!disabled,
      className: sel ? "bg-primary text-primary-foreground" : disabled ? "text-muted-foreground/40 line-through" : "hover:bg-accent",
    };
  };
  const errText = stayErr ? t.book.errors[stayErr].replace("{n}", String(ci ? minNightsFor(ci, s.overrides) : 2)) : "";

  const detailsOk = f.name.trim().length > 1 && emailRe.test(f.email.trim()) && f.phone.replace(/\D/g, "").length >= 8 && acceptanceValid(rate, f.adult, f.terms, f.nrAck);

  const pay = () => {
    if (!detailsOk || !ci || !co || !q || validateStay(ci, co, today, s.bookings, s.blocks, s.overrides)) return;
    const b: Booking = { id: uid(), code: genCode(), checkIn: ci, checkOut: co, guests: f.guests, name: f.name.trim(), email: f.email.trim().toLowerCase(), phone: f.phone.trim(), rate, total: q.total, status: "confirmed", createdAt: today, source: "web" };
    update((st) => ({ ...st, bookings: [...st.bookings, b] }));
    trackFunnel("booking_completed"); setDone(b); setStep(4);
  };

  const Summary = () => ci && co && q ? (
    <div className="panel p-6 text-sm space-y-2">
      <div className="flex justify-between"><span>{t.common.checkIn}</span><span>{fmtDate(ci, lang)} · 15:00</span></div>
      <div className="flex justify-between"><span>{t.common.checkOut}</span><span>{fmtDate(co, lang)} · 11:00</span></div>
      <div className="flex justify-between"><span>{n} {t.common.nights}</span><span>{rate === "flexible" ? t.book.flexT : t.book.nrT}</span></div>
      <div className="flex justify-between border-t pt-3"><span>{lang === "el" ? "Διαμονή" : "Accommodation"}</span><span>€{feeBreakdown(q.total,n,s.settings.climateFee).accommodation.toFixed(2)}</span></div>
       <div className="flex justify-between gap-4"><span>{lang === "el" ? "Τέλος Ανθεκτικότητας στην Κλιματική Κρίση (περιλαμβάνεται)" : "Climate Crisis Resilience Fee (included)"}</span><span>€{feeBreakdown(q.total,n,s.settings.climateFee).fee.toFixed(2)}</span></div>
       <p className="text-xs text-muted-foreground">{lang === "el" ? "Δοκιμαστική, ρυθμιζόμενη ανάλυση — εκκρεμεί επιβεβαίωση λογιστή." : "Demo, configurable breakdown — pending accountant verification."}</p>
       <div className="flex justify-between border-t pt-3 font-serif text-2xl"><span>{t.common.total}</span><span>€{q.total}</span></div>
      <p className="text-xs text-muted-foreground">{t.book.included}</p>
    </div>
  ) : null;

  return (
    <>
      <PageTitle title={t.book.title} sub={t.book.times} />
      <div className="mx-auto max-w-5xl px-5">
        <ol className="flex gap-2 mb-10 text-xs uppercase tracking-widest overflow-x-auto">
          {t.book.steps.map((x, i) => <li key={x} className={`pb-2 border-b-2 px-1 whitespace-nowrap ${i === step ? "border-primary text-foreground" : i < step ? "border-primary/40 text-muted-foreground" : "border-transparent text-muted-foreground/60"}`}>{i + 1}. {x}</li>)}
        </ol>

        {step === 0 && (
          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            <div className="panel p-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">{t.book.pick}</p>
                <div className="flex gap-2">
                  <button disabled={off === 0} onClick={() => setOff(off - 1)} className="p-1 disabled:opacity-30"><ChevronLeft /></button>
                  <button onClick={() => setOff(off + 1)} className="p-1"><ChevronRight /></button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {[base, m2].map((d) => <MonthCalendar key={d.toISOString()} year={d.getFullYear()} month={d.getMonth()} locale={t.months} info={info} onPick={pick} />)}
              </div>
              <p className="mt-4 text-xs text-muted-foreground"><span className="line-through">12</span> = {t.book.legendTaken}</p>
            </div>
            <div className="space-y-4">
              <label className="block text-sm">{t.book.guests}
                <select className="field mt-1" value={f.guests} onChange={(e) => setF({ ...f, guests: +e.target.value })}>
                  {Array.from({ length: MAX_GUESTS }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                </select>
              </label>
              {stayErr && <p className="text-sm text-destructive">{errText}</p>}
              {!stayErr && <Summary />}
              <button className="btn-gold w-full" disabled={!ci || !co || !!stayErr} onClick={() => { trackFunnel("booking_started"); setStep(1); }}>{t.common.next}</button>
            </div>
          </div>
        )}

        {step === 1 && flexQ && nrQ && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              {([["flexible", t.book.flexT, t.book.flex, flexQ.total], ["nonref", t.book.nrT, t.book.nr, nrQ.total]] as const).map(([k, title, desc, tot]) => (
                <button key={k} onClick={() => setRate(k)} className={`panel p-7 text-left transition ${rate === k ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100"}`}>
                  <p className="font-serif text-3xl">{title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                  <p className="mt-6 font-serif text-4xl">€{tot}</p>
                  <p className="text-xs text-muted-foreground">{n} {t.common.nights} · €{Math.round(tot / n)} {t.common.perNight}</p>
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{t.book.included}</p>
            <div className="flex gap-3"><button className="btn-line" onClick={() => setStep(0)}>{t.common.back}</button><button className="btn-gold" onClick={() => setStep(2)}>{t.common.next}</button></div>
          </div>
        )}

        {step === 2 && (
          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            <div className="panel p-6 space-y-4">
              <input className="field" placeholder={t.book.name} value={f.name} maxLength={100} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <input className="field" type="email" placeholder={t.book.email} value={f.email} maxLength={255} onChange={(e) => setF({ ...f, email: e.target.value })} />
              <input className="field" type="tel" placeholder={t.book.phone} value={f.phone} maxLength={20} onChange={(e) => setF({ ...f, phone: e.target.value })} />
              <label className="block text-sm">{t.book.guests}
                <select className="field mt-1" value={f.guests} onChange={(e) => setF({ ...f, guests: +e.target.value })}>
                  {Array.from({ length: MAX_GUESTS }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                </select>
              </label>
              <p className="text-xs text-muted-foreground">{t.book.id}</p>
              {([["adult", t.book.adult], ["terms", t.book.terms], ...(rate === "nonref" ? [["nrAck", t.book.nrAck]] : [])] as [keyof typeof f, string][]).map(([k, label]) => (
                <label key={k} className="flex gap-3 text-sm items-start"><input type="checkbox" className="mt-1 accent-primary" checked={f[k] as boolean} onChange={(e) => setF({ ...f, [k]: e.target.checked })} />{label}</label>
              ))}
              <Link to="/terms" target="_blank" className="text-primary underline text-sm">{lang === "el" ? "Όροι Κράτησης & Διαμονής · Πολιτική Ακύρωσης" : "Booking & Stay Terms · Cancellation Policy"}</Link>
               <DepositNotice />
               {err && <p className="text-sm text-destructive">{err}</p>}
            </div>
            <div className="space-y-4">
              <Summary />
              <div className="flex gap-3">
                <button className="btn-line" onClick={() => { trackFunnel("booking_started"); setStep(1); }}>{t.common.back}</button>
                <button className="btn-gold flex-1" onClick={() => (detailsOk ? (setErr(""), setStep(3)) : setErr(t.book.invalid))}>{t.common.next}</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            <div className="panel p-8 text-center space-y-4">
              <ShieldCheck className="mx-auto text-primary" size={40} />
              <p className="font-serif text-3xl">{t.book.payT}</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">{t.book.payNote}</p>
              <DepositNotice />
               <button className="btn-gold" onClick={pay}>{t.book.pay} · €{q?.total}</button>
            </div>
            <div className="space-y-4"><Summary /><button className="btn-line" onClick={() => setStep(2)}>{t.common.back}</button></div>
          </div>
        )}

        {step === 4 && done && (
          <div className="panel p-10 text-center max-w-2xl mx-auto fade-up">
            <p className="eyebrow">MM Home</p>
            <h2 className="text-4xl mt-2">{t.book.doneT}</h2>
            <p className="mt-6 text-sm text-muted-foreground">{t.book.code}</p>
            <p className="font-serif text-4xl tracking-widest text-primary">{done.code}</p>
            <p className="mt-6">{fmtDate(done.checkIn, lang)} → {fmtDate(done.checkOut, lang)} · {done.guests} {t.common.guests} · €{done.total}</p>
            <p className="mt-6 text-muted-foreground">{t.book.doneNote}</p>
            <div className="mt-6 text-left"><DepositNotice /></div>
             <p className="mt-4 text-sm text-muted-foreground">{lang === "el" ? "Θα λάβετε άλλο μήνυμα 2 ημέρες πριν την άφιξη (προεπισκόπηση επίδειξης, χωρίς αποστολή)." : "Another message is scheduled 2 days before arrival (demo preview, no sending)."}</p>
             <Link to="/my-booking" className="btn-line mt-8">{t.book.manage}</Link>
          </div>
        )}
      </div>
    </>
  );
}

