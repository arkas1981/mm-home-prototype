import { createServerFn } from "@tanstack/react-start";
import { getDB } from "./d1.server";

type OverrideRow = {
  start_date: string;
  end_date: string;
  price: number | null;
  min_nights: number | null;
};

export type Availability = {
  booked: {
    check_in: string;
    check_out: string;
  }[];
  blocks: {
    start_date: string;
    end_date: string;
  }[];
  overrides: OverrideRow[];
};

export const getAvailability = createServerFn({
  method: "GET",
}).handler(async (): Promise<Availability> => {
  const db = getDB();
  const now = new Date().toISOString();

  const booked = await db
    .prepare(`
      SELECT check_in, check_out, status, expires_at
      FROM bookings
      WHERE status IN ('pending', 'confirmed')
    `)
    .all<{
      check_in: string;
      check_out: string;
      status: string;
      expires_at: string | null;
    }>();

  const blocks = await db
    .prepare(`
      SELECT start_date, end_date
      FROM blocks
      ORDER BY start_date
    `)
    .all<{
      start_date: string;
      end_date: string;
    }>();

  const overrides = await db
    .prepare(`
      SELECT start_date, end_date, price, min_nights
      FROM price_overrides
      ORDER BY start_date
    `)
    .all<OverrideRow>();

  return {
    booked: (booked.results ?? [])
      .filter(
        (b) =>
          b.status === "confirmed" ||
          (b.status === "pending" &&
            b.expires_at !== null &&
            b.expires_at > now),
      )
      .map((b) => ({
        check_in: b.check_in,
        check_out: b.check_out,
      })),

    blocks: blocks.results ?? [],
    overrides: overrides.results ?? [],
  };
});
