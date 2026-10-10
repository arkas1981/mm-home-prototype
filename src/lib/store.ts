// Demo persistence in localStorage. Swap this module for database calls later — UI only uses useStore()/update().
import { useSyncExternalStore } from "react";
import { addDays, toISO, quote, type Block, type Booking, type Override } from "./booking";

export interface Review { id: string; name: string; rating: number; text: string; date: string; status: "pending" | "approved" | "rejected"; sample: boolean; bookingCode?: string }
export interface EmailTemplate { subject: string; body: string }
export interface Settings { address: string; phone: string; notifyEmail: boolean; notifyPush: boolean; ownerEmail: string; ama: string; mapsUrl: string; viberUrl: string; facebookUrl: string; instagramUrl: string; climateFee: number; analyticsId: string; analyticsEnabled: boolean; searchConsole: string; privacyContact: string; emailTemplates: Record<string, EmailTemplate> }
export interface State { bookings: Booking[]; blocks: Block[]; overrides: Override[]; reviews: Review[]; settings: Settings }

const KEY = "mmhome-demo-v1";
export const todayISO = () => toISO(new Date());

export const defaultSettings: Settings = { address: "Ασκληπιού 44, Τρίκαλα", phone: "+30 694 245 0826", notifyEmail: true, notifyPush: true, ownerEmail: "info@mmhome.gr", ama: "", mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=%CE%91%CF%83%CE%BA%CE%BB%CE%B7%CF%80%CE%B9%CE%BF%CF%8D+44%2C+%CE%A4%CF%81%CE%AF%CE%BA%CE%B1%CE%BB%CE%B1", viberUrl: "viber://chat?number=%2B306942450826", facebookUrl: "", instagramUrl: "", climateFee: 0, analyticsId: "", analyticsEnabled: false, searchConsole: "", privacyContact: "info@mmhome.gr", emailTemplates: {} };
function seed(): State {
  const t = todayISO();
  const mk = (id: string, code: string, ci: number, co: number, name: string, email: string, rate: "flexible" | "nonref", guests: number, source: "web" | "manual" = "web"): Booking => {
    const checkIn = addDays(t, ci), checkOut = addDays(t, co);
    return { id, code, checkIn, checkOut, guests, name, email, phone: "+30 690 000 0000", rate, total: quote(checkIn, checkOut, rate, []).total, status: "confirmed", createdAt: addDays(t, Math.min(ci - 14, -1)), source };
  };
  return {
    bookings: [
      mk("b1", "MM-DEMO01", -40, -37, "Elena Papadopoulou", "elena@example.com", "flexible", 4),
      mk("b2", "MM-DEMO02", -12, -9, "James Carter", "james@example.com", "nonref", 2),
      mk("b3", "MM-DEMO03", 6, 9, "Maria Konstantinou", "maria@example.com", "flexible", 5),
      mk("b4", "MM-DEMO04", 9, 12, "Lukas Weber", "lukas@example.com", "nonref", 3),
      mk("b5", "MM-DEMO05", 32, 36, "Sofia Rossi", "sofia@example.com", "flexible", 6, "manual"),
    ],
    blocks: [{ id: "k1", start: addDays(t, 18), end: addDays(t, 21), reason: "Owner maintenance (demo)" }],
    overrides: [{ id: "o1", start: addDays(t, 60), end: addDays(t, 66), price: 240, minNights: 3, label: "Holiday period (demo)" }],
    reviews: [
      { id: "r1", name: "Elena P.", rating: 5, text: "Spotless, warm and beautifully renovated. Everything within a short walk.", date: addDays(t, -35), status: "approved", sample: true },
      { id: "r2", name: "Γιώργος Κ.", rating: 5, text: "Υπέροχο, ζεστό σπίτι στο κέντρο. Το τζάκι ατμού δημιουργεί μοναδική ατμόσφαιρα.", date: addDays(t, -60), status: "approved", sample: true },
      { id: "r3", name: "James C.", rating: 5, text: "Perfect for our family. Comfortable beds and a lovely rear balcony.", date: addDays(t, -7), status: "pending", sample: true, bookingCode: "MM-DEMO02" },
    ],
    settings: { ...defaultSettings },
  };
}

const serverState = seed();
let state: State | null = null;
const listeners = new Set<() => void>();

function load(): State {
  if (state) return state;
  try { const raw = localStorage.getItem(KEY); const saved = raw ? (JSON.parse(raw) as State) : seed(); state = { ...saved, settings: { ...defaultSettings, ...saved.settings, address: saved.settings.address && !saved.settings.address.includes("ανακοινωθεί") ? saved.settings.address : defaultSettings.address, phone: !saved.settings.phone || saved.settings.phone === "+30 000 000 0000" ? defaultSettings.phone : saved.settings.phone, mapsUrl: saved.settings.mapsUrl || defaultSettings.mapsUrl, viberUrl: saved.settings.viberUrl || defaultSettings.viberUrl } }; } catch { state = seed(); }
  return state;
}
export function update(fn: (s: State) => State) {
  state = fn(load());
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}
export function resetDemo() { state = seed(); try { localStorage.removeItem(KEY); } catch { /* ignore */ } listeners.forEach((l) => l()); }
export const uid = () => Math.random().toString(36).slice(2, 10);

export function useStore(): State {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, load, () => serverState);
}
