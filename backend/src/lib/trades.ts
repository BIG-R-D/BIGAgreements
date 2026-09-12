/**
 * Canonical trades.
 *
 * Single source of truth for the trades a BIG member works in. Three things
 * previously disagreed about this list — the frontend option list, the
 * database CHECK-adjacent migration, and nothing at all on the write path —
 * so a member could store any string and a later migration would silently
 * clear it as unrecognised. Writes are now validated against this list.
 *
 * `considerations` are **prompts for review, not legal determinations**.
 * Licensing, permitting and bonding rules vary by state and by the value of
 * the work; nothing here decides whether a rule applies. They exist so an
 * agreement can surface "worth checking" to a member or flag a draft for an
 * admin, never to assert a legal conclusion.
 *
 * Deliberately generic: the taxonomy and these structural hints are not BIG's
 * commercial IP and belong in the application. Trade-specific clause wording
 * lives in the private workflow repository — see docs/OPEN_SOURCE_COMPLIANCE.md.
 */

export type TradeConsideration =
  | "licensing"
  | "permits"
  | "weather_delay"
  | "utility_shutoff"
  | "hazardous_material"
  | "inspection";

export interface Trade {
  /** Stored value. Must match the migration's permitted list exactly. */
  id: string;
  /** Member-facing label. Same as the id today; kept separate so it can diverge. */
  label: string;
  /** Review prompts, not legal conclusions. See the note above. */
  considerations: TradeConsideration[];
}

export const TRADES: readonly Trade[] = [
  { id: "General Construction", label: "General Construction",
    considerations: ["licensing", "permits", "inspection", "weather_delay"] },
  { id: "Carpentry", label: "Carpentry",
    considerations: ["permits", "inspection"] },
  { id: "Electrical", label: "Electrical",
    considerations: ["licensing", "permits", "inspection", "utility_shutoff"] },
  { id: "Plumbing", label: "Plumbing",
    considerations: ["licensing", "permits", "inspection", "utility_shutoff"] },
  { id: "HVAC", label: "HVAC",
    considerations: ["licensing", "permits", "inspection"] },
  { id: "Roofing", label: "Roofing",
    considerations: ["licensing", "permits", "weather_delay", "inspection"] },
  { id: "Concrete and Masonry", label: "Concrete and Masonry",
    considerations: ["permits", "weather_delay", "inspection"] },
  { id: "Drywall and Painting", label: "Drywall and Painting",
    considerations: ["hazardous_material"] },
  { id: "Flooring", label: "Flooring", considerations: [] },
  { id: "Landscaping", label: "Landscaping",
    considerations: ["permits", "weather_delay"] },
  { id: "Remodeling", label: "Remodeling",
    considerations: ["licensing", "permits", "inspection", "hazardous_material"] },
  { id: "Demolition", label: "Demolition",
    considerations: ["licensing", "permits", "hazardous_material", "utility_shutoff"] },
  { id: "Other", label: "Other", considerations: [] },
] as const;

const BY_ID = new Map(TRADES.map((t) => [t.id.toLowerCase(), t]));

/** Maximum trades a member may record. Mirrors the existing profile cap. */
export const MAX_TRADES = 20;

export function isKnownTrade(value: string): boolean {
  return BY_ID.has(value.trim().toLowerCase());
}

/**
 * Trim, dedupe and drop anything not in the canonical list.
 *
 * Unknown values are dropped rather than rejecting the whole write: a member
 * updating their profile should not get a hard failure because one stale value
 * predates a taxonomy change. Returns null only when the input is not a list
 * or exceeds the cap, which the caller surfaces as a validation error.
 */
export function normalizeTrades(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const match = BY_ID.get(item.trim().toLowerCase());
    if (!match) continue;
    if (seen.has(match.id)) continue;
    seen.add(match.id);
    out.push(match.id);
  }
  return out.length > MAX_TRADES ? null : out;
}

/**
 * Union of the review prompts for a set of trades, deduplicated and stable.
 *
 * Intended for surfacing "worth checking" alongside a generated agreement, and
 * for flagging a draft to an admin. Never for deciding that a rule applies.
 */
export function considerationsFor(
  trades: readonly string[],
): TradeConsideration[] {
  const seen = new Set<TradeConsideration>();
  for (const trade of trades) {
    const match = BY_ID.get(trade.trim().toLowerCase());
    if (!match) continue;
    for (const c of match.considerations) seen.add(c);
  }
  // Stable order so generated output and tests do not depend on input order.
  const ORDER: TradeConsideration[] = [
    "licensing",
    "permits",
    "inspection",
    "utility_shutoff",
    "hazardous_material",
    "weather_delay",
  ];
  return ORDER.filter((c) => seen.has(c));
}

/** Plain-language prompts. Phrased as questions a member would recognise. */
export const CONSIDERATION_PROMPTS: Record<TradeConsideration, string> = {
  licensing:
    "Work of this kind often needs a licensed contractor. Worth confirming who holds the licence.",
  permits:
    "This work often needs a permit. Worth agreeing who pulls it and who pays for it.",
  inspection:
    "This work is often inspected before sign-off. Worth agreeing what happens if it fails.",
  utility_shutoff:
    "This work may need power or water shut off. Worth agreeing who arranges it.",
  hazardous_material:
    "Older buildings can involve lead or asbestos. Worth agreeing what happens if it is found.",
  weather_delay:
    "Weather can hold this work up. Worth agreeing whether that moves the completion date.",
};
