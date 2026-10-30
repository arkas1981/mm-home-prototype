import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useServerFn,
} from "@tanstack/react-start";

import {
  adminCreateBookingD1,
} from "@/lib/d1-admin.functions";

import {
  addDays,
  quote,
  validateStay,
  type Block,
  type Booking,
  type NightlyPrice,
  type Override,
  type RateType,
} from "@/lib/booking";

import {
  todayISO,
} from "@/lib/store";

type Props = {
  bookings: Booking[];
  blocks: Block[];
  overrides: Override[];
  reload: () => Promise<void>;
  onDone: () => void;
};

const eur = (
  value: number
) =>
  `€${value.toLocaleString(
    "el-GR"
  )}`;

const fd = (
  iso: string
) =>
  new Date(
    `${iso}T12:00:00`
  ).toLocaleDateString(
    "el-GR",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );

export function AdminManualBooking({
  bookings,
  blocks,
  overrides,
  reload,
  onDone,
}: Props) {
  const today =
    todayISO();

  const create =
    useServerFn(
      adminCreateBookingD1
    );

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [checkIn, setCheckIn] =
    useState(
      addDays(
        today,
        7
      )
    );

  const [checkOut, setCheckOut] =
    useState(
      addDays(
        today,
        9
      )
    );

  const [rate, setRate] =
    useState<RateType>(
      "flexible"
    );

  const [adults, setAdults] =
    useState(2);

  const [
    childAges,
    setChildAges,
  ] = useState<string[]>(
    []
  );

  const [
    nightlyPrices,
    setNightlyPrices,
  ] = useState<
    NightlyPrice[]
  >([]);

  const [
    depositAmount,
    setDepositAmount,
  ] = useState(0);

  const [notes, setNotes] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const baseQuote =
    useMemo(() => {
      if (
        !checkIn ||
        !checkOut ||
        checkOut <= checkIn
      ) {
        return null;
      }

      return quote(
        checkIn,
        checkOut,
        rate,
        overrides
      );
    }, [
      checkIn,
      checkOut,
      rate,
      overrides,
    ]);

  /*
   * Whenever dates or rate
   * change, initialise the
   * nightly prices with the
   * normal MM Home prices.
   *
   * The owner can then change
   * every night manually.
   */
  useEffect(() => {
    setNightlyPrices(
      baseQuote?.nights ??
        []
    );
  }, [baseQuote]);

  const total =
    nightlyPrices.reduce(
      (
        sum,
        item
      ) =>
        sum +
        (
          Number(
            item.price
          ) || 0
        ),
      0
    );

  const balance =
    Math.max(
      0,
      total -
        depositAmount
    );

  const children =
    childAges.length;

  const totalGuests =
    adults +
    children;

  const stayError =
    checkOut <= checkIn
      ? "Η αναχώρηση πρέπει να είναι μετά την άφιξη."
      : (() => {
          const error =
            validateStay(
              checkIn,
              checkOut,

              /*
               * Manual reservations
               * are allowed even if
               * they do not respect
               * the public website's
               * lead-time rule.
               */
              addDays(
                checkIn,
                -999
              ),

              bookings,
              blocks,
              []
            );

          return error ===
            "taken"
            ? "Οι ημερομηνίες δεν είναι διαθέσιμες."
            : null;
        })();

  const childAgeError =
    childAges.some(
      (age) =>
        age.trim() === "" ||
        !Number.isFinite(
          Number(age)
        ) ||
        Number(age) <
          0 ||
        Number(age) >
          17
    )
      ? "Συμπλήρωσε σωστά την ηλικία κάθε παιδιού."
      : null;

  const guestError =
    totalGuests >
    6
      ? "Το MM Home δέχεται έως 6 επισκέπτες συνολικά."
      : null;

  const priceError =
    nightlyPrices.some(
      (item) =>
        !Number.isFinite(
          Number(
            item.price
          )
        ) ||
        Number(
          item.price
        ) <
          0
    )
      ? "Υπάρχει μη έγκυρη τιμή διανυκτέρευσης."
      : null;

  const depositError =
    depositAmount < 0
      ? "Η προκαταβολή δεν μπορεί να είναι αρνητική."
      : depositAmount >
        total
      ? "Η προκαταβολή δεν μπορεί να είναι μεγαλύτερη από το συνολικό ποσό."
      : null;

  const error =
    stayError ??
    childAgeError ??
    guestError ??
    priceError ??
    depositError;

  const setChildrenCount =
    (
      count: number
    ) => {
      setChildAges(
        (current) => {
          if (
            count <=
            current.length
          ) {
            return current.slice(
              0,
              count
            );
          }

          return [
            ...current,
            ...Array.from(
              {
                length:
                  count -
                  current.length,
              },
              () => ""
            ),
          ];
        }
      );
    };

  const changeNightPrice =
    (
      index: number,
      value: number
    ) => {
      setNightlyPrices(
        (current) =>
          current.map(
            (
              item,
              itemIndex
            ) =>
              itemIndex ===
              index
                ? {
                    ...item,
                    price:
                      value,
                  }
                : item
          )
      );
    };

  const applySamePrice =
    (
      value: number
    ) => {
      if (
        !Number.isFinite(
          value
        ) ||
        value < 0
      ) {
        return;
      }

      setNightlyPrices(
        (current) =>
          current.map(
            (item) => ({
              ...item,
              price:
                value,
            })
          )
      );
    };

  const save =
    async () => {
      if (
        error ||
        saving ||
        !name.trim() ||
        !phone.trim()
      ) {
        return;
      }

      setSaving(true);

      try {
        const result =
          await create({
            data: {
              checkIn,
              checkOut,

              name:
                name.trim(),

              email:
                email
                  .trim()
                  .toLowerCase(),

              phone:
                phone.trim(),

              rate,

              adults,

              childAges:
                childAges.map(
                  (age) =>
                    Number(
                      age
                    )
                ),

              nightlyPrices:
                nightlyPrices.map(
                  (item) => ({
                    date:
                      item.date,

                    price:
                      Math.round(
                        Number(
                          item.price
                        )
                      ),
                  })
                ),

              depositAmount:
                Math.round(
                  depositAmount
                ),

              notes:
                notes.trim(),
            },
          });

        if (
          "error" in
            result &&
          result.error
        ) {
          if (
            result.error ===
            "taken"
          ) {
            alert(
              "Οι ημερομηνίες δεν είναι διαθέσιμες."
            );
          } else if (
            result.error ===
            "guests"
          ) {
            alert(
              "Ο συνολικός αριθμός επισκεπτών δεν είναι έγκυρος."
            );
          } else if (
            result.error ===
            "prices"
          ) {
            alert(
              "Οι τιμές ανά διανυκτέρευση δεν είναι έγκυρες."
            );
          } else {
            alert(
              "Δεν ήταν δυνατή η αποθήκευση της κράτησης."
            );
          }

          return;
        }

        await reload();

        onDone();
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="panel p-5 space-y-6">
      <div>
        <p className="font-serif text-2xl">
          Νέα χειροκίνητη κράτηση
        </p>

        <p className="text-xs text-muted-foreground mt-1">
          Για τηλεφωνικές ή απευθείας κρατήσεις.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-xs">
          Ονοματεπώνυμο *

          <input
            className="field mt-1"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            placeholder="Ονοματεπώνυμο επισκέπτη"
          />
        </label>

        <label className="text-xs">
          Κινητό *

          <input
            className="field mt-1"
            value={phone}
            onChange={(e) =>
              setPhone(
                e.target.value
              )
            }
            placeholder="69..."
          />
        </label>

        <label className="text-xs sm:col-span-2">
          Email — προαιρετικό

          <input
            type="email"
            className="field mt-1"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            placeholder="Αν υπάρχει email επισκέπτη"
          />
        </label>
      </div>

      <div className="border-t pt-5">
        <p className="font-medium mb-3">
          Διαμονή
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs">
            Άφιξη

            <input
              type="date"
              className="field mt-1"
              value={
                checkIn
              }
              onChange={(e) =>
                setCheckIn(
                  e.target.value
                )
              }
            />
          </label>

          <label className="text-xs">
            Αναχώρηση

            <input
              type="date"
              className="field mt-1"
              value={
                checkOut
              }
              onChange={(e) =>
                setCheckOut(
                  e.target.value
                )
              }
            />
          </label>
        </div>
      </div>

      <div className="border-t pt-5">
        <p className="font-medium mb-3">
          Επισκέπτες
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs">
            Ενήλικες

            <select
              className="field mt-1"
              value={
                adults
              }
              onChange={(e) => {
                const nextAdults =
                  Number(
                    e.target
                      .value
                  );

                setAdults(
                  nextAdults
                );

                if (
                  nextAdults +
                    childAges.length >
                  6
                ) {
                  setChildrenCount(
                    Math.max(
                      0,
                      6 -
                        nextAdults
                    )
                  );
                }
              }}
            >
              {[
                1,
                2,
                3,
                4,
                5,
                6,
              ].map(
                (value) => (
                  <option
                    key={
                      value
                    }
                    value={
                      value
                    }
                  >
                    {
                      value
                    }
                  </option>
                )
              )}
            </select>
          </label>

          <label className="text-xs">
            Παιδιά

            <select
              className="field mt-1"
              value={
                children
              }
              onChange={(e) =>
                setChildrenCount(
                  Number(
                    e.target
                      .value
                  )
                )
              }
            >
              {Array.from(
                {
                  length:
                    Math.max(
                      0,
                      6 -
                        adults
                    ) +
                    1,
                },
                (
                  _,
                  index
                ) =>
                  index
              ).map(
                (value) => (
                  <option
                    key={
                      value
                    }
                    value={
                      value
                    }
                  >
                    {
                      value
                    }
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        {children >
          0 && (
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {childAges.map(
              (
                age,
                index
              ) => (
                <label
                  className="text-xs"
                  key={
                    index
                  }
                >
                  Ηλικία παιδιού{" "}
                  {index +
                    1}

                  <input
                    type="number"
                    min="0"
                    max="17"
                    className="field mt-1"
                    value={
                      age
                    }
                    onChange={(e) => {
                      const next =
                        [
                          ...childAges,
                        ];

                      next[
                        index
                      ] =
                        e.target.value;

                      setChildAges(
                        next
                      );
                    }}
                    placeholder="π.χ. 8"
                  />
                </label>
              )
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-3">
          Σύνολο επισκεπτών:{" "}
          <strong>
            {
              totalGuests
            }
          </strong>
        </p>
      </div>

      <div className="border-t pt-5">
        <p className="font-medium">
          Τιμές διανυκτέρευσης
        </p>

        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Μπορείς να αλλάξεις κάθε βραδιά ξεχωριστά.
        </p>

        <div className="flex gap-2 items-end mb-4">
          <label className="text-xs flex-1">
            Ίδια τιμή σε όλες τις νύχτες

            <input
              type="number"
              min="0"
              className="field mt-1"
              placeholder="π.χ. 180"
              onKeyDown={(e) => {
                if (
                  e.key ===
                  "Enter"
                ) {
                  applySamePrice(
                    Number(
                      (
                        e.target as HTMLInputElement
                      ).value
                    )
                  );
                }
              }}
            />
          </label>

          <button
            type="button"
            className="px-3 py-2 border rounded-md text-sm"
            onClick={(e) => {
              const input =
                (
                  e.currentTarget
                    .previousElementSibling
                    ?.querySelector(
                      "input"
                    )
                ) as
                  | HTMLInputElement
                  | null;

              if (input) {
                applySamePrice(
                  Number(
                    input.value
                  )
                );
              }
            }}
          >
            Εφαρμογή
          </button>
        </div>

        <div className="space-y-2">
          {nightlyPrices.map(
            (
              item,
              index
            ) => (
              <div
                key={
                  item.date
                }
                className="flex justify-between items-center gap-3 border rounded-md p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {fd(
                      item.date
                    )}
                  </p>

                  <p className="text-[11px] text-muted-foreground">
                    Διανυκτέρευση{" "}
                    {index +
                      1}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    className="field w-28 text-right"
                    value={
                      item.price
                    }
                    onChange={(e) =>
                      changeNightPrice(
                        index,
                        Number(
                          e.target
                            .value
                        )
                      )
                    }
                  />

                  <span className="text-sm">
                    €
                  </span>
                </div>
              </div>
            )
          )}
        </div>

        <div className="flex justify-between mt-4 text-lg">
          <span>
            Σύνολο κράτησης
          </span>

          <strong className="font-serif text-2xl">
            {eur(
              total
            )}
          </strong>
        </div>
      </div>

      <div className="border-t pt-5">
        <p className="font-medium mb-3">
          Πληρωμή
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs">
            Προκαταβολή που εισπράχθηκε

            <input
              type="number"
              min="0"
              max={
                total
              }
              className="field mt-1"
              value={
                depositAmount
              }
              onChange={(e) =>
                setDepositAmount(
                  Number(
                    e.target
                      .value
                  )
                )
              }
            />
          </label>

          <div className="border rounded-md p-3">
            <p className="text-xs text-muted-foreground">
              Υπόλοιπο
            </p>

            <p className="font-serif text-2xl mt-1">
              {eur(
                balance
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t pt-5">
        <label className="text-xs">
          Εσωτερικές σημειώσεις

          <textarea
            className="field mt-1 min-h-24"
            value={
              notes
            }
            onChange={(e) =>
              setNotes(
                e.target.value
              )
            }
            placeholder="π.χ. άφιξη περίπου 19:30, ζήτησαν παιδικό κρεβάτι..."
          />
        </label>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      {!name.trim() && (
        <p className="text-xs text-muted-foreground">
          Το ονοματεπώνυμο είναι υποχρεωτικό.
        </p>
      )}

      {!phone.trim() && (
        <p className="text-xs text-muted-foreground">
          Το κινητό είναι υποχρεωτικό για τηλεφωνική κράτηση.
        </p>
      )}

      <div className="border-t pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm">
          <p>
            Συνολικό ποσό:{" "}
            <strong>
              {eur(
                total
              )}
            </strong>
          </p>

          <p>
            Προκαταβολή:{" "}
            <strong>
              {eur(
                depositAmount
              )}
            </strong>
          </p>

          <p>
            Υπόλοιπο:{" "}
            <strong>
              {eur(
                balance
              )}
            </strong>
          </p>
        </div>

        <button
          className="btn-gold"
          disabled={
            !!error ||
            saving ||
            !name.trim() ||
            !phone.trim()
          }
          onClick={
            save
          }
        >
          {saving
            ? "Αποθήκευση…"
            : "Αποθήκευση κράτησης"}
        </button>
      </div>
    </div>
  );
}
