import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useServerFn,
} from "@tanstack/react-start";

import {
  adminDeleteReviewD1,
  adminReviewsD1,
  adminSetReviewStatusD1,
  type AdminReviewRow,
} from "@/lib/admin-reviews.functions";

function formatDate(
  iso: string
) {
  return new Date(
    iso
  ).toLocaleString(
    "el-GR",
    {
      day:
        "numeric",
      month:
        "short",
      year:
        "numeric",
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  );
}

function statusLabel(
  status: string
) {
  if (
    status ===
    "approved"
  ) {
    return "Εγκεκριμένες";
  }

  if (
    status ===
    "rejected"
  ) {
    return "Απορριφθείσες";
  }

  return "Σε αναμονή";
}

export function AdminReviews() {
  const getReviews =
    useServerFn(
      adminReviewsD1
    );

  const setStatus =
    useServerFn(
      adminSetReviewStatusD1
    );

  const deleteReview =
    useServerFn(
      adminDeleteReviewD1
    );

  const [
    reviews,
    setReviews,
  ] =
    useState<
      AdminReviewRow[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const load =
    useCallback(
      async () => {
        setLoading(
          true
        );

        try {
          const result =
            await getReviews();

          setReviews(
            result.reviews
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        getReviews,
      ]
    );

  useEffect(
    () => {
      void load();
    },
    [
      load,
    ]
  );

  const changeStatus =
    async (
      id: string,
      status:
        | "pending"
        | "approved"
        | "rejected"
    ) => {
      await setStatus({
        data: {
          id,
          status,
        },
      });

      await load();
    };

  const remove =
    async (
      review: AdminReviewRow
    ) => {
      const confirmed =
        window.confirm(
          `Να διαγραφεί οριστικά η αξιολόγηση του/της ${review.name};`
        );

      if (
        !confirmed
      ) {
        return;
      }

      await deleteReview({
        data: {
          id:
            review.id,
        },
      });

      await load();
    };

  if (
    loading
  ) {
    return (
      <div className="panel p-6 text-sm text-muted-foreground">
        Φόρτωση αξιολογήσεων…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {[
        "pending",
        "approved",
        "rejected",
      ].map(
        (
          status
        ) => {
          const list =
            reviews.filter(
              (
                review
              ) =>
                review.status ===
                status
            );

          return (
            <div
              key={
                status
              }
            >
              <div className="flex items-center justify-between mb-3">
                <p className="eyebrow">
                  {statusLabel(
                    status
                  )}
                </p>

                <span className="text-xs text-muted-foreground">
                  {
                    list.length
                  }
                </span>
              </div>

              {list.length ===
              0 ? (
                <div className="panel p-5 text-sm text-muted-foreground">
                  Δεν υπάρχουν αξιολογήσεις σε αυτή την κατηγορία.
                </div>
              ) : (
                <div className="space-y-3">
                  {list.map(
                    (
                      review
                    ) => (
                      <div
                        key={
                          review.id
                        }
                        className="panel p-5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <div className="font-medium">
                              {
                                review.name
                              }
                            </div>

                            <div className="text-primary text-lg mt-1">
                              {"★".repeat(
                                review.rating
                              )}

                              <span className="text-muted-foreground">
                                {"☆".repeat(
                                  5 -
                                    review.rating
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground sm:text-right">
                            <div>
                              {
                                review.booking_code
                              }
                            </div>

                            <div>
                              {formatDate(
                                review.created_at
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="mt-4 text-sm leading-relaxed">
                          {
                            review.text
                          }
                        </p>

                        <div className="flex flex-wrap gap-4 mt-5 text-xs">
                          {review.status !==
                            "approved" && (
                            <button
                              className="text-olive"
                              onClick={() =>
                                changeStatus(
                                  review.id,
                                  "approved"
                                )
                              }
                            >
                              Έγκριση
                            </button>
                          )}

                          {review.status !==
                            "rejected" && (
                            <button
                              className="text-destructive"
                              onClick={() =>
                                changeStatus(
                                  review.id,
                                  "rejected"
                                )
                              }
                            >
                              Απόρριψη
                            </button>
                          )}

                          {review.status !==
                            "pending" && (
                            <button
                              className="text-muted-foreground"
                              onClick={() =>
                                changeStatus(
                                  review.id,
                                  "pending"
                                )
                              }
                            >
                              Σε αναμονή
                            </button>
                          )}

                          <button
                            className="text-destructive font-medium"
                            onClick={() =>
                              remove(
                                review
                              )
                            }
                          >
                            Διαγραφή
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          );
        }
      )}
    </div>
  );
}
