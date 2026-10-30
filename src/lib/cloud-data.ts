import type {
  Block,
  Booking,
  NightlyPrice,
  Override,
  RateType,
} from "./booking";

export type BookingRow = {
  id: string;
  code: string;
  check_in: string;
  check_out: string;

  guests: number;
  adults: number | null;
  child_ages: string | null;

  name: string;
  email: string;
  phone: string;

  rate: string;
  total: number;

  nightly_prices: string | null;
  deposit_amount: number | null;
  notes: string | null;

  status: string;
  payment_status: string;

  refund: number | null;

  source: string;
  created_at: string;
};

export type BlockRow = {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
};

export type OverrideRow = {
  id: string;
  start_date: string;
  end_date: string;
  price: number | null;
  min_nights: number | null;
  label: string;
};

function parseNumberArray(
  value: string | null
) {
  if (!value) {
    return undefined;
  }

  try {
    const parsed =
      JSON.parse(
        value
      );

    if (
      !Array.isArray(
        parsed
      )
    ) {
      return undefined;
    }

    return parsed
      .map(
        (x) =>
          Number(x)
      )
      .filter(
        (x) =>
          Number.isFinite(
            x
          )
      );
  } catch {
    return undefined;
  }
}

function parseNightlyPrices(
  value: string | null
):
  | NightlyPrice[]
  | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed =
      JSON.parse(
        value
      );

    if (
      !Array.isArray(
        parsed
      )
    ) {
      return undefined;
    }

    const result =
      parsed
        .map(
          (
            item
          ) => {
            if (
              !item ||
              typeof item !==
                "object"
            ) {
              return null;
            }

            const date =
              String(
                (
                  item as {
                    date?: unknown;
                  }
                ).date ??
                  ""
              );

            const price =
              Number(
                (
                  item as {
                    price?: unknown;
                  }
                ).price
              );

            if (
              !date ||
              !Number.isFinite(
                price
              )
            ) {
              return null;
            }

            return {
              date,
              price,
            };
          }
        )
        .filter(
          (
            x
          ): x is NightlyPrice =>
            x !== null
        );

    return result.length
      ? result
      : undefined;
  } catch {
    return undefined;
  }
}

export const toBooking = (
  r: BookingRow
): Booking => {
  const childAges =
    parseNumberArray(
      r.child_ages
    );

  const nightlyPrices =
    parseNightlyPrices(
      r.nightly_prices
    );

  return {
    id: r.id,
    code: r.code,

    checkIn:
      r.check_in,

    checkOut:
      r.check_out,

    guests:
      r.guests,

    ...(r.adults != null
      ? {
          adults:
            r.adults,
        }
      : {}),

    ...(childAges
      ? {
          childAges,
        }
      : {}),

    name:
      r.name,

    email:
      r.email,

    phone:
      r.phone,

    rate:
      r.rate as RateType,

    total:
      r.total,

    ...(nightlyPrices
      ? {
          nightlyPrices,
        }
      : {}),

    ...(r.deposit_amount !=
    null
      ? {
          depositAmount:
            r.deposit_amount,
        }
      : {}),

    ...(r.notes
      ? {
          notes:
            r.notes,
        }
      : {}),

    status:
      r.status ===
      "confirmed"
        ? "confirmed"
        : "cancelled",

    ...(r.refund != null
      ? {
          refund:
            r.refund,
        }
      : {}),

    createdAt:
      r.created_at.slice(
        0,
        10
      ),

    source:
      r.source ===
      "manual"
        ? "manual"
        : "web",
  };
};

export const toBlock = (
  r: BlockRow
): Block => ({
  id: r.id,

  start:
    r.start_date,

  end:
    r.end_date,

  reason:
    r.reason,
});

export const toOverride = (
  r: OverrideRow
): Override => ({
  id: r.id,

  start:
    r.start_date,

  end:
    r.end_date,

  label:
    r.label,

  ...(r.price != null
    ? {
        price:
          r.price,
      }
    : {}),

  ...(r.min_nights !=
  null
    ? {
        minNights:
          r.min_nights,
      }
    : {}),
});
