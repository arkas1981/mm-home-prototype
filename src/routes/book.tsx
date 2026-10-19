import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useState,
} from "react";

import {
  useServerFn,
} from "@tanstack/react-start";

import {
  CalendarDays,
  CheckCircle2,
  Search,
  Users,
  XCircle,
} from "lucide-react";

import {
  useT,
} from "@/lib/i18n";

import {
  meta,
} from "@/lib/meta";

import {
  PageTitle,
} from "@/components/site";

import {
  checkAvailability,
} from "@/lib/availability.functions";

import {
  MAX_GUESTS,
  type RateType,
} from "@/lib/booking";

export const Route =
  createFileRoute(
    "/book"
  )({
    head: () =>
      meta(
        "Κράτηση — MM Home Τρίκαλα",
        "Ελέγξτε διαθεσιμότητα και τιμές για τη διαμονή σας στο MM Home."
      ),
    component: Book,
  });

type Result =
  | null
  | {
      available: false;
      reason:
        | "order"
        | "guests"
        | "lead"
        | "min"
        | "taken";
      minNights?: number;
    }
  | {
      available: true;
      nights: number;
      minNights: number;
      flexibleTotal: number;
      nonRefundableTotal: number;
    };

function Book() {
  const {
    lang,
  } = useT();

  const check =
    useServerFn(
      checkAvailability
    );

  const [checkIn, setCheckIn] =
    useState("");

  const [
    checkOut,
    setCheckOut,
  ] =
    useState("");

  const [
    guests,
    setGuests,
  ] =
    useState(2);

  const [
    result,
    setResult,
  ] =
    useState<Result>(null);

  const [
    checking,
    setChecking,
  ] =
    useState(false);

  const [rate, setRate] =
    useState<RateType>(
      "nonref"
    );

  const isGreek =
    lang === "el";

  const runCheck =
    async () => {
      if (
        !checkIn ||
        !checkOut
      ) {
        return;
      }

      setChecking(true);
      setResult(null);

      try {
        const response =
          await check({
            data: {
              checkIn,
              checkOut,
              guests,
            },
          });

        setResult(
          response as Result
        );
      } finally {
        setChecking(false);
      }
    };

  const reasonText = () => {
    if (
      !result ||
      result.available
    ) {
      return "";
    }

    if (
      result.reason ===
      "taken"
    ) {
      return isGreek
        ? "Οι συγκεκριμένες ημερομηνίες δεν είναι διαθέσιμες."
        : "These dates are not available.";
    }

    if (
      result.reason ===
      "lead"
    ) {
      return isGreek
        ? "Η κράτηση πρέπει να γίνεται τουλάχιστον 2 ημερολογιακές ημέρες πριν την άφιξη."
        : "Bookings must be made at least 2 calendar days before arrival.";
    }

    if (
      result.reason ===
      "min"
    ) {
      return isGreek
        ? `Η ελάχιστη διαμονή για αυτές τις ημερομηνίες είναι ${result.minNights ?? 2} νύχτες.`
        : `The minimum stay for these dates is ${result.minNights ?? 2} nights.`;
    }

    if (
      result.reason ===
      "guests"
    ) {
      return isGreek
        ? "Επιλέξτε από 1 έως 6 επισκέπτες."
        : "Please select between 1 and 6 guests.";
    }

    return isGreek
      ? "Ελέγξτε τις ημερομηνίες άφιξης και αναχώρησης."
      : "Please check your arrival and departure dates.";
  };

  return (
    <>
      <PageTitle
        title={
          isGreek
            ? "Κράτηση"
            : "Booking"
        }
        sub={
          isGreek
            ? "Ελέγξτε πρώτα αν οι ημερομηνίες που σας ενδιαφέρουν είναι διαθέσιμες."
            : "First check whether your preferred dates are available."
        }
      />

      <section className="mx-auto max-w-4xl px-5 pb-24">
        <div className="panel p-6 md:p-8">
          <div className="grid md:grid-cols-3 gap-4">
            <label className="text-sm">
              <span className="flex items-center gap-2 mb-2">
                <CalendarDays
                  size={17}
                />

                {isGreek
                  ? "Άφιξη"
                  : "Check-in"}
              </span>

              <input
                type="date"
                className="field"
                value={
                  checkIn
                }
                onChange={(e) => {
                  setCheckIn(
                    e.target.value
                  );
                  setResult(
                    null
                  );
                }}
              />
            </label>

            <label className="text-sm">
              <span className="flex items-center gap-2 mb-2">
                <CalendarDays
                  size={17}
                />

                {isGreek
                  ? "Αναχώρηση"
                  : "Check-out"}
              </span>

              <input
                type="date"
                className="field"
                value={
                  checkOut
                }
                onChange={(e) => {
                  setCheckOut(
                    e.target.value
                  );
                  setResult(
                    null
                  );
                }}
              />
            </label>

            <label className="text-sm">
              <span className="flex items-center gap-2 mb-2">
                <Users
                  size={17}
                />

                {isGreek
                  ? "Επισκέπτες"
                  : "Guests"}
              </span>

              <select
                className="field"
                value={
                  guests
                }
                onChange={(e) => {
                  setGuests(
                    Number(
                      e.target
                        .value
                    )
                  );

                  setResult(
                    null
                  );
                }}
              >
                {Array.from(
                  {
                    length:
                      MAX_GUESTS,
                  },
                  (_, i) =>
                    i + 1
                ).map(
                  (n) => (
                    <option
                      key={n}
                      value={n}
                    >
                      {n}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <button
            type="button"
            className="btn-gold w-full mt-6"
            disabled={
              checking ||
              !checkIn ||
              !checkOut
            }
            onClick={
              runCheck
            }
          >
            <Search
              size={17}
            />

            {checking
              ? isGreek
                ? "Έλεγχος..."
                : "Checking..."
              : isGreek
              ? "Έλεγχος διαθεσιμότητας"
              : "Check availability"}
          </button>

          <p className="mt-4 text-xs text-muted-foreground text-center">
            {isGreek
              ? "Η πλήρης διαθεσιμότητα του καταλύματος δεν εμφανίζεται δημόσια."
              : "The property's full availability calendar is not displayed publicly."}
          </p>
        </div>

        {result &&
          !result.available && (
            <div className="panel p-6 mt-6 border-destructive/30">
              <div className="flex gap-3">
                <XCircle className="text-destructive shrink-0" />

                <div>
                  <h2 className="font-serif text-2xl">
                    {isGreek
                      ? "Μη διαθέσιμο"
                      : "Not available"}
                  </h2>

                  <p className="mt-2 text-muted-foreground">
                    {reasonText()}
                  </p>

                  <p className="mt-3 text-sm">
                    {isGreek
                      ? "Δοκιμάστε διαφορετικές ημερομηνίες."
                      : "Please try different dates."}
                  </p>
                </div>
              </div>
            </div>
          )}

        {result &&
          result.available && (
            <div className="mt-6 space-y-6">
              <div className="panel p-6 border-primary/30">
                <div className="flex gap-3 items-start">
                  <CheckCircle2 className="text-primary shrink-0" />

                  <div>
                    <h2 className="font-serif text-3xl">
                      {isGreek
                        ? "Διαθέσιμο"
                        : "Available"}
                    </h2>

                    <p className="mt-2 text-muted-foreground">
                      {isGreek
                        ? `${result.nights} νύχτες · ${guests} επισκέπτες`
                        : `${result.nights} nights · ${guests} guests`}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="eyebrow mb-3">
                  {isGreek
                    ? "Επιλέξτε τιμή"
                    : "Choose rate"}
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setRate(
                        "nonref"
                      )
                    }
                    className={`panel p-6 text-left transition ${
                      rate ===
                      "nonref"
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                  >
                    <p className="font-serif text-2xl">
                      {isGreek
                        ? "Μη επιστρέψιμη"
                        : "Non-refundable"}
                    </p>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {isGreek
                        ? "10% χαμηλότερη τιμή · χωρίς επιστροφή σε ακύρωση."
                        : "10% lower rate · no refund on cancellation."}
                    </p>

                    <p className="mt-5 font-serif text-4xl">
                      €
                      {
                        result.nonRefundableTotal
                      }
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {isGreek
                        ? "τελικό σύνολο διαμονής"
                        : "total stay price"}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setRate(
                        "flexible"
                      )
                    }
                    className={`panel p-6 text-left transition ${
                      rate ===
                      "flexible"
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                  >
                    <p className="font-serif text-2xl">
                      {isGreek
                        ? "Ευέλικτη"
                        : "Flexible"}
                    </p>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {isGreek
                        ? "100% επιστροφή έως 21 ημέρες πριν · 50% αργότερα."
                        : "100% refund up to 21 days before arrival · 50% after."}
                    </p>

                    <p className="mt-5 font-serif text-4xl">
                      €
                      {
                        result.flexibleTotal
                      }
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {isGreek
                        ? "τελικό σύνολο διαμονής"
                        : "total stay price"}
                    </p>
                  </button>
                </div>
              </div>

              <div className="panel p-6 text-center">
                <p className="font-serif text-2xl">
                  {isGreek
                    ? "Οι online πληρωμές ενεργοποιούνται σύντομα"
                    : "Online payments are coming soon"}
                </p>

                <p className="mt-3 text-muted-foreground">
                  {isGreek
                    ? "Η διαθεσιμότητα και η τιμή έχουν ελεγχθεί. Το επόμενο βήμα θα είναι η ασφαλής ολοκλήρωση της κράτησης."
                    : "Availability and pricing have been checked. Secure booking completion will be enabled next."}
                </p>
              </div>
            </div>
          )}
      </section>
    </>
  );
}
