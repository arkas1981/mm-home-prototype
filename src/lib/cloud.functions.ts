// Cloud booking functions — server-side validation, pricing and Stripe TEST checkout.
// Never trust browser-supplied price, availability or payment status.
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { getRequestUrl } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { BASE_RATE, NONREF_DISCOUNT, DEFAULT_MIN_NIGHTS, LEAD_DAYS, MAX_GUESTS, FULL_REFUND_DAYS, type RateType } from "./booking";

type OverrideRow = { start_date: string; end_date: string; price: number | null; min_nights: number | null };
export type Availability = {
  booked: { check_in: string; check_out: string }[];
  blocks: { start_date: string; end_date: string }[];
  overrides: OverrideRow[];
};

// --- shared server-only helpers (never imported by client bundles directly) ---

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (s: string, n: number) => { const d = new Date(s + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return toISO(d); };
const nightsOf = (ci: string, co: string) => { const r: string[] = []; for (let d = ci; d < co; d = addDays(d, 1)) r.push(d); return r; };
const matchOv = (date: string, ov: OverrideRow[], key: "price" | "min_nights") =>
  [...ov].reverse().find((o) => o[key] != null && date >= o.start_date && date <= o.end_date)?.[key];

function serverQuote(ci: string, co: string, rate: RateType, ov: OverrideRow[]) {
  const nights = nightsOf(ci, co).map((d) => {
    const flex = matchOv(d, ov, "price") ?? BASE_RATE;
    return rate === "flexible" ? flex : Math.round(flex * (1 - NONREF_DISCOUNT));
  });
  return { nights: nights.length, total: nights.reduce((a, b) => a + b, 0) };
}

async function loadOverrides(supabase: ReturnType<typeof publicClient>): Promise<OverrideRow[]> {
  const { data } = await supabase.from("price_overrides").select("start_date, end_date, price, min_nights");
  return data ?? [];
}

// Returns { error } or null when the stay is valid against current Cloud data.
async function validateStayServer(
  supabase: ReturnType<typeof publicClient>, ci: string, co: string, ov: OverrideRow[],
): Promise<string | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ci) || !/^\d{4}-\d{2}-\d{2}$/.test(co) || co <= ci) return "order";
  const today = toISO(new Date());
  if (Math.round((new Date(ci + "T12:00:00Z").getTime() - new Date(today + "T12:00:00Z").getTime()) / 86400000) < LEAD_DAYS) return "lead";
  if (nightsOf(ci, co).length < (matchOv(ci, ov, "min_nights") ?? DEFAULT_MIN_NIGHTS)) return "min";
  const now = new Date().toISOString();
  const [{ data: booked }, { data: blocks }] = await Promise.all([
    supabase.from("bookings").select("check_in, check_out, status, expires_at")
      .in("status", ["pending", "confirmed"]).lt("check_in", co).gt("check_out", ci),
    supabase.from("blocks").select("start_date, end_date").lt("start_date", co).gt("end_date", ci),
  ]);
  const taken = (booked ?? []).some((b) => b.status === "confirmed" || (b.expires_at && b.expires_at > now));
  if (taken) return "taken";
  if ((blocks ?? []).length > 0) return "taken";
  return null;
}

const genCode = () => {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "MM-"; for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
};

// --- Stripe TEST helpers (server-only; key never leaves the server) ---

async function stripeCreateCheckoutSession(params: Record<string, string>) {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("Payments are not configured yet.");
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const json = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!res.ok || !json.id || !json.url) throw new Error(json.error?.message ?? "Stripe checkout failed");
  return json;
}

async function stripeGetSession(id: string) {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("Payments are not configured yet.");
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const json = (await res.json()) as { id?: string; payment_status?: string; metadata?: Record<string, string>; error?: { message?: string } };
  if (!res.ok || !json.id) throw new Error(json.error?.message ?? "Could not verify payment");
  return json;
}

// --- public functions ---

export const getAvailability = createServerFn({ method: "GET" }).handler(async (): Promise<Availability> => {
  const supabase = publicClient();
  const now = new Date().toISOString();
  const [{ data: booked }, { data: blocks }, { data: overrides }] = await Promise.all([
    supabase.from("bookings").select("check_in, check_out, status, expires_at").in("status", ["pending", "confirmed"]),
    supabase.from("blocks").select("start_date, end_date"),
    supabase.from("price_overrides").select("start_date, end_date, price, min_nights"),
  ]);
  return {
    booked: (booked ?? [])
      .filter((b) => b.status === "confirmed" || (b.expires_at != null && b.expires_at > now))
      .map((b) => ({ check_in: b.check_in, check_out: b.check_out })),
    blocks: blocks ?? [],
    overrides: overrides ?? [],
  };
});

type CheckoutInput = { checkIn: string; checkOut: string; guests: number; name: string; email: string; phone: string; rate: RateType };

export const createCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: CheckoutInput) => d)
  .handler(async ({ data }) => {
    const name = (data.name ?? "").trim().slice(0, 100);
    const email = (data.email ?? "").trim().toLowerCase().slice(0, 255);
    const phone = (data.phone ?? "").trim().slice(0, 30);
    const guests = Math.floor(Number(data.guests));
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.replace(/\D/g, "").length < 8)
      return { error: "invalid" as const };
    if (!Number.isFinite(guests) || guests < 1 || guests > MAX_GUESTS) return { error: "invalid" as const };
    if (data.rate !== "flexible" && data.rate !== "nonref") return { error: "invalid" as const };

    const supabase = publicClient();
    const admin = await adminClient();
    const ov = await loadOverrides(supabase);

    // Free dates held by abandoned checkouts before validating.
    await admin.from("bookings").delete().eq("status", "pending").lt("expires_at", new Date().toISOString());

    const err = await validateStayServer(supabase, data.checkIn, data.checkOut, ov);
    if (err) return { error: err as "order" | "lead" | "min" | "taken" };

    const q = serverQuote(data.checkIn, data.checkOut, data.rate, ov);
    const code = genCode();
    const origin = new URL(getRequestUrl()).origin;

    const { data: row, error: insErr } = await admin.from("bookings").insert({
      code, check_in: data.checkIn, check_out: data.checkOut, guests,
      name, email, phone, rate: data.rate, total: q.total,
      status: "pending", payment_status: "unpaid", source: "web",
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }).select("id").single();
    if (insErr || !row) return { error: "taken" as const }; // exclusion constraint = dates just got taken

    try {
      const session = await stripeCreateCheckoutSession({
        mode: "payment",
        success_url: `${origin}/book-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/book?cancelled=1`,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": "eur",
        "line_items[0][price_data][unit_amount]": String(q.total * 100),
        "line_items[0][price_data][product_data][name]": `MM Home — ${data.checkIn} → ${data.checkOut} (${q.nights} nights)`,
        customer_email: email,
        "metadata[booking_id]": row.id,
        "metadata[code]": code,
      });
      await admin.from("bookings").update({ stripe_session_id: session.id! }).eq("id", row.id);
      return { url: session.url! };
    } catch (e) {
      await admin.from("bookings").delete().eq("id", row.id); // never hold dates without a payable session
      throw e;
    }
  });

export const confirmBooking = createServerFn({ method: "POST" })
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data }) => {
    if (!/^cs_test_[A-Za-z0-9]+$/.test(data.sessionId ?? "")) return { error: "invalid" as const };
    const session = await stripeGetSession(data.sessionId); // authoritative server-side verification
    const bookingId = session.metadata?.["booking_id"];
    if (!bookingId) return { error: "invalid" as const };
    const admin = await adminClient();
    if (session.payment_status !== "paid") {
      await admin.from("bookings").delete().eq("id", bookingId).eq("status", "pending");
      return { error: "unpaid" as const };
    }
    const { data: b } = await admin.from("bookings")
      .update({ status: "confirmed", payment_status: "paid", expires_at: null })
      .eq("id", bookingId).eq("status", "pending")
      .select("code, check_in, check_out, guests, rate, total, name").single();
    if (!b) {
      const { data: existing } = await admin.from("bookings")
        .select("code, check_in, check_out, guests, rate, total, name").eq("id", bookingId).eq("status", "confirmed").single();
      if (!existing) return { error: "invalid" as const };
      return { booking: existing };
    }
    return { booking: b };
  });

export const lookupBooking = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; code: string }) => d)
  .handler(async ({ data }) => {
    const email = (data.email ?? "").trim().toLowerCase();
    const code = (data.code ?? "").trim().toUpperCase();
    if (!email || !code) return { booking: null };
    const admin = await adminClient();
    const { data: b } = await admin.from("bookings")
      .select("id, code, check_in, check_out, guests, rate, total, status, refund, payment_status")
      .eq("email", email).eq("code", code).single();
    return { booking: b ?? null };
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; code: string }) => d)
  .handler(async ({ data }) => {
    const email = (data.email ?? "").trim().toLowerCase();
    const code = (data.code ?? "").trim().toUpperCase();
    const admin = await adminClient();
    const { data: b } = await admin.from("bookings")
      .select("id, check_in, rate, total, status").eq("email", email).eq("code", code).single();
    if (!b || b.status !== "confirmed") return { error: "invalid" as const };
    const today = toISO(new Date());
    const daysBefore = Math.round((new Date(b.check_in + "T12:00:00Z").getTime() - new Date(today + "T12:00:00Z").getTime()) / 86400000);
    const percent = daysBefore < 0 ? 0 : b.rate === "nonref" ? 0 : daysBefore >= FULL_REFUND_DAYS ? 100 : 50;
    const refund = Math.round((b.total * percent) / 100);
    await admin.from("bookings").update({ status: "cancelled", refund }).eq("id", b.id);
    return { refund, percent };
  });

// --- admin functions (real auth + role check) ---

async function requireAdmin(context: { supabase: ReturnType<typeof publicClient>; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
  return adminClient();
}

export const adminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await requireAdmin(context);
    const [{ data: bookings }, { data: blocks }, { data: overrides }] = await Promise.all([
      admin.from("bookings").select("*").order("check_in", { ascending: false }),
      admin.from("blocks").select("*").order("start_date"),
      admin.from("price_overrides").select("*").order("start_date"),
    ]);
    return { bookings: bookings ?? [], blocks: blocks ?? [], overrides: overrides ?? [] };
  });

export const adminCreateBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: CheckoutInput) => d)
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context);
    const ov = await loadOverrides(publicClient());
    if (data.checkOut <= data.checkIn) return { error: "order" as const };
    const now = new Date().toISOString();
    const [{ data: clash }, { data: blk }] = await Promise.all([
      admin.from("bookings").select("id, status, expires_at").in("status", ["pending", "confirmed"]).lt("check_in", data.checkOut).gt("check_out", data.checkIn),
      admin.from("blocks").select("id").lt("start_date", data.checkOut).gt("end_date", data.checkIn),
    ]);
    if ((clash ?? []).some((b) => b.status === "confirmed" || (b.expires_at && b.expires_at > now)) || (blk ?? []).length) return { error: "taken" as const };
    const q = serverQuote(data.checkIn, data.checkOut, data.rate, ov);
    const { error } = await admin.from("bookings").insert({
      code: genCode(), check_in: data.checkIn, check_out: data.checkOut, guests: data.guests,
      name: data.name.trim().slice(0, 100), email: data.email.trim().toLowerCase().slice(0, 255), phone: data.phone.trim().slice(0, 30),
      rate: data.rate, total: q.total, status: "confirmed", payment_status: "paid", source: "manual",
    });
    if (error) return { error: "taken" as const };
    return { ok: true as const };
  });

export const adminSetBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "confirmed" | "cancelled" }) => d)
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context);
    if (data.status === "confirmed") {
      const { data: b } = await admin.from("bookings").select("check_in, check_out").eq("id", data.id).single();
      if (!b) return { error: "invalid" as const };
      const { data: clash } = await admin.from("bookings").select("id").in("status", ["pending", "confirmed"])
        .neq("id", data.id).lt("check_in", b.check_out).gt("check_out", b.check_in);
      if ((clash ?? []).length) return { error: "taken" as const };
      await admin.from("bookings").update({ status: "confirmed", refund: null, expires_at: null }).eq("id", data.id);
    } else {
      await admin.from("bookings").update({ status: "cancelled", refund: 0 }).eq("id", data.id);
    }
    return { ok: true as const };
  });

export const adminAddBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { start: string; end: string; reason: string }) => d)
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context);
    if (data.end <= data.start) return { error: "order" as const };
    const { error } = await admin.from("blocks").insert({ start_date: data.start, end_date: data.end, reason: data.reason.trim().slice(0, 200) || "—" });
    return { error: error ? ("failed" as const) : null, ok: !error || undefined };
  });

export const adminRemoveBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context);
    await admin.from("blocks").delete().eq("id", data.id);
    return { ok: true as const };
  });

export const adminAddOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { start: string; end: string; price?: number; minNights?: number; label?: string }) => d)
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context);
    if (data.end < data.start || (!data.price && !data.minNights)) return { error: "invalid" as const };
    const { error } = await admin.from("price_overrides").insert({
      start_date: data.start, end_date: data.end,
      price: data.price ? Math.max(1, Math.floor(data.price)) : null,
      min_nights: data.minNights ? Math.max(1, Math.floor(data.minNights)) : null,
      label: (data.label ?? "").slice(0, 100),
    });
    return { error: error ? ("failed" as const) : null };
  });

export const adminRemoveOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context);
    await admin.from("price_overrides").delete().eq("id", data.id);
    return { ok: true as const };
  });
