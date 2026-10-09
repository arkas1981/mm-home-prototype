import { createFileRoute, Link } from "@tanstack/react-router";
import { SLOGAN, useT } from "@/lib/i18n";
import { photos } from "@/lib/photos";
import { meta } from "@/lib/meta";
import { BASE_RATE } from "@/lib/booking";

export const Route = createFileRoute("/")({
  head: () => meta("MM Home Τρίκαλα — Your Home Away From Home", "Πολυτελές, ανακαινισμένο διαμέρισμα 94 m² στο κέντρο των Τρικάλων για έως 6 επισκέπτες. Απευθείας κράτηση."),
  component: Home,
});

function Home() {
  const { t } = useT();
  return (
    <>
      <section className="relative h-[75svh] min-h-[480px] overflow-hidden">
        <img src={photos.living} alt="MM Home" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl h-full px-5 flex flex-col justify-end pb-16 text-background fade-up">
          <p className="eyebrow !text-background/85">{t.home.eyebrow}</p>
          <h1 className="mt-4 text-6xl md:text-8xl">MM Home</h1>
          <p className="mt-2 font-serif italic text-2xl md:text-3xl">{SLOGAN}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/book" className="btn-gold">{t.common.bookNow}</Link>
            <Link to="/stay" className="btn-line !border-background !text-background hover:!bg-background hover:!text-foreground">{t.home.explore}</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-24 text-center">
        <p className="font-serif text-3xl md:text-4xl leading-snug">{t.home.intro}</p>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-6 gap-y-6 text-sm tracking-wide text-muted-foreground">
          {t.home.facts.map((f) => <div key={f} className="border-l first:border-l-0 md:px-2">{f}</div>)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 grid md:grid-cols-2 gap-4">
        <img src={photos.bedroom} alt="" loading="lazy" width={1408} height={1008} className="rounded-2xl w-full h-[420px] object-cover" />
        <img src={photos.kitchen} alt="" loading="lazy" width={1408} height={1008} className="rounded-2xl w-full h-[420px] object-cover" />
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="eyebrow">{t.nav.location}</p>
          <h2 className="mt-3 text-4xl md:text-5xl">{t.home.walkTitle}</h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">{t.home.walk}</p>
          <Link to="/location" className="btn-line mt-8">{t.nav.location}</Link>
        </div>
        <img src={photos.balcony} alt="" loading="lazy" width={1408} height={1008} className="rounded-2xl w-full h-[460px] object-cover" />
      </section>

      <section className="mx-auto max-w-3xl px-5 text-center border-t py-14">
        <p className="eyebrow">{t.common.from}</p>
        <p className="font-serif text-5xl mt-2">€{BASE_RATE} <span className="text-xl text-muted-foreground">{t.common.perNight}</span></p>
        <p className="mt-4 text-muted-foreground">{t.home.priceNote}</p>
        <Link to="/book" className="btn-gold mt-8">{t.common.bookNow}</Link>
      </section>
    </>
  );
}
