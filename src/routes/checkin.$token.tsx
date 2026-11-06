import {
  createFileRoute,
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
  KeyRound,
  ShieldCheck,
} from "lucide-react";

import {
  acceptDigitalCheckin,
  getDigitalCheckin,
} from "@/lib/digital-checkin.functions";

import {
  fmtDate,
  useT,
} from "@/lib/i18n";

export const Route =
  createFileRoute(
    "/checkin/$token"
  )({
    head: () => ({
      meta: [
        {
          title:
            "Ψηφιακό check-in — MM Home",
        },
        {
          name:
            "robots",
          content:
            "noindex,nofollow",
        },
      ],
    }),

    component:
      DigitalCheckin,
  });

type PageData = {
  booking: {
    code: string;
    checkIn: string;
    checkOut: string;
    name: string;

    accepted:
      boolean;

    acceptedAt:
      | string
      | null;

    termsVersion:
      | string
      | null;

    accessCode:
      | string
      | null;
  };

  terms: {
    el: {
      title:
        string;

      body:
        string;
    }[];

    en: {
      title:
        string;

      body:
        string;
    }[];

    version:
      string;
  };
};

function DigitalCheckin() {
  const {
    token,
  } =
    Route.useParams();

  const {
    lang,
  } =
    useT();

  const load =
    useServerFn(
      getDigitalCheckin
    );

  const accept =
    useServerFn(
      acceptDigitalCheckin
    );

  const [
    data,
    setData,
  ] =
    useState<
      PageData |
      null
    >(
      null
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    busy,
    setBusy,
  ] =
    useState(
      false
    );

  useEffect(
    () => {
      load({
        data: {
          token,
        },
      })
        .then(
          (
            result
          ) => {
            if (
              "booking" in
                result
            ) {
              setData(
                result as PageData
              );

              return;
            }

            setError(
              lang ===
              "el"
                ? "Ο σύνδεσμος check-in δεν είναι έγκυρος."
                : "This check-in link is not valid."
            );
          }
        )
        .catch(
          () =>
            setError(
              lang ===
              "el"
                ? "Δεν ήταν δυνατή η φόρτωση του check-in."
                : "Check-in could not be loaded."
            )
        );
    },
    [
      lang,
      load,
      token,
    ]
  );

  const doAccept =
    async () => {
      if (
        !data ||
        busy
      ) {
        return;
      }

      setBusy(
        true
      );

      setError(
        ""
      );

      try {
        const result =
          await accept({
            data: {
              token,
            },
          });

        if (
          "accessCode" in
            result &&
          result.accessCode
        ) {
          setData({
            ...data,

            booking: {
              ...data.booking,

              accepted:
                true,

              acceptedAt:
                result.acceptedAt,

              termsVersion:
                result.termsVersion,

              accessCode:
                result.accessCode,
            },
          });

          return;
        }

        setError(
          lang ===
          "el"
            ? "Ο κωδικός εισόδου δεν έχει ακόμη ενεργοποιηθεί. Επικοινωνήστε με το MM Home."
            : "Your access code is not active yet. Please contact MM Home."
        );
      } catch {
        setError(
          lang ===
          "el"
            ? "Δεν ήταν δυνατή η ολοκλήρωση του check-in."
            : "Check-in could not be completed."
        );
      } finally {
        setBusy(
          false
        );
      }
    };

  if (
    !data &&
    !error
  ) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center text-muted-foreground">
        {lang ===
        "el"
          ? "Φόρτωση ψηφιακού check-in..."
          : "Loading digital check-in..."}
      </div>
    );
  }

  if (
    !data
  ) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20">
        <div className="panel p-8 text-center">
          <p className="text-destructive">
            {
              error
            }
          </p>
        </div>
      </div>
    );
  }

  const sections =
    lang ===
    "el"
      ? data.terms.el
      : data.terms.en;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 space-y-6">

      <div className="panel p-6 md:p-8">
        <p className="eyebrow">
          MM Home
        </p>

        <h1 className="font-serif text-4xl mt-2">
          {lang ===
          "el"
            ? "Ψηφιακό check-in"
            : "Digital check-in"}
        </h1>

        <div className="mt-6 text-sm space-y-1 text-muted-foreground">
          <p>
            {
              data.booking.name
            }
          </p>

          <p>
            {fmtDate(
              data.booking.checkIn,
              lang
            )}{" "}
            →{" "}
            {fmtDate(
              data.booking.checkOut,
              lang
            )}
          </p>

          <p>
            {lang ===
            "el"
              ? "Κωδικός κράτησης"
              : "Booking code"}
            :{" "}
            {
              data.booking.code
            }
          </p>
        </div>
      </div>

      {!data.booking.accepted ? (
        <>
          <div className="panel p-6 md:p-8">
            <div className="flex items-center gap-2 mb-5">
              <ShieldCheck
                size={
                  20
                }
              />

              <h2 className="font-serif text-2xl">
                {lang ===
                "el"
                  ? "Όροι Κράτησης & Διαμονής"
                  : "Booking & Stay Terms"}
              </h2>
            </div>

            <div className="space-y-7">
              {sections.map(
                (
                  section
                ) => (
                  <section
                    key={
                      section.title
                    }
                    className="border-t pt-5 first:border-t-0 first:pt-0"
                  >
                    <h3 className="font-serif text-xl">
                      {
                        section.title
                      }
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {
                        section.body
                      }
                    </p>
                  </section>
                )
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {
                error
              }
            </p>
          )}

          <button
            type="button"
            className="btn-gold w-full"
            disabled={
              busy
            }
            onClick={
              doAccept
            }
          >
            <CheckCircle2
              size={
                18
              }
            />

            {busy
              ? lang ===
                "el"
                ? "Ολοκλήρωση..."
                : "Completing..."
              : lang ===
                "el"
              ? "Αποδέχομαι τους όρους & ολοκληρώνω το check-in"
              : "I accept the terms & complete check-in"}
          </button>

          <p className="text-xs text-center text-muted-foreground">
            {lang ===
            "el"
              ? "Με την επιλογή σας καταγράφεται η ημερομηνία και ώρα αποδοχής των παραπάνω όρων."
              : "Your acceptance date and time will be recorded."}
          </p>
        </>
      ) : (
        <div className="panel p-8 md:p-10 text-center">
          <CheckCircle2
            size={
              44
            }
            className="mx-auto text-olive"
          />

          <h2 className="font-serif text-3xl mt-4">
            {lang ===
            "el"
              ? "Το check-in ολοκληρώθηκε"
              : "Check-in completed"}
          </h2>

          <p className="mt-3 text-muted-foreground">
            {lang ===
            "el"
              ? "Ο προσωπικός σας κωδικός εισόδου είναι:"
              : "Your personal door access code is:"}
          </p>

          <div className="mt-6 inline-flex items-center gap-3 rounded-xl border px-7 py-5 bg-secondary">
            <KeyRound
              size={
                26
              }
            />

            <span className="font-serif text-5xl tracking-[0.18em]">
              {
                data.booking.accessCode
              }
            </span>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            {lang ===
            "el"
              ? "Χρησιμοποιήστε τον κωδικό στο πληκτρολόγιο της πόρτας κατά την περίοδο της διαμονής σας."
              : "Use this code on the door keypad during your stay."}
          </p>

          {data.booking.acceptedAt && (
            <p className="mt-4 text-xs text-muted-foreground">
              {lang ===
              "el"
                ? "Αποδοχή όρων:"
                : "Terms accepted:"}{" "}
              {new Date(
                data.booking.acceptedAt
              ).toLocaleString(
                lang ===
                "el"
                  ? "el-GR"
                  : "en-GB"
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
