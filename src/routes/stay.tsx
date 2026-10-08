import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { photos } from "@/lib/photos";
import { meta } from "@/lib/meta";
import { PageTitle } from "@/components/site";

export const Route = createFileRoute("/stay")({
  head: () => meta("Διαμονή — MM Home Τρίκαλα", "Σαλόνι με τζάκι ατμού, τρία υπνοδωμάτια, πλήρης κουζίνα και δύο μπαλκόνια στο MM Home."),
  component: Stay,
});

function Block({ img, title, children }: { img: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-5 mb-20">
      <img src={img} alt={title} loading="lazy" width={1408} height={1008} className="w-full h-[55vh] min-h-[340px] object-cover rounded-2xl" />
      <div className="mt-8 max-w-2xl">
        <h2 className="text-4xl">{title}</h2>
        <div className="mt-3 text-muted-foreground leading-relaxed space-y-2">{children}</div>
      </div>
    </section>
  );
}

function Stay() {
  const { t } = useT();
  const s = t.stay;
  return (
    <>
      <PageTitle title={s.title} sub={s.sub} />
      <Block img={photos.living} title={s.livingT}><p>{s.living}</p></Block>
      <Block img={photos.bedroom} title={s.bedsT}><p>{s.beds}</p><p>{s.smart}</p></Block>
      <Block img={photos.kitchen} title={s.kitchenT}><p>{s.kitchen}</p></Block>
      <Block img={photos.balcony} title={s.outT}><p>{s.outFront}</p><p>{s.outRear}</p></Block>
      <div className="text-center"><Link to="/book" className="btn-gold">{t.common.bookNow}</Link></div>
    </>
  );
}
