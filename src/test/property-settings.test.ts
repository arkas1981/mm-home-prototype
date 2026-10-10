import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/lib/store";

describe("official property settings", () => {
  it("uses the supplied address", () => expect(defaultSettings.address).toBe("Ασκληπιού 44, Τρίκαλα"));
  it("uses the supplied contact phone", () => expect(defaultSettings.phone).toBe("+30 694 245 0826"));
  it("uses the same phone for Viber", () => expect(new URL(defaultSettings.viberUrl).searchParams.get("number")).toBe("+306942450826"));
  it("directs guests to the supplied address", () => expect(new URL(defaultSettings.mapsUrl).searchParams.get("destination")).toBe("Ασκληπιού 44, Τρίκαλα"));
});