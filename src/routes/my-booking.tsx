import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { fmtDate, useT } from "@/lib/i18n";
import { meta } from "@/lib/meta";
import { todayISO, useStore } from "@/lib/store";
import { useServerFn } from "@tanstack/react-start";
import { cancelBooking, lookupBooking } from "@/lib/cloud.functions";
import { PageTitle } from "@/components/site";
import { DepositNotice } from "@/components/DepositNotice";
import { diffDays, refundFor } from "@/lib/booking";

export const Route = createFileRoute("/my-booking")({
  head: () => meta("Η κράτησή μου — MM Home", "Δείτε ή ακυρώστε την κράτησή σας στο MM Home με email και κωδικό κράτησης."),
  component: MyBooking,
});

function MyBooking() {
  const { t, lang } = useT();
  const { settings } = useStore();
  const lookup = useServerFn(lookupBooking); const cancelFn = useServerFn(cancelBooking);
  const [email, setEmail] = useState(""); const [code, setCode] = useState("");
  type B = { checkIn: string; checkOut: string; code: string; guests: number; rate: "flexible" | "nonref"; total: number; status: "confirmed" | "cancelled"; refund?: number };
  const [b, setB] = useState<B | null>(null); const [nf, setNf] = useState(false); const [confirming, setConfirming] = useState(false);
  const find = async () => {
    const { booking: x } = await lookup({ data: { email, code } }).catch(() => ({ booking: null }));
    const hit = x && x.status !== "pending" ? { checkIn: x.check_in, checkOut: x.check_out, code: x.code, guests: x.guests, rate: x.rate as B["rate"], total: x.total, status: (x.status === "confirmed" ? "confirmed" : "cancelled") as B["status"], ...(x.refund != null ? { refund: x.refund } : {}) } : null;
    setB(hit); setNf(!hit); setConfirming(false);
  };
  const today = todayISO();
  const r = b ? refundFor(b, today) : null;
  const cancel = async () => {
    if (!b || !r) return;
    const res = await cancelFn({ data: { email, code } }).catch(() => null);
    if (res && "refund" in res) setB({ ...b, status: "cancelled", refund: res.refund });
    setConfirming(false);
  };
  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="flex justify-between py-2 border-b gap-4"><span className="text-muted-foreground">{k}</span><span className="text-right">{v}</span></div>;
  return (
    <>
      <PageTitle title={t.my.title} sub={t.my.sub} />
      <div className="mx-auto max-w-xl px-5 space-y-8">
        <div className="panel p-6 space-y-3">
          <input className="field" type="email" placeholder={t.book.email} value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="field uppercase" placeholder={t.my.code + " (MM-XXXXXX)"} value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn-gold w-full" onClick={find}>{t.my.find}</button>
          {nf && <p className="text-sm text-destructive">{t.my.notFound}</p>}
        </div>
        {b && r && (
          <div className="panel p-6 text-sm">
            <p className="font-serif text-3xl mb-4 tracking-wider text-primary">{b.code}</p>
            <Row k={t.my.status} v={b.status === "confirmed" ? t.my.confirmed : t.my.cancelled} />
            <Row k={t.common.checkIn} v={`${fmtDate(b.checkIn, lang)} · 15:00`} />
            <Row k={t.common.checkOut} v={`${fmtDate(b.checkOut, lang)} · 11:00`} />
            <Row k={t.book.guests} v={b.guests} />
            <Row k={t.my.rate} v={b.rate === "flexible" ? t.book.flexT : t.book.nrT} />
            <Row k={t.my.policy} v={b.rate === "flexible" ? t.book.flex : t.book.nr} />
            <Row k={t.common.total} v={`€${b.total} · ${t.my.paid}`} />
            {b.status === "cancelled" && <Row k={t.my.refunded} v={`€${b.refund ?? 0}`} />}
            <DepositNotice />
            <p className="mt-4 text-muted-foreground">{lang === "el" ? "Αλλαγή επισκεπτών δωρεάν έως 6 με ενημέρωση πριν το check-in. Μη εμφάνιση ή πρόωρη αναχώρηση: καμία επιστροφή." : "Guest changes are free up to 6 when notified before check-in. No-show or early departure: no refund."}</p>
            <p className="mt-5 text-muted-foreground">{t.my.change} {settings.phone} · info@mmhome.gr</p>
            {b.status === "confirmed" && diffDays(today, b.checkIn) > 0 && (
              <div className="mt-6">
                {!confirming ? <button className="btn-line" onClick={() => setConfirming(true)}>{t.my.cancel}</button> : (
                  <div className="rounded-lg bg-secondary p-5 space-y-4">
                    <p className="font-serif text-2xl">{t.my.refundIs.replace("{p}", String(r.percent)).replace("{a}", String(r.amount))}</p>
                    <div className="flex gap-3 flex-wrap">
                      <button className="btn-gold !bg-destructive" onClick={cancel}>{t.my.confirmCancel}</button>
                      <button className="btn-line" onClick={() => setConfirming(false)}>{t.my.keep}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
