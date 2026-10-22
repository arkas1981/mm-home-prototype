import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useEffect,
  useState,
} from "react";

import {
  Star,
} from "lucide-react";

import {
  PageTitle,
} from "@/components/site";

import {
  meta,
} from "@/lib/meta";

import {
  getReviewBooking,
  submitReview,
} from "@/lib/review.functions";

export const Route =
  createFileRoute(
    "/review/$code"
  )({
    head: () => ({
      ...meta(
        "Αξιολόγηση διαμονής — MM Home",
        "Μοιραστείτε την εμπειρία της διαμονής σας στο MM Home."
      ),
    }),

    component:
      WriteReview,
  });

function WriteReview() {
  const {
    code,
  } =
    Route.useParams();

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    valid,
    setValid,
  ] =
    useState(
      false
    );

  const [
    already,
    setAlready,
  ] =
    useState(
      false
    );

  const [
    name,
    setName,
  ] =
    useState(
      ""
    );

  const [
    text,
    setText,
  ] =
    useState(
      ""
    );

  const [
    rating,
    setRating,
  ] =
    useState(
      5
    );

  const [
    done,
    setDone,
  ] =
    useState(
      false
    );

  const [
    sending,
    setSending,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  useEffect(
    () => {
      let active =
        true;

      const load =
        async () => {
          try {
            const result =
              await getReviewBooking({
                data: {
                  code,
                },
              });

            if (
              !active
            ) {
              return;
            }

            if (
              !result.booking
            ) {
              setValid(
                false
              );

              setLoading(
                false
              );

              return;
            }

            setValid(
              true
            );

            setAlready(
              result.alreadyReviewed
            );

            setName(
              result.booking
                .name ??
                ""
            );
          } catch {
            if (
              active
            ) {
              setValid(
                false
              );
            }
          } finally {
            if (
              active
            ) {
              setLoading(
                false
              );
            }
          }
        };

      void load();

      return () => {
        active =
          false;
      };
    },
    [
      code,
    ]
  );

  const submit =
    async () => {
      if (
        sending ||
        !name.trim() ||
        !text.trim()
      ) {
        return;
      }

      setSending(
        true
      );

      setError(
        ""
      );

      try {
        const result =
          await submitReview({
            data: {
              code,
              name,
              rating,
              text,
            },
          });

        if (
          "error" in
          result
        ) {
          if (
            result.error ===
            "already"
          ) {
            setAlready(
              true
            );

            return;
          }

          setError(
            "Δεν ήταν δυνατή η αποθήκευση της αξιολόγησης."
          );

          return;
        }

        setDone(
          true
        );
      } catch {
        setError(
          "Παρουσιάστηκε πρόβλημα. Παρακαλώ δοκιμάστε ξανά."
        );
      } finally {
        setSending(
          false
        );
      }
    };

  return (
    <>
      <PageTitle
        title="Η γνώμη σας έχει αξία"
      />

      <div
        className="
          mx-auto
          max-w-xl
          px-5
        "
      >
        {loading ? (
          <div
            className="
              panel
              p-8
              text-center
            "
          >
            Φόρτωση...
          </div>
        ) : !valid ? (
          <div
            className="
              panel
              p-8
              text-center
            "
          >
            <div
              className="
                font-serif
                text-2xl
                mb-3
              "
            >
              Η αξιολόγηση δεν είναι διαθέσιμη
            </div>

            <p
              className="
                text-muted-foreground
              "
            >
              Ο σύνδεσμος δεν αντιστοιχεί σε ολοκληρωμένη διαμονή.
            </p>
          </div>
        ) : done ||
          already ? (
          <div
            className="
              panel
              p-8
              text-center
            "
          >
            <div
              className="
                font-serif
                text-3xl
                mb-4
              "
            >
              Ευχαριστούμε!
            </div>

            <p
              className="
                text-muted-foreground
                leading-relaxed
              "
            >
              Η αξιολόγησή σας καταχωρήθηκε και σας ευχαριστούμε που αφιερώσατε χρόνο για να μοιραστείτε την εμπειρία σας.
            </p>
          </div>
        ) : (
          <div
            className="
              panel
              p-8
              space-y-6
            "
          >
            <div>
              <div
                className="
                  font-serif
                  text-2xl
                  mb-2
                "
              >
                Πώς ήταν η διαμονή σας;
              </div>

              <p
                className="
                  text-muted-foreground
                  leading-relaxed
                "
              >
                Η γνώμη σας μας βοηθά να βελτιώνουμε συνεχώς την εμπειρία των επισκεπτών του MM Home.
              </p>
            </div>

            <div>
              <div
                className="
                  text-sm
                  font-medium
                  mb-2
                "
              >
                Αξιολόγηση
              </div>

              <div
                className="
                  flex
                  gap-2
                  text-primary
                "
              >
                {[
                  1,
                  2,
                  3,
                  4,
                  5,
                ].map(
                  (
                    n
                  ) => (
                    <button
                      key={
                        n
                      }
                      type="button"
                      onClick={() =>
                        setRating(
                          n
                        )
                      }
                      aria-label={`${n} αστέρια`}
                    >
                      <Star
                        size={
                          32
                        }
                        fill={
                          n <=
                          rating
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label
                className="
                  block
                  text-sm
                  font-medium
                  mb-2
                "
              >
                Όνομα
              </label>

              <input
                className="field"
                value={
                  name
                }
                onChange={(
                  e
                ) =>
                  setName(
                    e
                      .target
                      .value
                  )
                }
                maxLength={
                  60
                }
              />
            </div>

            <div>
              <label
                className="
                  block
                  text-sm
                  font-medium
                  mb-2
                "
              >
                Η εμπειρία σας
              </label>

              <textarea
                className="
                  field
                  min-h-36
                "
                placeholder="Γράψτε λίγα λόγια για τη διαμονή σας..."
                value={
                  text
                }
                onChange={(
                  e
                ) =>
                  setText(
                    e
                      .target
                      .value
                  )
                }
                maxLength={
                  1000
                }
              />
            </div>

            {error && (
              <p
                className="
                  text-sm
                  text-red-600
                "
              >
                {error}
              </p>
            )}

            <button
              type="button"
              className="
                btn-gold
                w-full
              "
              disabled={
                sending
              }
              onClick={
                submit
              }
            >
              {sending
                ? "Αποστολή..."
                : "Υποβολή αξιολόγησης"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
