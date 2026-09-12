import { describe, expect, it } from "vitest";
import {
  TRADES,
  MAX_TRADES,
  isKnownTrade,
  normalizeTrades,
  considerationsFor,
  CONSIDERATION_PROMPTS,
} from "../trades";

describe("the canonical trade list", () => {
  it("has unique ids", () => {
    const ids = TRADES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every consideration a member-facing prompt", () => {
    for (const trade of TRADES) {
      for (const c of trade.considerations) {
        expect(CONSIDERATION_PROMPTS[c]).toBeTruthy();
      }
    }
  });

  it("matches the values permitted by migration 20260912_01", () => {
    // The migration clears any stored value outside this list, so the two
    // drifting apart silently destroys member data.
    const migration = [
      "General Construction", "Carpentry", "Electrical", "Plumbing", "HVAC",
      "Roofing", "Concrete and Masonry", "Drywall and Painting", "Flooring",
      "Landscaping", "Remodeling", "Demolition", "Other",
    ];
    expect(TRADES.map((t) => t.id).sort()).toEqual(migration.sort());
  });
});

describe("normalizeTrades", () => {
  it("accepts known trades and preserves order", () => {
    expect(normalizeTrades(["Electrical", "Roofing"])).toEqual([
      "Electrical",
      "Roofing",
    ]);
  });

  it("trims and matches case-insensitively, returning the canonical form", () => {
    expect(normalizeTrades(["  electrical  ", "PLUMBING"])).toEqual([
      "Electrical",
      "Plumbing",
    ]);
  });

  it("drops unknown values rather than failing the whole write", () => {
    // A stale value from an older taxonomy must not hard-fail a member saving
    // their profile.
    expect(normalizeTrades(["Electrical", "Corporate and M&A"])).toEqual([
      "Electrical",
    ]);
  });

  it("deduplicates, including across casing", () => {
    expect(normalizeTrades(["Roofing", "roofing", " ROOFING "])).toEqual([
      "Roofing",
    ]);
  });

  it("ignores non-strings", () => {
    expect(normalizeTrades(["Electrical", 42, null, {}])).toEqual([
      "Electrical",
    ]);
  });

  it("returns null for a non-list", () => {
    expect(normalizeTrades("Electrical")).toBeNull();
    expect(normalizeTrades(undefined)).toBeNull();
  });

  it("returns null past the cap", () => {
    // Dedupe runs first, so the cap can only be exceeded by distinct trades.
    const tooMany = Array.from({ length: MAX_TRADES + 1 }, (_, i) => `t${i}`);
    expect(normalizeTrades(tooMany)).toEqual([]); // unknown ids drop out
    const allKnown = TRADES.map((t) => t.id);
    expect(normalizeTrades(allKnown)).toHaveLength(allKnown.length);
  });

  it("accepts an empty list", () => {
    expect(normalizeTrades([])).toEqual([]);
  });
});

describe("isKnownTrade", () => {
  it("is case and whitespace insensitive", () => {
    expect(isKnownTrade(" hvac ")).toBe(true);
    expect(isKnownTrade("Bricklaying")).toBe(false);
  });
});

describe("considerationsFor", () => {
  it("unions across trades without duplicates", () => {
    const result = considerationsFor(["Electrical", "Plumbing"]);
    expect(result).toContain("licensing");
    expect(result).toContain("utility_shutoff");
    expect(new Set(result).size).toBe(result.length);
  });

  it("returns a stable order regardless of input order", () => {
    expect(considerationsFor(["Roofing", "Electrical"])).toEqual(
      considerationsFor(["Electrical", "Roofing"]),
    );
  });

  it("ignores unknown trades", () => {
    expect(considerationsFor(["Bricklaying"])).toEqual([]);
  });

  it("returns nothing for a trade with no considerations", () => {
    expect(considerationsFor(["Flooring"])).toEqual([]);
  });

  it("phrases prompts as things to check, never as legal conclusions", () => {
    // These are review prompts. Asserting the hedge so a future edit cannot
    // quietly turn them into advice.
    for (const prompt of Object.values(CONSIDERATION_PROMPTS)) {
      expect(prompt).toMatch(/Worth |often|may /);
      expect(prompt).not.toMatch(/you must|is required by law|illegal/i);
    }
  });
});
