/**
 * State licensing and permitting rules.
 *
 * These are regulatory facts about a jurisdiction, not BIG's opinion and not
 * legal advice. Three rules govern this module, and they exist because getting
 * this wrong is worse than not having it:
 *
 * 1. **Nothing reaches a member unverified.** Every rule carries a status. Only
 *    `verified` rules, reviewed within MAX_REVIEW_AGE_MONTHS, are eligible to
 *    surface. Everything else is admin-only. A stale or unverified rule is
 *    withheld, never shown with a caveat — a member acting on a wrong threshold
 *    is the failure mode this prevents.
 *
 * 2. **Every rule cites its authority.** A rule with no source is invalid and is
 *    refused at load. "Some website said so" is not a source; the statute or the
 *    licensing board is.
 *
 * 3. **Thresholds are nullable and unverified by default.** A missing amount
 *    renders as "check the threshold with the board", never as a guessed number.
 *    Whoever fills one in is recorded.
 *
 * Rule DATA lives in the private workflow repository and is synced at runtime,
 * so BIG can correct a rule without redeploying. This module is the engine:
 * shape, validation, staleness, and the gate.
 */

export type RuleStatus = "unverified" | "verified" | "superseded";

export type RuleKind = "licensing" | "permit";

export interface RuleSource {
  id: string;
  /** e.g. "O.C.G.A. Title 43, Chapter 41" */
  label: string;
  url?: string;
}

export interface RuleThreshold {
  type: "contract_value" | "project_value" | "none";
  currency?: "USD";
  /** null means "not yet verified" — never render a guess. */
  amount: number | null;
}

export interface JurisdictionRule {
  id: string;
  kind: RuleKind;
  /** Trade ids from lib/trades.ts. Empty means it applies to all trades. */
  appliesToTrades: string[];
  /** One sentence, plain language, phrased as something to check. */
  summary: string;
  /** The body that actually decides, e.g. a state licensing board. */
  authority: string;
  threshold?: RuleThreshold;
  sourceIds: string[];
  status: RuleStatus;
}

export interface JurisdictionRuleSet {
  /** e.g. "US-GA" */
  jurisdiction: string;
  /** e.g. "Georgia" */
  name: string;
  /** ISO date of the last human review, or null if never reviewed. */
  lastReviewed: string | null;
  reviewedBy: string | null;
  sources: RuleSource[];
  rules: JurisdictionRule[];
}

/**
 * How long a review stays good. Licensing thresholds and permit rules change
 * with legislative sessions, so a year-old review is not evidence that a rule
 * is still current.
 */
export const MAX_REVIEW_AGE_MONTHS = 12;

export class InvalidRuleSetError extends Error {}

/**
 * Validate a rule set at load. Throws rather than returning partial data: a
 * half-loaded regulatory rule set is more dangerous than none.
 */
export function parseRuleSet(input: unknown): JurisdictionRuleSet {
  const fail = (why: string): never => {
    throw new InvalidRuleSetError(why);
  };
  if (!input || typeof input !== "object") fail("rule set must be an object");
  const raw = input as Record<string, unknown>;

  if (
    typeof raw.jurisdiction !== "string" ||
    !/^US-[A-Z]{2}$/.test(raw.jurisdiction)
  ) {
    fail('jurisdiction must look like "US-GA"');
  }
  const jurisdiction = raw.jurisdiction as string;
  if (typeof raw.name !== "string" || !raw.name.trim()) fail("name is required");

  const sources = Array.isArray(raw.sources) ? raw.sources : fail("sources must be a list");
  const sourceIds = new Set<string>();
  for (const s of sources as RuleSource[]) {
    if (!s || typeof s.id !== "string" || !s.id) fail("every source needs an id");
    if (typeof s.label !== "string" || !s.label.trim()) {
      fail(`source ${s.id} needs a label naming the authority`);
    }
    sourceIds.add(s.id);
  }

  const rules = Array.isArray(raw.rules) ? raw.rules : fail("rules must be a list");
  for (const r of rules as JurisdictionRule[]) {
    if (!r || typeof r.id !== "string" || !r.id) fail("every rule needs an id");
    if (r.kind !== "licensing" && r.kind !== "permit") {
      fail(`rule ${r.id}: kind must be licensing or permit`);
    }
    if (typeof r.summary !== "string" || !r.summary.trim()) {
      fail(`rule ${r.id}: summary is required`);
    }
    if (typeof r.authority !== "string" || !r.authority.trim()) {
      fail(`rule ${r.id}: authority is required — name the body that decides`);
    }
    if (!Array.isArray(r.sourceIds) || r.sourceIds.length === 0) {
      fail(`rule ${r.id}: at least one source is required`);
    }
    for (const sid of r.sourceIds) {
      if (!sourceIds.has(sid)) fail(`rule ${r.id}: unknown source "${sid}"`);
    }
    if (!["unverified", "verified", "superseded"].includes(r.status)) {
      fail(`rule ${r.id}: invalid status`);
    }
  }

  return {
    jurisdiction,
    name: raw.name as string,
    lastReviewed: typeof raw.lastReviewed === "string" ? raw.lastReviewed : null,
    reviewedBy: typeof raw.reviewedBy === "string" ? raw.reviewedBy : null,
    sources: sources as RuleSource[],
    rules: rules as JurisdictionRule[],
  };
}

function monthsSince(iso: string, now: Date): number {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return Number.POSITIVE_INFINITY;
  return (
    (now.getFullYear() - then.getFullYear()) * 12 +
    (now.getMonth() - then.getMonth())
  );
}

export function reviewIsCurrent(
  set: Pick<JurisdictionRuleSet, "lastReviewed">,
  now: Date = new Date(),
): boolean {
  if (!set.lastReviewed) return false;
  return monthsSince(set.lastReviewed, now) < MAX_REVIEW_AGE_MONTHS;
}

/**
 * Rules eligible to show a member: verified, from a set reviewed recently
 * enough, and relevant to the trades in play.
 *
 * Returns nothing when the set is stale — deliberately. Showing a member an
 * out-of-date licensing threshold is the harm this module exists to avoid.
 */
export function memberVisibleRules(
  set: JurisdictionRuleSet,
  trades: readonly string[],
  now: Date = new Date(),
): JurisdictionRule[] {
  if (!reviewIsCurrent(set, now)) return [];
  const wanted = new Set(trades.map((t) => t.trim().toLowerCase()));
  return set.rules.filter((r) => {
    if (r.status !== "verified") return false;
    if (r.appliesToTrades.length === 0) return true;
    return r.appliesToTrades.some((t) => wanted.has(t.trim().toLowerCase()));
  });
}

/**
 * Everything an admin should see, including what is being withheld and why.
 * This is the surface that makes the gate auditable rather than invisible.
 */
export function ruleSetReview(
  set: JurisdictionRuleSet,
  now: Date = new Date(),
): {
  current: boolean;
  withheldFromMembers: Array<{ id: string; reason: string }>;
} {
  const current = reviewIsCurrent(set, now);
  const withheld: Array<{ id: string; reason: string }> = [];
  for (const r of set.rules) {
    if (!current) {
      withheld.push({
        id: r.id,
        reason: set.lastReviewed
          ? `rule set last reviewed ${set.lastReviewed}; older than ${MAX_REVIEW_AGE_MONTHS} months`
          : "rule set has never been reviewed",
      });
      continue;
    }
    if (r.status === "unverified") {
      withheld.push({ id: r.id, reason: "rule is unverified" });
    } else if (r.status === "superseded") {
      withheld.push({ id: r.id, reason: "rule is superseded" });
    }
  }
  return { current, withheldFromMembers: withheld };
}

/**
 * Member-facing rendering. A rule with an unverified or absent threshold says
 * to check with the authority; it never implies a number.
 */
export function renderRule(rule: JurisdictionRule): string {
  const base = rule.summary.trim().replace(/\s+$/, "");
  const t = rule.threshold;
  if (!t || t.type === "none") return `${base} (${rule.authority})`;
  if (t.amount === null) {
    return `${base} The threshold is set by the ${rule.authority} — worth confirming the current figure with them.`;
  }
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: t.currency ?? "USD",
    maximumFractionDigits: 0,
  }).format(t.amount);
  const noun = t.type === "contract_value" ? "contract" : "project";
  return `${base} This applies where the ${noun} is over ${amount} (${rule.authority}).`;
}
