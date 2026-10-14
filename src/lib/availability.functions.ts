import { createServerFn } from "@tanstack/react-start";
import { getDB } from "./d1.server";

type OverrideRow = {
  start_date: string;
  end_date: string;
  price: number | null;
  min_nights: number | null;
};

export type Availability = {
  booked: { check_in: string; check_out: string }[];
  blocks: { start_date: string; end_date: string }[];
  overrides: OverrideRow[];
};

export const getAvailability = createServerFn({ method: "GET" })
  .handler(async (): Promise<Availability> => {
    const db = getDB();
    const now = new Date().toISOString();

    const [booked, blocks, overrides] = await Promise.all([
      db.prepare(`
        SELECT check_in, check_out, status, expires_at
        FROM bookings
        WHERE status IN ('pending', 'confirmed')
      `).all<{
        check_in: string;
        check_out: string;
        status: string;
        expires_at: string | null;
      }>(),

      db.prepare(`
        SELECT start_date, end_date
        FROM blocks
      `).all<{
        start_date: string;
        end_date: string;
      }>(),

      db.prepare(`
        SELECT start_date, end_date, price, min_nights
        FROM price_overrides
      `).all<OverrideRow>(),
    ]);

    return {
      booked: (booked.results ?? [])
        .filter(
          (b) =>
            b.status === "confirmed" ||
            (b.expires_at !== null && b.expires_at > now),
        )
        .map((b) => ({
          check_in: b.check_in,
          check_out: b.check_out,
        })),

      blocks: blocks.results ?? [],
      overrides: overrides.results ?? [],
    };
  });
