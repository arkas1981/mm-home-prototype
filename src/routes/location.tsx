import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useT } from "@/lib/i18n";
import { meta } from "@/lib/meta";
import { useStore } from "@/lib/store";
import { PageTitle } from "@/components/site";
import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";

export const Route = createFileRoute("/location")({
  head: () => meta("Τοποθεσία — MM Home κέντρο Τρικάλων", "Περίπου 5 λεπτά με τα πόδια από την κεντρική πλατεία, τον σταθμό τρένων και τον Μύλο των Ξωτικών."),
  component: Location,
});

function Location() {
  const { t, lang } = useT();
  const { settings } = useStore();
  const address = settings.address || "Ασκληπιού 44, Τρίκαλα";
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&hl=${lang}&z=17&output=embed`;
  const directions = settings.mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  return (
    <>
      <PageTitle title={t.loc.title} sub={t.loc.sub} />
      <div className="mx-auto max-w-7xl px-5 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <iframe title={lang === "el" ? "MM Home — Ασκληπιού 44, Τρίκαλα" : "MM Home — 44 Asklipiou Street, Trikala"} src={mapUrl} loading="lazy" referrerPolicy="no-referrer" className="w-full h-[360px] md:h-[480px] rounded-lg border" allowFullScreen />
          <p className="mt-5 flex items-center gap-2 text-lg"><MapPin size={20} className="text-primary"/>{address}</p>
          <Button asChild className="btn-gold h-auto mt-5 whitespace-normal text-center"><a href={directions} target="_blank" rel="noopener noreferrer"><Navigation/>{t.loc.map}</a></Button>
        </div>
        <ul className="divide-y">
          {t.loc.items.map(([a, b]) => (
            <li key={a} className="py-5 flex justify-between gap-4"><span>{a}</span><span className="text-primary whitespace-nowrap">{b}</span></li>
          ))}
        </ul>
      </div>
    </>
  );
}
