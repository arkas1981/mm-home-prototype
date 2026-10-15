import { createFileRoute } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { meta } from "@/lib/meta";
import { PageTitle } from "@/components/site";
import { SLOGAN } from "@/lib/i18n";

export const Route = createFileRoute("/book")({
  head: () =>
    meta(
      "Κράτηση — MM Home Τρίκαλα",
      "Οι online κρατήσεις του MM Home ανοίγουν σύντομα."
    ),
  component: BookComingSoon,
});

function BookComingSoon() {
  const { lang } = useT();

  const isGreek = lang === "el";

  return (
    <>
      <PageTitle
        title={isGreek ? "Κράτηση" : "Booking"}
        sub={
          isGreek
            ? "Οι online κρατήσεις ανοίγουν σύντομα."
            : "Online bookings are opening soon."
        }
      />

      <section className="mx-auto max-w-2xl px-5 pb-24">
        <div className="panel p-8 md:p-12 text-center">
          <p className="eyebrow">
            {isGreek ? "MM Home · Τρίκαλα" : "MM Home · Trikala"}
          </p>

          <h2 className="mt-3 font-serif text-3xl md:text-4xl">
            {isGreek
              ? "Οι online κρατήσεις ανοίγουν σύντομα"
              : "Online bookings are opening soon"}
          </h2>

          <p className="mt-5 text-muted-foreground leading-relaxed">
            {isGreek
              ? "Ετοιμάζουμε το νέο σύστημα online κρατήσεων του MM Home. Πολύ σύντομα θα μπορείτε να ελέγχετε διαθεσιμότητα, να επιλέγετε τις ημερομηνίες σας και να ολοκληρώνετε την κράτησή σας απευθείας από εδώ."
              : "We’re preparing the new MM Home online booking system. Soon you’ll be able to check availability, choose your dates and complete your booking directly here."}
          </p>

          <p className="mt-8 font-serif italic text-xl">
            {SLOGAN}
          </p>
        </div>
      </section>
    </>
  );
}
