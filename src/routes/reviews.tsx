import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  Star,
} from "lucide-react";

import {
  PageTitle,
} from "@/components/site";

import {
  fmtDate,
  useT,
} from "@/lib/i18n";

import {
  meta,
} from "@/lib/meta";

import {
  getApprovedReviews,
  type PublicReview,
} from "@/lib/review.functions";

export const Route =
  createFileRoute(
    "/reviews"
  )({
    head: () =>
      meta(
        "Αξιολογήσεις — MM Home Τρίκαλα",
        "Αξιολογήσεις αποκλειστικά από επιβεβαιωμένες διαμονές στο MM Home."
      ),

    component:
      Reviews,
  });

function stayMonth(
  iso: string,
  lang: string
) {
  if (
    !iso
  ) {
    return "";
  }

  const date =
    new Date(
      `${iso}T12:00:00`
    );

  return new Intl.DateTimeFormat(
    lang === "el"
      ? "el-GR"
      : "en-GB",
    {
      month:
        "long",
      year:
        "numeric",
    }
  ).format(
    date
  );
}

function Reviews() {
  const {
    t,
    lang,
  } =
    useT();

  const [
    reviews,
    setReviews,
  ] =
    useState<
      PublicReview[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    error,
    setError,
  ] =
    useState(
      false
    );

  useEffect(
    () => {
      let active =
        true;

      const load =
        async () => {
          try {
            const result =
              await getApprovedReviews();

            if (
              !active
            ) {
              return;
            }

            setReviews(
              result.reviews
            );
          } catch {
            if (
              active
            ) {
              setError(
                true
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
    []
  );

  return (
    <>
      <PageTitle
        title={
          t.rev.title
        }
        sub={
          t.rev.sub
        }
      />

      <div
        className="
          mx-auto
          max-w-5xl
          px-5
          space-y-6
        "
      >
        <div
          className="
            panel
            p-5
            text-sm
            text-muted-foreground
            leading-relaxed
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <CheckCircle2
              size={
                20
              }
              className="
                text-olive
                shrink-0
                mt-0.5
              "
            />

            <div>
              <div
                className="
                  font-medium
                  text-foreground
                  mb-1
                "
              >
                {lang ===
                "el"
                  ? "Αξιολογήσεις από επιβεβαιωμένες διαμονές"
                  : "Reviews from verified stays"}
              </div>

              <p>
                {lang ===
                "el"
                  ? "Κάθε αξιολόγηση μπορεί να υποβληθεί μόνο μετά την ολοκλήρωση επιβεβαιωμένης και εξοφλημένης κράτησης, μέσω του μοναδικού συνδέσμου της συγκεκριμένης κράτησης."
                  : "Each review can only be submitted after a confirmed and paid stay has been completed, using the unique link associated with that booking."}
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <p
            className="
              text-muted-foreground
            "
          >
            {lang ===
            "el"
              ? "Φόρτωση αξιολογήσεων…"
              : "Loading reviews…"}
          </p>
        )}

        {!loading &&
          error && (
            <p
              className="
                text-muted-foreground
              "
            >
              {lang ===
              "el"
                ? "Δεν ήταν δυνατή η φόρτωση των αξιολογήσεων."
                : "Reviews could not be loaded."}
            </p>
          )}

        {!loading &&
          !error &&
          reviews.length ===
            0 && (
            <p
              className="
                text-muted-foreground
              "
            >
              {t.rev.none}
            </p>
          )}

        {reviews.map(
          (
            review
          ) => (
            <article
              key={
                review.id
              }
              className="
                panel
                p-6
                sm:p-8
              "
            >
              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                  sm:items-start
                  sm:justify-between
                  gap-4
                "
              >
                <div>
                  <div
                    className="
                      flex
                      gap-0.5
                      text-primary
                    "
                  >
                    {Array.from(
                      {
                        length:
                          review.rating,
                      }
                    ).map(
                      (
                        _,
                        index
                      ) => (
                        <Star
                          key={
                            index
                          }
                          size={
                            18
                          }
                          fill="currentColor"
                        />
                      )
                    )}

                    {Array.from(
                      {
                        length:
                          5 -
                          review.rating,
                      }
                    ).map(
                      (
                        _,
                        index
                      ) => (
                        <Star
                          key={`empty-${index}`}
                          size={
                            18
                          }
                        />
                      )
                    )}
                  </div>

                  <div
                    className="
                      mt-3
                      flex
                      flex-wrap
                      items-center
                      gap-x-2
                      gap-y-1
                    "
                  >
                    <span
                      className="
                        font-medium
                      "
                    >
                      {
                        review.name
                      }
                    </span>

                    <span
                      className="
                        inline-flex
                        items-center
                        gap-1
                        text-xs
                        font-medium
                        text-olive
                      "
                    >
                      <CheckCircle2
                        size={
                          15
                        }
                      />

                      {lang ===
                      "el"
                        ? "Επιβεβαιωμένη διαμονή"
                        : "Verified stay"}
                    </span>
                  </div>
                </div>

                <div
                  className="
                    text-xs
                    text-muted-foreground
                    sm:text-right
                    leading-relaxed
                  "
                >
                  {review.stay_date && (
                    <div>
                      {lang ===
                      "el"
                        ? "Διαμονή"
                        : "Stay"}
                      :{" "}
                      {stayMonth(
                        review.stay_date,
                        lang
                      )}
                    </div>
                  )}

                  <div>
                    {lang ===
                    "el"
                      ? "Αξιολόγηση"
                      : "Review"}
                    :{" "}
                    {fmtDate(
                      review.created_at.slice(
                        0,
                        10
                      ),
                      lang
                    )}
                  </div>
                </div>
              </div>

              <p
                className="
                  mt-5
                  font-serif
                  text-2xl
                  leading-snug
                "
              >
                “
                {
                  review.text
                }
                ”
              </p>

              {review.photos.length >
                0 && (
                <div
                  className={`
                    mt-6
                    grid
                    gap-3
                    ${
                      review.photos
                        .length ===
                      1
                        ? "grid-cols-1"
                        : review.photos
                              .length ===
                            2
                          ? "grid-cols-2"
                          : "grid-cols-2 sm:grid-cols-3"
                    }
                  `}
                >
                  {review.photos.map(
                    (
                      photo,
                      index
                    ) => (
                      <a
                        key={
                          photo.id
                        }
                        href={
                          photo.url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="
                          block
                          overflow-hidden
                          rounded-xl
                          border
                          bg-secondary/20
                        "
                      >
                        <img
                          src={
                            photo.url
                          }
                          alt={
                            lang ===
                            "el"
                              ? `Φωτογραφία επισκέπτη από το MM Home ${index + 1}`
                              : `Guest photo from MM Home ${index + 1}`
                          }
                          loading="lazy"
                          className="
                            w-full
                            aspect-square
                            object-cover
                            transition-transform
                            duration-300
                            hover:scale-[1.02]
                          "
                        />
                      </a>
                    )
                  )}
                </div>
              )}
            </article>
          )
        )}
      </div>
    </>
  );
}
