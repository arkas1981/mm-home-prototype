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
  adminUpdateBookingD1,
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

  booking?: Booking;
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
  booking,
}: Props) {
  const today =
    todayISO();

  const editing =
    Boolean(
      booking
    );

  const create =
    useServerFn(
      adminCreateBookingD1
    );

  const update =
    useServerFn(
      adminUpdateBookingD1
    );

  const [name, setName] =
    useState(
      booking?.name ??
        ""
    );

  const [email, setEmail] =
    useState(
      booking?.email ??
        ""
    );

  const [phone, setPhone] =
    useState(
      booking?.phone ??
        ""
    );

  const [checkIn, setCheckIn] =
    useState(
      booking?.checkIn ??
        addDays(
          today,
          7
        )
    );

  const [checkOut, setCheckOut] =
    useState(
      booking?.checkOut ??
        addDays(
          today,
          9
        )
    );

  const [rate, setRate] =
    useState<RateType>(
      booking?.rate ??
        "flexible"
    );

  const [adults, setAdults] =
    useState(
      booking?.adults ??
        Math.max(
          1,
          booking?.guests ??
            2
        )
    );

  const [
    childAges,
    setChildAges,
  ] = useState<string[]>(
    booking?.childAges?.map(
      (age) =>
        String(age)
    ) ??
      []
  );

  const [
    nightlyPrices,
    setNightlyPrices,
  ] = useState<
    NightlyPrice[]
  >(
    booking?.nightlyPrices ??
      []
  );

  const [
    depositAmount,
    setDepositAmount,
  ] = useState(
    booking?.depositAmount ??
      0
  );

  const [notes, setNotes] =
    useState(
      booking?.notes ??
        ""
    );

  const [saving, setSaving] =
    useState(false);

  const [
    pricesInitialized,
    setPricesInitialized,
  ] =
    useState(
      Boolean(
        booking?.nightlyPrices
          ?.length
      )
    );

  const baseQuote =
    useMemo(() => {
      if (
        !checkIn ||
        !checkOut ||
        checkOut <=
          checkIn
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
   * New booking:
   * initialise nightly prices
   * from MM Home pricing.
   *
   * Existing booking:
   * keep the saved nightly
   * prices until dates/rate
   * are changed.
   */
  useEffect(() => {
    if (
      !baseQuote
    ) {
      setNightlyPrices(
        []
      );

      return;
    }

    if (
      editing &&
      pricesInitialized
    ) {
      const sameDates =
        booking?.checkIn ===
          checkIn &&
        booking?.checkOut ===
          checkOut &&
        booking?.rate ===
          rate;

      if (
        sameDates &&
        booking
          ?.nightlyPrices
          ?.length
      ) {
        setNightlyPrices(
          booking.nightlyPrices
        );

        return;
      }

      setPricesInitialized(
        false
      );
    }

    setNightlyPrices(
      baseQuote.nights
    );
  }, [
    baseQuote,
    booking,
    checkIn,
    checkOut,
    editing,
    pricesInitialized,
    rate,
  ]);

  const children =
    childAges.length;

  const totalGuests =
    adults +
    children;

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

  const bookingsForValidation =
    editing &&
    booking
      ? bookings.filter(
          (item) =>
            item.id !==
            booking.id
        )
      : bookings;

  const stayError =
    checkOut <= checkIn
      ? "Η αναχώρηση πρέπει να είναι μετά την άφιξη."
      : (() => {
          const error =
            validateStay(
              checkIn,
              checkOut,

              addDays(
                checkIn,
                -999
              ),

              bookingsForValidation,
              blocks,
              []
            );

          return error ===
            "taken"
            ? "Οι ημερομηνίες δεν είναι διαθέσιμες."
            : null;
        })();

  const adultError =
    !Number.isFinite(
      adults
    ) ||
    adults < 1
      ? "Πρέπει να υπάρχει τουλάχιστον 1 ενήλικας."
      : null;

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
    adultError ??
    childAgeError ??
    priceError ??
    depositError;

  const setChildrenCount =
    (
      count: number
    ) => {
      const safeCount =
        Math.max(
          0,
          Math.floor(
            Number(
              count
            )
          )
        );

      setChildAges(
        (current) => {
          if (
            safeCount <=
            current.length
          ) {
            return current.slice(
              0,
              safeCount
            );
          }

          return [
            ...current,

            ...Array.from(
              {
                length:
                  safeCount -
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

      const payload = {
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

        adults:
          Math.floor(
            adults
          ),

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
      };

      try {
        const result =
          editing &&
          booking
            ? await update({
                data: {
                  id:
                    booking.id,

                  ...payload,
                },
              })
            : await create({
                data:
                  payload,
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
              "Έλεγξε τον αριθμό ενηλίκων και τις ηλικίες των παιδιών."
            );
          } else if (
            result.error ===
            "prices"
          ) {
            alert(
              "Οι τιμές ανά διανυκτέρευση δεν είναι έγκυρες."
            );
          } else if (
            result.error ===
            "deposit"
          ) {
            alert(
              "Η προκαταβολή δεν είναι έγκυρη."
            );
          } else if (
            result.error ===
            "not_manual"
          ) {
            alert(
              "Μόνο οι χειροκίνητες κρατήσεις μπορούν να επεξεργαστούν."
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
          {editing
            ? "Επεξεργασία χειροκίνητης κράτησης"
            : "Νέα χειροκίνητη κράτηση"}
        </p>

        <p className="text-xs text-muted-foreground mt-1">
          {editing
            ? `Κωδικός κράτησης: ${booking?.code}`
            : "Για τηλεφωνικές ή απευθείας κρατήσεις."}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-xs">
          Ονοματεπώνυμο *

          <input
            className="field mt-1"
            value={
              name
            }
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
            value={
              phone
            }
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
            value={
              email
            }
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
          Άτομα
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs">
            Ενήλικες

            <input
              type="number"
              min="1"
              className="field mt-1"
              value={
                adults
              }
              onChange={(e) =>
                setAdults(
                  Math.max(
                    1,
                    Number(
                      e.target.value
                    ) ||
                      1
                  )
                )
              }
            />
          </label>

          <label className="text-xs">
            Παιδιά

            <input
              type="number"
              min="0"
              className="field mt-1"
              value={
                children
              }
              onChange={(e) =>
                setChildrenCount(
                  Number(
                    e.target.value
                  )
                )
              }
            />
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

        <div className="mt-3 text-sm">
          <p>
            <strong>
              {adults}
            </strong>{" "}
            {adults ===
            1
              ? "ενήλικας"
              : "ενήλικες"}
            {" · "}
            <strong>
              {children}
            </strong>{" "}
            {children ===
            1
              ? "παιδί"
              : "παιδιά"}
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            Σύνολο:{" "}
            {totalGuests}{" "}
            άτομα
          </p>
        </div>
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
            Ενήλικες:{" "}
            <strong>
              {adults}
            </strong>
          </p>

          <p>
            Παιδιά:{" "}
            <strong>
              {children}
            </strong>
          </p>

          <p className="mt-2">
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
            : editing
            ? "Αποθήκευση αλλαγών"
            : "Αποθήκευση κράτησης"}
        </button>
      </div>
    </div>
  );
}
