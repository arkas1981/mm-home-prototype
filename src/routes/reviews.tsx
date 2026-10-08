import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { fmtDate, useT } from "@/lib/i18n";
import { meta } from "@/lib/meta";
import { useStore } from "@/lib/store";
import { PageTitle } from "@/components/site";

export const Route = createFileRoute("/reviews")({
  head: () => meta("Αξιολογήσεις — MM Home Τρίκαλα", "Αξιολογήσεις αποκλειστικά από επιβεβαιωμένες διαμονές στο MM Home."),
  component: Reviews,
});

function Reviews() {
  const { t, lang } = useT();
  const { reviews } = useStore();
  const list = reviews.filter((r) => r.status === "approved");
  return (
    <>
      <PageTitle title={t.rev.title} sub={t.rev.sub} />
      <div className="mx-auto max-w-4xl px-5 space-y-6">
        {list.length === 0 && <p className="text-muted-foreground">{t.rev.none}</p>}
        {list.map((r) => (
          <article key={r.id} className="panel p-8">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-0.5 text-primary">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}</div>
              {r.sample && <span className="text-xs uppercase tracking-widest border border-primary text-primary rounded-full px-3 py-1">{t.common.demo}</span>}
            </div>
            <p className="mt-4 font-serif text-2xl leading-snug">“{r.text}”</p>
            <p className="mt-4 text-sm text-muted-foreground">{r.name} · {t.rev.verified} · {fmtDate(r.date, lang)}</p>
          </article>
        ))}
        {list.some((r) => r.sample) && <p className="text-xs text-muted-foreground">{t.rev.sampleNote}</p>}
      </div>
    </>
  );
}
