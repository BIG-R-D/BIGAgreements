import { describe, expect, it } from "vitest";
import {
  parseRuleSet,
  memberVisibleRules,
  ruleSetReview,
  reviewIsCurrent,
  renderRule,
  InvalidRuleSetError,
  type JurisdictionRuleSet,
} from "../jurisdictionRules";

const NOW = new Date("2026-09-12T00:00:00Z");

function set(overrides: Partial<JurisdictionRuleSet> = {}): JurisdictionRuleSet {
  return {
    jurisdiction: "US-GA",
    name: "Georgia",
    lastReviewed: "2026-06-01",
    reviewedBy: "legal@example",
    sources: [{ id: "s1", label: "O.C.G.A. Title 43, Chapter 41" }],
    rules: [
      {
        id: "verified-electrical",
        kind: "licensing",
        appliesToTrades: ["Electrical"],
        summary: "Electrical work generally needs a licensed contractor.",
        authority: "Georgia Construction Industry Licensing Board",
        sourceIds: ["s1"],
        status: "verified",
      },
      {
        id: "unverified-general",
        kind: "licensing",
        appliesToTrades: ["General Construction"],
        summary: "General contracting may need a state licence.",
        authority: "Georgia State Licensing Board",
        threshold: { type: "contract_value", currency: "USD", amount: null },
        sourceIds: ["s1"],
        status: "unverified",
      },
    ],
    ...overrides,
  };
}

describe("parseRuleSet", () => {
  it("accepts a well-formed set", () => {
    expect(parseRuleSet(set()).jurisdiction).toBe("US-GA");
  });

  it("refuses a rule with no source — an uncited regulatory claim", () => {
    const bad = set();
    bad.rules[0].sourceIds = [];
    expect(() => parseRuleSet(bad)).toThrow(InvalidRuleSetError);
  });

  it("refuses a source id that does not exist", () => {
    const bad = set();
    bad.rules[0].sourceIds = ["nope"];
    expect(() => parseRuleSet(bad)).toThrow(/unknown source/);
  });

  it("refuses a rule with no named authority", () => {
    const bad = set();
    bad.rules[0].authority = "";
    expect(() => parseRuleSet(bad)).toThrow(/authority is required/);
  });

  it("refuses a malformed jurisdiction code", () => {
    expect(() => parseRuleSet(set({ jurisdiction: "Georgia" }))).toThrow(
      /US-GA/,
    );
  });
});

describe("the member gate", () => {
  it("shows verified rules for the member's trades", () => {
    const visible = memberVisibleRules(set(), ["Electrical"], NOW);
    expect(visible.map((r) => r.id)).toEqual(["verified-electrical"]);
  });

  it("never shows an unverified rule", () => {
    const visible = memberVisibleRules(set(), ["General Construction"], NOW);
    expect(visible).toEqual([]);
  });

  it("withholds everything when the review is stale", () => {
    // A threshold that was right a year ago is not evidence about today.
    const stale = set({ lastReviewed: "2024-01-01" });
    expect(memberVisibleRules(stale, ["Electrical"], NOW)).toEqual([]);
  });

  it("withholds everything when never reviewed", () => {
    expect(
      memberVisibleRules(set({ lastReviewed: null }), ["Electrical"], NOW),
    ).toEqual([]);
  });

  it("ignores trades the rule does not cover", () => {
    expect(memberVisibleRules(set(), ["Flooring"], NOW)).toEqual([]);
  });

  it("treats an empty trade list on a rule as applying to all trades", () => {
    const s = set();
    s.rules[0].appliesToTrades = [];
    expect(memberVisibleRules(s, ["Flooring"], NOW)).toHaveLength(1);
  });
});

describe("reviewIsCurrent", () => {
  it("is false at exactly the cutoff", () => {
    expect(reviewIsCurrent({ lastReviewed: "2025-09-12" }, NOW)).toBe(false);
  });
  it("is true inside the window", () => {
    expect(reviewIsCurrent({ lastReviewed: "2026-01-01" }, NOW)).toBe(true);
  });
  it("treats an unparseable date as stale", () => {
    expect(reviewIsCurrent({ lastReviewed: "whenever" }, NOW)).toBe(false);
  });
});

describe("ruleSetReview", () => {
  it("explains what is withheld and why", () => {
    const review = ruleSetReview(set(), NOW);
    expect(review.current).toBe(true);
    expect(review.withheldFromMembers).toEqual([
      { id: "unverified-general", reason: "rule is unverified" },
    ]);
  });

  it("attributes staleness to the set, not the individual rules", () => {
    const review = ruleSetReview(set({ lastReviewed: null }), NOW);
    expect(review.current).toBe(false);
    expect(review.withheldFromMembers).toHaveLength(2);
    expect(review.withheldFromMembers[0].reason).toMatch(/never been reviewed/);
  });
});

describe("renderRule", () => {
  it("never implies a number when the threshold is unverified", () => {
    const rule = set().rules[1];
    const text = renderRule(rule);
    expect(text).toMatch(/worth confirming the current figure/i);
    expect(text).not.toMatch(/\$\s?\d/);
  });

  it("states a verified threshold plainly", () => {
    const rule = set().rules[1];
    rule.threshold = { type: "contract_value", currency: "USD", amount: 2500 };
    expect(renderRule(rule)).toContain("$2,500");
  });

  it("omits threshold language when there is none", () => {
    expect(renderRule(set().rules[0])).not.toMatch(/threshold|over \$/i);
  });
});
