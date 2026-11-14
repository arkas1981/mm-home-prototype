import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useServerFn,
} from "@tanstack/react-start";

import {
  CheckCircle2,
  ImageIcon,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  adminDeleteReviewD1,
  adminDeleteReviewPhotoD1,
  adminReviewsD1,
  adminSetReviewPhotoStatusD1,
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

function photoStatusLabel(
  status: string
) {
  if (
    status ===
    "approved"
  ) {
    return "Εγκεκριμένη";
  }

  if (
    status ===
    "rejected"
  ) {
    return "Απορριφθείσα";
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

  const setPhotoStatus =
    useServerFn(
      adminSetReviewPhotoStatusD1
    );

  const deleteReview =
    useServerFn(
      adminDeleteReviewD1
    );

  const deletePhoto =
    useServerFn(
      adminDeleteReviewPhotoD1
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

  const changePhotoStatus =
    async (
      id: string,
      status:
        | "pending"
        | "approved"
        | "rejected"
    ) => {
      await setPhotoStatus({
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

  const removePhoto =
    async (
      id: string
    ) => {
      const confirmed =
        window.confirm(
          "Να διαγραφεί οριστικά αυτή η φωτογραφία;"
        );

      if (
        !confirmed
      ) {
        return;
      }

      await deletePhoto({
        data: {
          id,
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
    <div className="space-y-8">
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
                <div className="space-y-4">
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
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div>
                            <div className="font-medium text-base">
                              {
                                review.name
                              }
                            </div>

                            <div className="mt-1 text-xs text-muted-foreground">
                              Δημόσια εμφάνιση:{" "}
                              <strong>
                                {
                                  review.display_name ||
                                  review.name
                                }
                              </strong>
                            </div>

                            <div className="mt-1 flex items-center gap-2 text-xs">
                              <ShieldCheck
                                size={
                                  15
                                }
                                className="text-olive"
                              />

                              <span className="text-olive font-medium">
                                Επιβεβαιωμένη διαμονή
                              </span>
                            </div>

                            <div className="mt-1 text-xs text-muted-foreground">
                              Πλήρες ονοματεπώνυμο δημόσια:{" "}
                              {
                                review.full_name_consent
                                  ? "Ναι"
                                  : "Όχι"
                              }
                            </div>

                            <div className="text-primary text-lg mt-2">
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
                              Κράτηση:{" "}
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

                        {review.photos.length >
                          0 && (
                          <div className="mt-5">
                            <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                              <ImageIcon
                                size={
                                  17
                                }
                              />

                              Φωτογραφίες επισκέπτη
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              {review.photos.map(
                                (
                                  photo
                                ) => (
                                  <div
                                    key={
                                      photo.id
                                    }
                                    className="border rounded-xl overflow-hidden bg-secondary/20"
                                  >
                                    <img
                                      src={
                                        photo.url
                                      }
                                      alt="Φωτογραφία αξιολόγησης"
                                      className="w-full aspect-square object-cover"
                                    />

                                    <div className="p-3 space-y-2">
                                      <div className="text-xs text-muted-foreground">
                                        {
                                          photoStatusLabel(
                                            photo.status
                                          )
                                        }
                                      </div>

                                      <div className="flex flex-wrap gap-3 text-xs">
                                        {photo.status !==
                                          "approved" && (
                                          <button
                                            type="button"
                                            className="text-olive flex items-center gap-1"
                                            onClick={() =>
                                              changePhotoStatus(
                                                photo.id,
                                                "approved"
                                              )
                                            }
                                          >
                                            <CheckCircle2
                                              size={
                                                14
                                              }
                                            />

                                            Έγκριση
                                          </button>
                                        )}

                                        {photo.status !==
                                          "rejected" && (
                                          <button
                                            type="button"
                                            className="text-destructive flex items-center gap-1"
                                            onClick={() =>
                                              changePhotoStatus(
                                                photo.id,
                                                "rejected"
                                              )
                                            }
                                          >
                                            <XCircle
                                              size={
                                                14
                                              }
                                            />

                                            Απόρριψη
                                          </button>
                                        )}

                                        {photo.status !==
                                          "pending" && (
                                          <button
                                            type="button"
                                            className="text-muted-foreground"
                                            onClick={() =>
                                              changePhotoStatus(
                                                photo.id,
                                                "pending"
                                              )
                                            }
                                          >
                                            Σε αναμονή
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          className="text-destructive flex items-center gap-1 font-medium"
                                          onClick={() =>
                                            removePhoto(
                                              photo.id
                                            )
                                          }
                                        >
                                          <Trash2
                                            size={
                                              14
                                            }
                                          />

                                          Διαγραφή
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-4 mt-6 text-xs">
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
                              Έγκριση αξιολόγησης
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
                              Απόρριψη αξιολόγησης
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
                            Διαγραφή αξιολόγησης
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
