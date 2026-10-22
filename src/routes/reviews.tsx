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
          max-w-4xl
          px-5
          space-y-6
        "
      >
        {loading && (
          <p
            className="
              text-muted-foreground
            "
          >
            Φόρτωση αξιολογήσεων…
          </p>
        )}

        {!loading &&
          error && (
            <p
              className="
                text-muted-foreground
              "
            >
              Δεν ήταν δυνατή η φόρτωση των αξιολογήσεων.
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
                p-8
              "
            >
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
                        16
                      }
                      fill="currentColor"
                    />
                  )
                )}
              </div>

              <p
                className="
                  mt-4
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

              <p
                className="
                  mt-4
                  text-sm
                  text-muted-foreground
                "
              >
                {
                  review.name
                }{" "}
                ·{" "}
                {
                  t.rev
                    .verified
                }{" "}
                ·{" "}
                {fmtDate(
                  review.created_at.slice(
                    0,
                    10
                  ),
                  lang
                )}
              </p>
            </article>
          )
        )}
      </div>
    </>
  );
}
