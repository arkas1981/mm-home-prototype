import { describe, expect, it } from "vitest";
import { quote, refundFor, validateStay, nonRefOf, minNightsFor, type Booking } from "@/lib/booking";

const today = "2026-10-08";
const bk = (ci: string, co: string): Booking => ({ id: "x", code: "MM-X", checkIn: ci, checkOut: co, guests: 2, name: "", email: "", phone: "", rate: "flexible", total: 400, status: "confirmed", createdAt: "", source: "web" });

describe("booking rules", () => {
  it("flexible base is €200/night", () => expect(quote("2026-11-01", "2026-11-03", "flexible", []).total).toBe(400));
  it("non-refundable is 10% lower (€180)", () => expect(quote("2026-11-01", "2026-11-03", "nonref", []).total).toBe(360));
  it("non-refundable follows overridden flexible price", () => expect(nonRefOf(250)).toBe(225));
  it("minimum 2 nights", () => expect(validateStay("2026-11-01", "2026-11-02", today, [], [], [])).toBe("min"));
  it("admin can override min nights", () => expect(minNightsFor("2026-12-24", [{ id: "o", start: "2026-12-20", end: "2026-12-31", minNights: 3 }])).toBe(3));
  it("must book at least 2 days before check-in", () => {
    expect(validateStay("2026-10-09", "2026-10-12", today, [], [], [])).toBe("lead");
    expect(validateStay("2026-10-10", "2026-10-12", today, [], [], [])).toBeNull();
  });
  it("same-day turnover allowed", () => expect(validateStay("2026-11-03", "2026-11-05", today, [bk("2026-11-01", "2026-11-03")], [], [])).toBeNull());
  it("blocked dates unavailable", () => expect(validateStay("2026-11-01", "2026-11-04", today, [], [{ id: "b", start: "2026-11-02", end: "2026-11-03", reason: "" }], [])).toBe("taken"));
  it("flexible >=21 days refunds 100%", () => expect(refundFor({ rate: "flexible", total: 400, checkIn: "2026-10-29" }, today).amount).toBe(400));
  it("flexible <21 days refunds 50%", () => expect(refundFor({ rate: "flexible", total: 400, checkIn: "2026-10-28" }, today).amount).toBe(200));
  it("non-refundable refunds 0", () => expect(refundFor({ rate: "nonref", total: 360, checkIn: "2027-01-01" }, today).amount).toBe(0));
});
