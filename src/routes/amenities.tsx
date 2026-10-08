import { createFileRoute } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { meta } from "@/lib/meta";
import { PageTitle } from "@/components/site";

export const Route = createFileRoute("/amenities")({
  head: () => meta("Παροχές — MM Home Τρίκαλα", "Ενδοδαπέδια θέρμανση, Fiber Wi‑Fi 300 Mbps, πλήρης κουζίνα, πλυντήριο-στεγνωτήριο και κανόνες σπιτιού."),
  component: Amenities,
});

function Amenities() {
  const { t } = useT();
  return (
    <>
      <PageTitle title={t.amen.title} sub={t.amen.sub} />
      <div className="mx-auto max-w-7xl px-5 grid gap-x-12 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
        {t.amen.cats.map((c) => (
          <div key={c.t} className="border-t pt-6">
            <h2 className="text-3xl mb-4">{c.t}</h2>
            <ul className="space-y-2.5 text-muted-foreground">
              {c.i.map((i) => <li key={i} className="flex gap-3"><span className="mt-2.5 h-1 w-3 bg-primary shrink-0" />{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
