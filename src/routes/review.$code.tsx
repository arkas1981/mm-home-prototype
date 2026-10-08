import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Star } from "lucide-react";
import { useT } from "@/lib/i18n";
import { meta } from "@/lib/meta";
import { todayISO, uid, update, useStore } from "@/lib/store";
import { PageTitle } from "@/components/site";

export const Route = createFileRoute("/review/$code")({
  head: () => ({ ...meta("Αξιολόγηση διαμονής — MM Home", "Μοιραστείτε την εμπειρία της διαμονής σας στο MM Home."), }),
  component: WriteReview,
});

function WriteReview() {
  const { code } = Route.useParams();
  const { t } = useT();
  const { bookings, reviews } = useStore();
  const b = bookings.find((x) => x.code === code && x.status === "confirmed" && x.checkOut <= todayISO());
  const already = reviews.some((r) => r.bookingCode === code);
  const [name, setName] = useState(""); const [text, setText] = useState(""); const [rating, setRating] = useState(5); const [done, setDone] = useState(false);
  const submit = () => {
    if (!b || !name.trim() || !text.trim()) return;
    update((s) => ({ ...s, reviews: [...s.reviews, { id: uid(), name: name.trim().slice(0, 60), text: text.trim().slice(0, 1000), rating, date: todayISO(), status: "pending", sample: false, bookingCode: code }] }));
    setDone(true);
  };
  return (
    <>
      <PageTitle title={t.rev.writeT} />
      <div className="mx-auto max-w-xl px-5">
        {!b ? <p className="text-muted-foreground">{t.rev.invalid}</p> : done || already ? <p className="panel p-8 font-serif text-2xl">{t.rev.thanks}</p> : (
          <div className="panel p-8 space-y-4">
            <div className="flex gap-1 text-primary">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setRating(n)}><Star fill={n <= rating ? "currentColor" : "none"} /></button>)}</div>
            <input className="field" placeholder={t.rev.name} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            <textarea className="field min-h-32" placeholder={t.rev.text} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
            <button className="btn-gold" onClick={submit}>{t.rev.submit}</button>
          </div>
        )}
      </div>
    </>
  );
}
