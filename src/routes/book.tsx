import {
  createFileRoute,
  Link,
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
  CreditCard,
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
  createBookingCheckout,
} from "@/lib/booking-payment.functions";

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
        "Ελέγξτε διαθεσιμότητα και ολοκληρώστε την κράτησή σας στο MM Home."
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

  const isGreek =
    lang === "el";

  const check =
    useServerFn(
      checkAvailability
    );

  const checkout =
    useServerFn(
      createBookingCheckout
    );

  const [
    checkIn,
    setCheckIn,
  ] =
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
    useState<Result>(
      null
    );

  const [
    checking,
    setChecking,
  ] =
    useState(false);

  const [
    paying,
    setPaying,
  ] =
    useState(false);

  const [
    rate,
    setRate,
  ] =
    useState<RateType>(
      "nonref"
    );

  const [
    form,
    setForm,
  ] =
    useState({
      name: "",
      email: "",
      phone: "",
      adult: false,
      terms: false,
      nonrefAck: false,
    });

  const [
    error,
    setError,
  ] =
    useState("");

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
      setError("");

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

  const selectedTotal =
    result &&
    result.available
      ? rate ===
        "flexible"
        ? result.flexibleTotal
        : result.nonRefundableTotal
      : 0;

  const detailsValid =
    form.name
      .trim()
      .length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      form.email.trim()
    ) &&
    form.phone.replace(
      /\D/g,
      ""
    ).length >= 8 &&
    form.adult &&
    form.terms &&
    (
      rate ===
        "flexible" ||
      form.nonrefAck
    );

  const pay =
    async () => {
      if (
        !result ||
        !result.available ||
        !detailsValid ||
        paying
      ) {
        setError(
          isGreek
            ? "Συμπληρώστε σωστά όλα τα στοιχεία και αποδεχτείτε τους όρους."
            : "Please complete all details and accept the terms."
        );

        return;
      }

      setPaying(true);
      setError("");

      try {
        const response =
          await checkout({
            data: {
              checkIn,
              checkOut,
              guests,
              name:
                form.name,
              email:
                form.email,
              phone:
                form.phone,
              rate,
              adult:
                form.adult,
              terms:
                form.terms,
              nonrefAck:
                form.nonrefAck,
              expectedTotal:
                selectedTotal,
            },
          });

        if (
          "url" in
            response &&
          response.url
        ) {
          window.location.href =
            response.url;

          return;
        }

        if (
          "error" in
            response
        ) {
          if (
            response.error ===
            "taken"
          ) {
            setError(
              isGreek
                ? "Οι ημερομηνίες μόλις έγιναν μη διαθέσιμες. Επιλέξτε άλλες ημερομηνίες."
                : "These dates have just become unavailable. Please choose different dates."
            );
          } else if (
            response.error ===
            "price_changed"
          ) {
            setError(
              isGreek
                ? "Η τιμή άλλαξε. Κάντε ξανά έλεγχο διαθεσιμότητας."
                : "The price has changed. Please check availability again."
            );
          } else if (
            response.error ===
            "min"
          ) {
            setError(
              isGreek
                ? `Η ελάχιστη διαμονή είναι ${response.minNights ?? 2} νύχτες.`
                : `Minimum stay is ${response.minNights ?? 2} nights.`
            );
          } else {
            setError(
              isGreek
                ? "Δεν ήταν δυνατή η έναρξη της πληρωμής."
                : "Payment could not be started."
            );
          }
        }
      } catch {
        setError(
          isGreek
            ? "Η Stripe δεν είναι διαθέσιμη αυτή τη στιγμή."
            : "Stripe is unavailable right now."
        );
      }

      setPaying(false);
    };

  const resetResult =
    () => {
      setResult(null);
      setError("");
    };

  const reasonText =
    () => {
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
          ? `Η ελάχιστη διαμονή είναι ${result.minNights ?? 2} νύχτες.`
          : `Minimum stay is ${result.minNights ?? 2} nights.`;
      }

      return isGreek
        ? "Ελέγξτε τις ημερομηνίες και τον αριθμό επισκεπτών."
        : "Please check the dates and guest count.";
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
            ? "Ελέγξτε τις ημερομηνίες σας και ολοκληρώστε με ασφαλή πληρωμή."
            : "Check your dates and complete your booking securely."
        }
      />

      <section className="mx-auto max-w-4xl px-5 pb-24 space-y-6">
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

                  resetResult();
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

                  resetResult();
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

                  resetResult();
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
        </div>

        {result &&
          !result.available && (
            <div className="panel p-6">
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
                </div>
              </div>
            </div>
          )}

        {result &&
          result.available && (
            <>
              <div className="panel p-6">
                <div className="flex gap-3">
                  <CheckCircle2 className="text-primary shrink-0" />

                  <div>
                    <h2 className="font-serif text-3xl">
                      {isGreek
                        ? "Διαθέσιμο"
                        : "Available"}
                    </h2>

                    <p className="mt-2 text-muted-foreground">
                      {result.nights}{" "}
                      {isGreek
                        ? "νύχτες"
                        : "nights"}{" "}
                      · {guests}{" "}
                      {isGreek
                        ? "επισκέπτες"
                        : "guests"}
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
                    className={`panel p-6 text-left ${
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
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setRate(
                        "flexible"
                      )
                    }
                    className={`panel p-6 text-left ${
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
                  </button>
                </div>
              </div>

              <div className="panel p-6 md:p-8 space-y-4">
                <h2 className="font-serif text-3xl">
                  {isGreek
                    ? "Στοιχεία επισκέπτη"
                    : "Guest details"}
                </h2>

                <input
                  className="field"
                  placeholder={
                    isGreek
                      ? "Ονοματεπώνυμο"
                      : "Full name"
                  }
                  value={
                    form.name
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name:
                        e.target
                          .value,
                    })
                  }
                />

                <input
                  className="field"
                  type="email"
                  placeholder="Email"
                  value={
                    form.email
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email:
                        e.target
                          .value,
                    })
                  }
                />

                <input
                  className="field"
                  type="tel"
                  placeholder={
                    isGreek
                      ? "Κινητό"
                      : "Mobile"
                  }
                  value={
                    form.phone
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone:
                        e.target
                          .value,
                    })
                  }
                />

                <label className="flex gap-3 items-start text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 accent-primary"
                    checked={
                      form.adult
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        adult:
                          e.target
                            .checked,
                      })
                    }
                  />

                  {isGreek
                    ? "Ο κύριος επισκέπτης είναι 18 ετών και άνω."
                    : "The main guest is 18 years or older."}
                </label>

                <label className="flex gap-3 items-start text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 accent-primary"
                    checked={
                      form.terms
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        terms:
                          e.target
                            .checked,
                      })
                    }
                  />

                  <span>
                    {isGreek
                      ? "Έχω διαβάσει και αποδέχομαι τους "
                      : "I have read and accept the "}

                    <Link
                      to="/terms"
                      target="_blank"
                      className="underline text-primary"
                    >
                      {isGreek
                        ? "Όρους Κράτησης & Διαμονής"
                        : "Booking & Stay Terms"}
                    </Link>
                    .
                  </span>
                </label>

                {rate ===
                  "nonref" && (
                  <label className="flex gap-3 items-start text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 accent-primary"
                      checked={
                        form.nonrefAck
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          nonrefAck:
                            e.target
                              .checked,
                        })
                      }
                    />

                    {isGreek
                      ? "Αναγνωρίζω ότι επέλεξα τη μη επιστρέψιμη τιμή και δεν δικαιούμαι επιστροφή σε περίπτωση ακύρωσης."
                      : "I acknowledge that I selected the non-refundable rate and will receive no refund if I cancel."}
                  </label>
                )}

                <p className="text-xs text-muted-foreground">
                  {isGreek
                    ? "Κατά το προσωπικό check-in θα ζητηθεί ταυτότητα ή διαβατήριο."
                    : "An ID card or passport will be requested at personal check-in."}
                </p>
              </div>

              <div className="panel p-6 md:p-8">
                <div className="flex justify-between items-end gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isGreek
                        ? "Τελικό σύνολο"
                        : "Final total"}
                    </p>

                    <p className="font-serif text-4xl">
                      €
                      {
                        selectedTotal
                      }
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground text-right">
                    {isGreek
                      ? "Καθαρισμός περιλαμβάνεται · χωρίς κρυφές χρεώσεις"
                      : "Cleaning included · no hidden fees"}
                  </p>
                </div>

                {error && (
                  <p className="mt-4 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  className="btn-gold w-full mt-6"
                  disabled={
                    paying
                  }
                  onClick={
                    pay
                  }
                >
                  <CreditCard
                    size={17}
                  />

                  {paying
                    ? isGreek
                      ? "Μετάβαση στη Stripe..."
                      : "Opening Stripe..."
                    : isGreek
                    ? `Πληρωμή €${selectedTotal}`
                    : `Pay €${selectedTotal}`}
                </button>

                <p className="mt-3 text-xs text-center text-muted-foreground">
                  {isGreek
                    ? "Δοκιμαστική λειτουργία Stripe — δεν πραγματοποιείται πραγματική χρέωση."
                    : "Stripe test mode — no real charge will be made."}
                </p>
              </div>
            </>
          )}
      </section>
    </>
  );
}
