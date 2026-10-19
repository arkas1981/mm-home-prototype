import type {
  Block,
  Booking,
  Override,
  RateType,
} from "./booking";

export type BookingRow = {
  id: string;
  code: string;
  check_in: string;
  check_out: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
  rate: string;
  total: number;
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

export const toBooking = (
  r: BookingRow
): Booking => ({
  id: r.id,
  code: r.code,
  checkIn: r.check_in,
  checkOut: r.check_out,
  guests: r.guests,
  name: r.name,
  email: r.email,
  phone: r.phone,
  rate:
    r.rate as RateType,
  total: r.total,
  status:
    r.status === "confirmed"
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
    r.source === "manual"
      ? "manual"
      : "web",
});

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
  ...(r.min_nights != null
    ? {
        minNights:
          r.min_nights,
      }
    : {}),
});
