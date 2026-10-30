// Pure booking rules — no storage, no UI.

export const BASE_RATE = 200;
export const NONREF_DISCOUNT = 0.1;
export const DEFAULT_MIN_NIGHTS = 2;
export const LEAD_DAYS = 2;
export const MAX_GUESTS = 6;
export const FULL_REFUND_DAYS = 21;

export type RateType = "flexible" | "nonref";

export type NightlyPrice = {
  date: string;
  price: number;
};

export interface Booking {
  id: string;
  code: string;
  checkIn: string;
  checkOut: string;

  guests: number;

  /*
   * Detailed guest information.
   * Older bookings may not have
   * these values.
   */
  adults?: number;
  childAges?: number[];

  name: string;
  email: string;
  phone: string;

  rate: RateType;
  total: number;

  /*
   * Manual booking details.
   */
  nightlyPrices?: NightlyPrice[];
  depositAmount?: number;
  notes?: string;

  status:
    | "confirmed"
    | "cancelled";

  refund?: number;

  createdAt: string;

  source:
    | "web"
    | "manual";

  note?: string;

  depositStatus?:
    | "not-authorized"
    | "authorized"
    | "release-initiated"
    | "issue";

  cancellationReason?:
    | "guest"
    | "host"
    | "no-show"
    | "early-departure";
}

export interface Block {
  id: string;
  start: string;
  end: string;
  reason: string;
}

export interface Override {
  id: string;
  start: string;
  end: string;
  price?: number;
  minNights?: number;
  label?: string;
}

export const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(
    2,
    "0"
  )}-${String(
    d.getDate()
  ).padStart(
    2,
    "0"
  )}`;

export const parseISO = (
  s: string
) => {
  const [y, m, d] =
    s
      .split("-")
      .map(Number);

  if (
    y === undefined ||
    m === undefined ||
    d === undefined
  ) {
    return new Date(NaN);
  }

  return new Date(
    y,
    m - 1,
    d
  );
};

export const addDays = (
  s: string,
  n: number
) => {
  const d =
    parseISO(s);

  d.setDate(
    d.getDate() + n
  );

  return toISO(d);
};

export const diffDays = (
  a: string,
  b: string
) =>
  Math.round(
    (
      parseISO(b).getTime() -
      parseISO(a).getTime()
    ) /
      86400000
  );

export const nightsOf = (
  ci: string,
  co: string
) => {
  const r: string[] =
    [];

  for (
    let d = ci;
    d < co;
    d = addDays(
      d,
      1
    )
  ) {
    r.push(d);
  }

  return r;
};

const matchOverride = (
  date: string,
  ov: Override[],
  key:
    | "price"
    | "minNights"
) =>
  [...ov]
    .reverse()
    .find(
      (o) =>
        o[key] != null &&
        date >= o.start &&
        date <= o.end
    )?.[key];

export const flexRateFor = (
  date: string,
  ov: Override[]
) =>
  (
    matchOverride(
      date,
      ov,
      "price"
    ) as
      | number
      | undefined
  ) ??
  BASE_RATE;

export const nonRefOf = (
  flex: number
) =>
  Math.round(
    flex *
      (
        1 -
        NONREF_DISCOUNT
      )
  );

export const rateFor = (
  date: string,
  rate: RateType,
  ov: Override[]
) => {
  const f =
    flexRateFor(
      date,
      ov
    );

  return rate ===
    "flexible"
    ? f
    : nonRefOf(f);
};

export const minNightsFor = (
  ci: string,
  ov: Override[]
) =>
  (
    matchOverride(
      ci,
      ov,
      "minNights"
    ) as
      | number
      | undefined
  ) ??
  DEFAULT_MIN_NIGHTS;

export function quote(
  ci: string,
  co: string,
  rate: RateType,
  ov: Override[]
) {
  const nights =
    nightsOf(
      ci,
      co
    ).map(
      (d) => ({
        date: d,
        price:
          rateFor(
            d,
            rate,
            ov
          ),
      })
    );

  return {
    nights,

    total:
      nights.reduce(
        (
          s,
          n
        ) =>
          s +
          n.price,
        0
      ),
  };
}

/*
 * IMPORTANT MM HOME RULE
 *
 * The checkout date is also
 * unavailable for a new check-in.
 *
 * Example:
 * Existing booking:
 * 18 -> 20 October
 *
 * Unavailable for new arrival:
 * 18, 19 and 20 October
 *
 * Next possible arrival:
 * 21 October
 */
export function nightTaken(
  date: string,
  bookings: Booking[],
  blocks: Block[],
  ignoreId?: string
) {
  if (
    bookings.some(
      (b) =>
        b.id !==
          ignoreId &&
        b.status ===
          "confirmed" &&
        date >=
          b.checkIn &&
        date <=
          b.checkOut
    )
  ) {
    return "booked";
  }

  if (
    blocks.some(
      (b) =>
        date >=
          b.start &&
        date <=
          b.end
    )
  ) {
    return "blocked";
  }

  return null;
}

export type StayError =
  | "order"
  | "lead"
  | "min"
  | "taken"
  | null;

export function validateStay(
  ci: string,
  co: string,
  today: string,
  bookings: Booking[],
  blocks: Block[],
  ov: Override[]
): StayError {
  if (
    co <= ci
  ) {
    return "order";
  }

  if (
    diffDays(
      today,
      ci
    ) <
    LEAD_DAYS
  ) {
    return "lead";
  }

  if (
    diffDays(
      ci,
      co
    ) <
    minNightsFor(
      ci,
      ov
    )
  ) {
    return "min";
  }

  const datesToCheck = [
    ...nightsOf(
      ci,
      co
    ),
    co,
  ];

  if (
    datesToCheck.some(
      (d) =>
        nightTaken(
          d,
          bookings,
          blocks
        )
    )
  ) {
    return "taken";
  }

  return null;
}

export function refundFor(
  b: Pick<
    Booking,
    | "rate"
    | "total"
    | "checkIn"
  >,
  today: string
) {
  const daysBefore =
    diffDays(
      today,
      b.checkIn
    );

  const percent =
    daysBefore < 0
      ? 0
      : b.rate ===
        "nonref"
      ? 0
      : daysBefore >=
        FULL_REFUND_DAYS
      ? 100
      : 50;

  return {
    percent,

    amount:
      Math.round(
        (
          b.total *
          percent
        ) /
          100
      ),

    daysBefore,
  };
}

export const genCode = () => {
  const c =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let s =
    "MM-";

  for (
    let i = 0;
    i < 6;
    i++
  ) {
    s +=
      c[
        Math.floor(
          Math.random() *
            c.length
        )
      ];
  }

  return s;
};
