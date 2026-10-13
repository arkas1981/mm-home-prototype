import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { fmtDate, useT } from "@/lib/i18n";
import { confirmBooking } from "@/lib/cloud.functions";
import { DepositNotice } from "@/components/DepositNotice";
import { trackFunnel } from "@/lib/analytics";

export const Route = createFileRoute("/book-success")({
  head: () => ({ meta: [{ title: "Επιβεβαίωση κράτησης — MM Home" }, { name: "description", content: "Επιβεβαίωση πληρωμής και κράτησης στο MM Home." }, { property: "og:title", content: "Επιβεβαίωση κράτησης — MM Home" }, { property: "og:description", content: "Επιβεβαίωση πληρωμής και κράτησης στο MM Home." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Success,
});

type Done = { code: string; check_in: string; check_out: string; guests: number; total: number };

function Success() {
  const { t, lang } = useT();
  const confirm = useServerFn(confirmBooking);
  const [state, setState] = useState<"loading" | "error" | Done>("loading");
  useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get("session_id") ?? "";
    // The booking is confirmed only by the server after it verifies the payment with Stripe.
    confirm({ data: { sessionId: sid } })
      .then((r) => { if ("booking" in r && r.booking) { setState(r.booking); trackFunnel("booking_completed"); } else setState("error"); })
      .catch(() => setState("error"));
  }, [confirm]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      {state === "loading" && <p className="text-center text-muted-foreground">{lang === "el" ? "Επιβεβαίωση πληρωμής…" : "Confirming payment…"}</p>}
      {state === "error" && (
        <div className="panel p-10 text-center max-w-2xl mx-auto">
          <p className="font-serif text-3xl">{lang === "el" ? "Η πληρωμή δεν επιβεβαιώθηκε" : "Payment not confirmed"}</p>
          <p className="mt-4 text-muted-foreground">{lang === "el" ? "Δεν έγινε κράτηση. Δοκιμάστε ξανά ή επικοινωνήστε μαζί μας." : "No booking was made. Please try again or contact us."}</p>
          <Link to="/book" className="btn-gold mt-8">{t.common.bookNow}</Link>
        </div>
      )}
      {typeof state === "object" && (
        <div className="panel p-10 text-center max-w-2xl mx-auto fade-up">
          <p className="eyebrow">MM Home</p>
          <h2 className="text-4xl mt-2">{t.book.doneT}</h2>
          <p className="mt-6 text-sm text-muted-foreground">{t.book.code}</p>
          <p className="font-serif text-4xl tracking-widest text-primary">{state.code}</p>
          <p className="mt-6">{fmtDate(state.check_in, lang)} → {fmtDate(state.check_out, lang)} · {state.guests} {t.common.guests} · €{state.total}</p>
          <p className="mt-6 text-muted-foreground">{t.book.doneNote}</p>
          <div className="mt-6 text-left"><DepositNotice /></div>
          <Link to="/my-booking" className="btn-line mt-8">{t.book.manage}</Link>
        </div>
      )}
    </div>
  );
}
