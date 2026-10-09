import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useT } from "@/lib/i18n";
import { meta } from "@/lib/meta";
import { useStore } from "@/lib/store";
import { PageTitle } from "@/components/site";

export const Route = createFileRoute("/location")({
  head: () => meta("Τοποθεσία — MM Home κέντρο Τρικάλων", "Περίπου 5 λεπτά με τα πόδια από την κεντρική πλατεία, τον σταθμό τρένων και τον Μύλο των Ξωτικών."),
  component: Location,
});

function Location() {
  const { t } = useT();
  const { settings } = useStore();
  return (
    <>
      <PageTitle title={t.loc.title} sub={t.loc.sub} />
      <div className="mx-auto max-w-7xl px-5 grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Interactive map placeholder — swap for an embedded map once the address is final */}
        <div className="panel aspect-[16/10] flex flex-col items-center justify-center bg-secondary text-muted-foreground gap-3">
          <MapPin className="text-primary" size={36} />
          <p className="font-serif text-2xl text-foreground">{settings.address || t.common.addressPending}</p>
          {settings.mapsUrl ? <a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-line">{t.nav.location}</a> : <p className="text-sm">{t.loc.map}</p>}
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
