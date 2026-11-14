import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Star,
  Trash2,
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

type SelectedPhoto = {
  file: File;
  preview: string;
};

type UploadPhoto = {
  name: string;
  type: string;
  base64: string;
};

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

function publicNamePreview(
  fullName: string
) {
  const cleaned =
    fullName
      .trim()
      .replace(
        /\s+/g,
        " "
      );

  const parts =
    cleaned
      .split(" ")
      .filter(
        Boolean
      );

  if (
    parts.length <=
    1
  ) {
    return cleaned;
  }

  const firstName =
    parts[0];

  const surname =
    parts[
      parts.length -
        1
    ];

  const initial =
    surname
      ?.charAt(0)
      .toLocaleUpperCase(
        "el-GR"
      );

  return initial
    ? `${firstName} ${initial}.`
    : firstName;
}

function fileToBase64(
  file: File
) {
  return new Promise<
    string
  >(
    (
      resolve,
      reject
    ) => {
      const reader =
        new FileReader();

      reader.onload =
        () => {
          if (
            typeof reader.result ===
            "string"
          ) {
            resolve(
              reader.result
            );

            return;
          }

          reject(
            new Error(
              "Δεν ήταν δυνατή η ανάγνωση της φωτογραφίας."
            )
          );
        };

      reader.onerror =
        () => {
          reject(
            new Error(
              "Δεν ήταν δυνατή η ανάγνωση της φωτογραφίας."
            )
          );
        };

      reader.readAsDataURL(
        file
      );
    }
  );
}

function formatFileSize(
  bytes: number
) {
  if (
    bytes <
    1024 *
      1024
  ) {
    return `${Math.max(
      1,
      Math.round(
        bytes /
          1024
      )
    )} KB`;
  }

  return `${(
    bytes /
    (
      1024 *
      1024
    )
  ).toFixed(
    1
  )} MB`;
}

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
    checkOut,
    setCheckOut,
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
    fullNameConsent,
    setFullNameConsent,
  ] =
    useState(
      false
    );

  const [
    photos,
    setPhotos,
  ] =
    useState<
      SelectedPhoto[]
    >([]);

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

  const publicName =
    useMemo(
      () =>
        fullNameConsent
          ? name
          : publicNamePreview(
              name
            ),
      [
        name,
        fullNameConsent,
      ]
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

            setCheckOut(
              result.booking
                .checkOut ??
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

  useEffect(
    () => {
      return () => {
        photos.forEach(
          (
            photo
          ) => {
            URL.revokeObjectURL(
              photo.preview
            );
          }
        );
      };
    },
    [
      photos,
    ]
  );

  const selectPhotos =
    (
      files:
        FileList |
        null
    ) => {
      if (
        !files
      ) {
        return;
      }

      setError(
        ""
      );

      const incoming =
        Array.from(
          files
        );

      if (
        photos.length +
          incoming.length >
        3
      ) {
        setError(
          "Μπορείτε να ανεβάσετε έως 3 φωτογραφίες."
        );

        return;
      }

      const allowedTypes =
        [
          "image/jpeg",
          "image/png",
          "image/webp",
        ];

      for (
        const file of
        incoming
      ) {
        if (
          !allowedTypes.includes(
            file.type
          )
        ) {
          setError(
            "Επιτρέπονται μόνο φωτογραφίες JPG, PNG ή WebP."
          );

          return;
        }

        if (
          file.size >
          5 *
            1024 *
            1024
        ) {
          setError(
            "Κάθε φωτογραφία πρέπει να είναι έως 5 MB."
          );

          return;
        }

        if (
          file.size ===
          0
        ) {
          setError(
            "Μία από τις φωτογραφίες δεν είναι έγκυρη."
          );

          return;
        }
      }

      const selected =
        incoming.map(
          (
            file
          ) => ({
            file,

            preview:
              URL.createObjectURL(
                file
              ),
          })
        );

      setPhotos(
        (
          current
        ) => [
          ...current,
          ...selected,
        ]
      );
    };

  const removePhoto =
    (
      index: number
    ) => {
      setPhotos(
        (
          current
        ) => {
          const target =
            current[
              index
            ];

          if (
            target
          ) {
            URL.revokeObjectURL(
              target.preview
            );
          }

          return current.filter(
            (
              _,
              currentIndex
            ) =>
              currentIndex !==
              index
          );
        }
      );
    };

  const submit =
    async () => {
      if (
        sending ||
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
        const uploadPhotos:
          UploadPhoto[] =
          [];

        for (
          const photo of
          photos
        ) {
          const base64 =
            await fileToBase64(
              photo.file
            );

          uploadPhotos.push({
            name:
              photo.file
                .name,

            type:
              photo.file
                .type,

            base64,
          });
        }

        const result =
          await submitReview({
            data: {
              code,
              rating,
              text,
              fullNameConsent,
              photos:
                uploadPhotos,
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

          if (
            result.error ===
            "storage"
          ) {
            setError(
              "Δεν ήταν δυνατή η αποθήκευση των φωτογραφιών. Παρακαλώ δοκιμάστε ξανά."
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
          "Παρουσιάστηκε πρόβλημα κατά την αποστολή. Παρακαλώ δοκιμάστε ξανά."
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
          max-w-2xl
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
              Ο σύνδεσμος δεν αντιστοιχεί σε επιβεβαιωμένη και ολοκληρωμένη διαμονή.
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
            <CheckCircle2
              size={
                44
              }
              className="
                mx-auto
                mb-4
                text-olive
              "
            />

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
              Η αξιολόγησή σας καταχωρήθηκε και θα δημοσιευτεί μετά από έλεγχο.
            </p>

            <p
              className="
                mt-3
                text-sm
                text-muted-foreground
              "
            >
              Σας ευχαριστούμε που αφιερώσατε χρόνο για να μοιραστείτε την εμπειρία σας στο MM Home.
            </p>
          </div>
        ) : (
          <div
            className="
              panel
              p-6
              sm:p-8
              space-y-8
            "
          >
            <div>
              <div
                className="
                  font-serif
                  text-3xl
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
                Η γνώμη σας βοηθά τους επόμενους επισκέπτες να γνωρίσουν καλύτερα το MM Home.
              </p>
            </div>

            <div
              className="
                rounded-xl
                border
                p-4
                bg-secondary/30
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  font-medium
                "
              >
                <CheckCircle2
                  size={
                    18
                  }
                  className="
                    text-olive
                  "
                />

                Επιβεβαιωμένη διαμονή
              </div>

              <div
                className="
                  mt-2
                  text-sm
                  text-muted-foreground
                "
              >
                Η αξιολόγηση συνδέεται αποκλειστικά με την πραγματική κράτησή σας.
              </div>

              {checkOut && (
                <div
                  className="
                    mt-1
                    text-xs
                    text-muted-foreground
                  "
                >
                  Ολοκλήρωση διαμονής:{" "}
                  {new Date(
                    `${checkOut}T12:00:00`
                  ).toLocaleDateString(
                    "el-GR"
                  )}
                </div>
              )}
            </div>

            <div>
              <div
                className="
                  text-sm
                  font-medium
                  mb-3
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
                      className="
                        transition-transform
                        hover:scale-110
                      "
                    >
                      <Star
                        size={
                          34
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
                Ονοματεπώνυμο κράτησης
              </label>

              <input
                className="
                  field
                  bg-secondary/30
                "
                value={
                  name
                }
                readOnly
              />

              <p
                className="
                  mt-2
                  text-xs
                  text-muted-foreground
                "
              >
                Το όνομα προέρχεται από την επιβεβαιωμένη κράτηση και δεν μπορεί να τροποποιηθεί από τη φόρμα αξιολόγησης.
              </p>
            </div>

            <div
              className="
                rounded-xl
                border
                p-4
              "
            >
              <label
                className="
                  flex
                  items-start
                  gap-3
                  cursor-pointer
                "
              >
                <input
                  type="checkbox"
                  checked={
                    fullNameConsent
                  }
                  onChange={(
                    e
                  ) =>
                    setFullNameConsent(
                      e
                        .target
                        .checked
                    )
                  }
                  className="
                    mt-1
                    accent-primary
                    scale-110
                  "
                />

                <span>
                  <span
                    className="
                      block
                      text-sm
                      font-medium
                    "
                  >
                    Επιτρέπω τη δημόσια εμφάνιση του πλήρους ονοματεπωνύμου μου μαζί με την αξιολόγησή μου.
                  </span>

                  <span
                    className="
                      block
                      mt-1
                      text-xs
                      text-muted-foreground
                      leading-relaxed
                    "
                  >
                    Αν δεν επιλεγεί, θα εμφανιστεί μόνο το μικρό σας όνομα και το αρχικό του επωνύμου.
                  </span>
                </span>
              </label>

              <div
                className="
                  mt-4
                  pt-4
                  border-t
                  text-sm
                "
              >
                Δημόσια εμφάνιση:{" "}
                <strong>
                  {publicName}
                </strong>
                {" "}
                ·{" "}
                <span
                  className="
                    text-olive
                    font-medium
                  "
                >
                  ✓ Επιβεβαιωμένη διαμονή
                </span>
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
                Η εμπειρία σας
              </label>

              <textarea
                className="
                  field
                  min-h-40
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

              <div
                className="
                  mt-1
                  text-right
                  text-xs
                  text-muted-foreground
                "
              >
                {text.length}
                /1000
              </div>
            </div>

            <div>
              <div
                className="
                  flex
                  items-center
                  gap-2
                  mb-2
                "
              >
                <Camera
                  size={
                    18
                  }
                />

                <span
                  className="
                    text-sm
                    font-medium
                  "
                >
                  Φωτογραφίες από τη διαμονή σας
                </span>

                <span
                  className="
                    text-xs
                    text-muted-foreground
                  "
                >
                  προαιρετικά
                </span>
              </div>

              <p
                className="
                  text-xs
                  text-muted-foreground
                  leading-relaxed
                  mb-4
                "
              >
                Μπορείτε να προσθέσετε έως 3 δικές σας φωτογραφίες από το MM Home. Οι φωτογραφίες θα δημοσιευτούν μόνο μετά από έλεγχο μαζί με την αξιολόγηση.
              </p>

              {photos.length <
                3 && (
                <label
                  className="
                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-2
                    border
                    border-dashed
                    rounded-xl
                    p-7
                    cursor-pointer
                    hover:bg-secondary/30
                    transition-colors
                  "
                >
                  <ImagePlus
                    size={
                      30
                    }
                    className="
                      text-primary
                    "
                  />

                  <span
                    className="
                      text-sm
                      font-medium
                    "
                  >
                    Προσθήκη φωτογραφιών
                  </span>

                  <span
                    className="
                      text-xs
                      text-muted-foreground
                    "
                  >
                    JPG, PNG ή WebP · έως 5 MB η καθεμία
                  </span>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(
                      e
                    ) => {
                      selectPhotos(
                        e
                          .target
                          .files
                      );

                      e.target.value =
                        "";
                    }}
                  />
                </label>
              )}

              {photos.length >
                0 && (
                <div
                  className="
                    grid
                    grid-cols-1
                    sm:grid-cols-3
                    gap-3
                    mt-4
                  "
                >
                  {photos.map(
                    (
                      photo,
                      index
                    ) => (
                      <div
                        key={`${photo.file.name}-${index}`}
                        className="
                          relative
                          overflow-hidden
                          rounded-xl
                          border
                          bg-secondary/20
                        "
                      >
                        <img
                          src={
                            photo.preview
                          }
                          alt={`Φωτογραφία ${index + 1}`}
                          className="
                            w-full
                            aspect-square
                            object-cover
                          "
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removePhoto(
                              index
                            )
                          }
                          aria-label="Αφαίρεση φωτογραφίας"
                          className="
                            absolute
                            top-2
                            right-2
                            rounded-full
                            bg-background/90
                            p-2
                            shadow
                          "
                        >
                          <Trash2
                            size={
                              16
                            }
                          />
                        </button>

                        <div
                          className="
                            px-3
                            py-2
                            text-xs
                            text-muted-foreground
                          "
                        >
                          {formatFileSize(
                            photo.file
                              .size
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {photos.length >
                0 && (
                <p
                  className="
                    mt-3
                    text-xs
                    text-muted-foreground
                  "
                >
                  {photos.length} από 3 φωτογραφίες επιλεγμένες
                </p>
              )}
            </div>

            {error && (
              <div
                className="
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  p-4
                  text-sm
                  text-red-700
                "
              >
                {error}
              </div>
            )}

            <button
              type="button"
              className="
                btn-gold
                w-full
              "
              disabled={
                sending ||
                !text.trim()
              }
              onClick={
                submit
              }
            >
              {sending
                ? "Αποστολή αξιολόγησης..."
                : "Υποβολή αξιολόγησης"}
            </button>

            <p
              className="
                text-xs
                text-center
                text-muted-foreground
                leading-relaxed
              "
            >
              Η αξιολόγηση και τυχόν φωτογραφίες δεν δημοσιεύονται αυτόματα. Ελέγχονται πριν εμφανιστούν δημόσια στο MM Home.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
