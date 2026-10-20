import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  useEffect,
  useState,
} from "react";

import {
  useServerFn,
} from "@tanstack/react-start";

import {
  CheckCircle2,
} from "lucide-react";

import {
  fmtDate,
  useT,
} from "@/lib/i18n";

import {
  confirmBookingCheckout,
} from "@/lib/booking-payment.functions";

export const Route =
  createFileRoute(
    "/book-success"
  )({
    head: () => ({
      meta: [
        {
          title:
            "Επιβεβαίωση κράτησης — MM Home",
        },
        {
          name:
            "robots",
          content:
            "noindex",
        },
      ],
    }),
    component:
      Success,
  });

type Done = {
  code: string;
  check_in: string;
  check_out: string;
  guests: number;
  rate: string;
  total: number;
  name: string;
};

function Success() {
  const {
    lang,
  } = useT();

  const confirm =
    useServerFn(
      confirmBookingCheckout
    );

  const [
    state,
    setState,
  ] =
    useState<
      | "loading"
      | "error"
      | Done
    >(
      "loading"
    );

  useEffect(() => {
    const sessionId =
      new URLSearchParams(
        window.location.search
      ).get(
        "session_id"
      ) ?? "";

    confirm({
      data: {
        sessionId,
      },
    })
      .then(
        (response) => {
          if (
            "booking" in
              response &&
            response.booking
          ) {
            setState(
              response.booking
            );
          } else {
            setState(
              "error"
            );
          }
        }
      )
      .catch(() =>
        setState("error")
      );
  }, [confirm]);

  if (
    state === "loading"
  ) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <p className="text-muted-foreground">
          {lang === "el"
            ? "Επιβεβαίωση πληρωμής και κράτησης..."
            : "Confirming payment and booking..."}
        </p>
      </div>
    );
  }

  if (
    state === "error"
  ) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <div className="panel p-10 text-center">
          <h1 className="font-serif text-4xl">
            {lang === "el"
              ? "Η πληρωμή δεν επιβεβαιώθηκε"
              : "Payment not confirmed"}
          </h1>

          <p className="mt-4 text-muted-foreground">
            {lang === "el"
              ? "Δεν επιβεβαιώθηκε κράτηση. Επιστρέψτε στη σελίδα κράτησης ή επικοινωνήστε μαζί μας."
              : "No booking was confirmed. Return to the booking page or contact us."}
          </p>

          <Link
            to="/book"
            className="btn-gold mt-8"
          >
            {lang === "el"
              ? "Επιστροφή στην κράτηση"
              : "Back to booking"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-20">
      <div className="panel p-8 md:p-12 text-center">
        <CheckCircle2
          className="mx-auto text-primary"
          size={48}
        />

        <p className="eyebrow mt-5">
          MM Home
        </p>

        <h1 className="font-serif text-4xl mt-2">
          {lang === "el"
            ? "Η κράτησή σας επιβεβαιώθηκε"
            : "Your booking is confirmed"}
        </h1>

        <p className="mt-8 text-sm text-muted-foreground">
          {lang === "el"
            ? "Κωδικός κράτησης"
            : "Booking code"}
        </p>

        <p className="font-serif text-4xl tracking-widest text-primary mt-1">
          {state.code}
        </p>

        <div className="mt-8 space-y-2">
          <p>
            {fmtDate(
              state.check_in,
              lang
            )}{" "}
            →{" "}
            {fmtDate(
              state.check_out,
              lang
            )}
          </p>

          <p>
            {state.guests}{" "}
            {lang === "el"
              ? "επισκέπτες"
              : "guests"}{" "}
            · €
            {state.total}
          </p>

          <p className="text-sm text-muted-foreground">
            {state.rate ===
            "flexible"
              ? lang ===
                "el"
                ? "Ευέλικτη τιμή"
                : "Flexible rate"
              : lang ===
                "el"
              ? "Μη επιστρέψιμη τιμή"
              : "Non-refundable rate"}
          </p>
        </div>

        <p className="mt-8 text-muted-foreground">
          {lang === "el"
            ? "Προσωπικό check-in από τις 15:00. Κατά την άφιξη θα ζητηθεί ταυτότητα ή διαβατήριο."
            : "Personal check-in from 15:00. An ID card or passport will be requested on arrival."}
        </p>

        <Link
          to="/"
          className="btn-line mt-8"
        >
          {lang === "el"
            ? "Αρχική"
            : "Home"}
        </Link>
      </div>
    </div>
  );
}
