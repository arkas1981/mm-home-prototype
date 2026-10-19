import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n";
import { meta } from "@/lib/meta";
import { PageTitle } from "@/components/site";
import { MonthCalendar } from "@/components/MonthCalendar";
import { useAvailability } from "@/lib/cloud-data";
import { nightTaken } from "@/lib/booking";

export const Route = createFileRoute("/book")({
  head: () =>
    meta(
      "Κράτηση — MM Home Τρίκαλα",
      "Διαθεσιμότητα και online κρατήσεις στο MM Home."
    ),
  component: BookingCalendarPreview,
});

function BookingCalendarPreview() {
  const { lang, t } = useT();
  const { data } = useAvailability();
  const [off, setOff] = useState(0);

  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + off);

  const second = new Date(base);
  second.setMonth(second.getMonth() + 1);

  const bookings = data?.bookings ?? [];
  const blocks = data?.blocks ?? [];

  const info = (iso: string) => {
    const status = nightTaken(iso, bookings, blocks);

    if (status) {
      return {
        disabled: true,
        className:
          "bg-muted text-muted-foreground line-through cursor-not-allowed",
        title:
          lang === "el"
            ? "Μη διαθέσιμο"
            : "Unavailable",
      };
    }

    return {
      disabled: false,
      className: "border bg-card hover:bg-accent",
      title:
        lang === "el"
          ? "Διαθέσιμο"
          : "Available",
    };
  };

  return (
    <>
      <PageTitle
        title={lang === "el" ? "Διαθεσιμότητα" : "Availability"}
        sub={
          lang === "el"
            ? "Δείτε τις διαθέσιμες ημερομηνίες του MM Home."
            : "View MM Home availability."
        }
      />

      <section className="mx-auto max-w-5xl px-5 pb-24">
        <div className="panel p-5 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {lang === "el"
                ? "Οι διαγραμμένες ημερομηνίες δεν είναι διαθέσιμες."
                : "Crossed-out dates are unavailable."}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={off === 0}
                onClick={() => setOff(off - 1)}
                className="p-2 disabled:opacity-30"
                aria-label="Previous month"
              >
                <ChevronLeft />
              </button>

              <button
                type="button"
                onClick={() => setOff(off + 1)}
                className="p-2"
                aria-label="Next month"
              >
                <ChevronRight />
              </button>
            </div>
          </div>

          {!data ? (
            <p className="py-12 text-center text-muted-foreground">
              {lang === "el"
                ? "Φόρτωση διαθεσιμότητας..."
                : "Loading availability..."}
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-10">
              <MonthCalendar
                year={base.getFullYear()}
                month={base.getMonth()}
                locale={t.months}
                info={info}
              />

              <MonthCalendar
                year={second.getFullYear()}
                month={second.getMonth()}
                locale={t.months}
                info={info}
              />
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <h2 className="font-serif text-3xl">
            {lang === "el"
              ? "Οι online κρατήσεις ανοίγουν σύντομα"
              : "Online bookings are opening soon"}
          </h2>

          <p className="mt-3 text-muted-foreground">
            {lang === "el"
              ? "Προς το παρόν το ημερολόγιο εμφανίζει μόνο τη διαθεσιμότητα. Η ολοκλήρωση online κράτησης θα ενεργοποιηθεί σύντομα."
              : "For now, the calendar displays availability only. Online booking will be enabled soon."}
          </p>
        </div>
      </section>
    </>
  );
}
