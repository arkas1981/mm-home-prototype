// Maps Cloud rows to the UI's existing Booking/Block/Override shapes so calendar/pricing helpers keep working.
import { useCallback, useEffect, useState } from "react";
import { getAvailability, type Availability } from "./availability.functions";
import type { Block, Booking, Override, RateType } from "./booking";

export type BookingRow = {
  id: string; code: string; check_in: string; check_out: string; guests: number; name: string; email: string; phone: string;
  rate: string; total: number; status: string; payment_status: string; refund: number | null; source: string; created_at: string;
};
export type BlockRow = { id: string; start_date: string; end_date: string; reason: string };
export type OverrideRow = { id: string; start_date: string; end_date: string; price: number | null; min_nights: number | null; label: string };

export const toBooking = (r: BookingRow): Booking => ({
  id: r.id, code: r.code, checkIn: r.check_in, checkOut: r.check_out, guests: r.guests, name: r.name, email: r.email, phone: r.phone,
  rate: r.rate as RateType, total: r.total, status: r.status === "confirmed" ? "confirmed" : "cancelled",
  ...(r.refund != null ? { refund: r.refund } : {}), createdAt: r.created_at.slice(0, 10), source: r.source === "manual" ? "manual" : "web",
});
export const toBlock = (r: BlockRow): Block => ({ id: r.id, start: r.start_date, end: r.end_date, reason: r.reason });
export const toOverride = (r: OverrideRow): Override => ({
  id: r.id, start: r.start_date, end: r.end_date, label: r.label,
  ...(r.price != null ? { price: r.price } : {}), ...(r.min_nights != null ? { minNights: r.min_nights } : {}),
});

// Public availability: dates only, no guest data.
export function useAvailability() {
  const [data, setData] = useState<{ bookings: Booking[]; blocks: Block[]; overrides: Override[] } | null>(null);
  const load = useCallback(async () => {
    const a: Availability = await getAvailability();
    setData({
      bookings: a.booked.map((b, i) => ({ id: `b${i}`, code: "", checkIn: b.check_in, checkOut: b.check_out, guests: 0, name: "", email: "", phone: "", rate: "flexible", total: 0, status: "confirmed", createdAt: "", source: "web" })),
      blocks: a.blocks.map((b, i) => ({ id: `k${i}`, start: b.start_date, end: b.end_date, reason: "" })),
      overrides: a.overrides.map((o, i) => ({ id: `o${i}`, start: o.start_date, end: o.end_date, ...(o.price != null ? { price: o.price } : {}), ...(o.min_nights != null ? { minNights: o.min_nights } : {}) })),
    });
  }, []);
  useEffect(() => { load().catch(() => setData({ bookings: [], blocks: [], overrides: [] })); }, [load]);
  return { data, reload: load };
}
