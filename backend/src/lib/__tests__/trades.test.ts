import { describe, expect, it } from "vitest";
import {
  TRADES,
  TRADE_GROUPS,
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

  it("puts every trade in a known group", () => {
    for (const trade of TRADES) {
      expect(TRADE_GROUPS).toContain(trade.group);
    }
  });

  it("keeps trades contiguous within their group", () => {
    // The UI renders one heading per group in TRADE_GROUPS order and walks the
    // list once, so a trade out of position would land under the wrong heading.
    const order = TRADES.map((t) => TRADE_GROUPS.indexOf(t.group));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("still recognises every value migration 20260912_01 preserves", () => {
    // The migration clears any stored value outside the list it names, so a
    // value it keeps but this list has dropped would survive the migration and
    // then be rejected on the next profile write. Adding trades is safe;
    // removing one of these is not.
    const migration = [
      "General Construction", "Carpentry", "Electrical", "Plumbing", "HVAC",
      "Roofing", "Concrete and Masonry", "Drywall and Painting", "Flooring",
      "Landscaping", "Remodeling", "Demolition", "Other",
    ];
    const ids = new Set(TRADES.map((t) => t.id));
    expect(migration.filter((id) => !ids.has(id))).toEqual([]);
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

    const ids = TRADES.map((t) => t.id);
    expect(ids.length).toBeGreaterThan(MAX_TRADES); // else the cap is untested
    expect(normalizeTrades(ids.slice(0, MAX_TRADES))).toHaveLength(MAX_TRADES);
    expect(normalizeTrades(ids.slice(0, MAX_TRADES + 1))).toBeNull();
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
    expect(considerationsFor(["Countertops"])).toEqual([]);
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
