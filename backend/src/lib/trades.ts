/**
 * Canonical trades.
 *
 * Single source of truth for the trades a BIG member works in. Three things
 * previously disagreed about this list — the frontend option list, the
 * database CHECK-adjacent migration, and nothing at all on the write path —
 * so a member could store any string and a later migration would silently
 * clear it as unrecognised. Writes are now validated against this list.
 *
 * The list is ordered by build sequence — preconstruction, site, structure,
 * envelope, systems, interiors, then specialty — rather than alphabetically,
 * because that is the order a contractor already thinks in. `group` carries
 * that ordering into the UI as section headings; a flat list this long is not
 * scannable.
 *
 * `considerations` are **prompts for review, not legal determinations**.
 * Licensing, permitting, bonding and insurance rules vary by state and by the
 * value of the work; nothing here decides whether a rule applies. They exist
 * so an agreement can surface "worth checking" to a member or flag a draft for
 * an admin, never to assert a legal conclusion.
 *
 * Deliberately generic: the taxonomy and these structural hints are not BIG's
 * commercial IP and belong in the application. Trade-specific clause wording
 * lives in the private workflow repository — see docs/OPEN_SOURCE_COMPLIANCE.md.
 *
 * `practice_areas` is an unconstrained `text[]`, so adding a trade needs no
 * migration. Removing or renaming one does: migration 20260912_01 clears any
 * stored value outside the list it names, so anything dropped from here that
 * is still in that migration would be wiped from member profiles.
 */

export type TradeConsideration =
    | "licensing"
    | "permits"
    | "weather_delay"
    | "utility_shutoff"
    | "hazardous_material"
    | "inspection"
    | "bonding"
    | "insurance";

/** Section heading, in build order. */
export type TradeGroup =
    | "General"
    | "Preconstruction"
    | "Site work"
    | "Structure"
    | "Building envelope"
    | "Systems"
    | "Interiors"
    | "Specialty";

/** Section order for grouped rendering. Every group must appear here. */
export const TRADE_GROUPS: readonly TradeGroup[] = [
    "General",
    "Preconstruction",
    "Site work",
    "Structure",
    "Building envelope",
    "Systems",
    "Interiors",
    "Specialty",
] as const;

export interface Trade {
    /** Stored value. Must match the migration's permitted list exactly. */
    id: string;
    /** Member-facing label. Same as the id today; kept separate so it can diverge. */
    label: string;
    /** Section heading this trade sits under. */
    group: TradeGroup;
    /** Review prompts, not legal conclusions. See the note above. */
    considerations: TradeConsideration[];
}

export const TRADES: readonly Trade[] = [
    // --- General -----------------------------------------------------------
    { id: "General Construction", label: "General Construction", group: "General",
      considerations: ["licensing", "permits", "inspection", "bonding", "insurance", "weather_delay"] },
    { id: "Remodeling", label: "Remodeling", group: "General",
      considerations: ["licensing", "permits", "inspection", "hazardous_material"] },

    // --- Preconstruction ---------------------------------------------------
    { id: "Design and Engineering", label: "Design and Engineering", group: "Preconstruction",
      considerations: ["licensing", "permits", "insurance"] },
    { id: "Surveying", label: "Surveying", group: "Preconstruction",
      considerations: ["licensing", "permits"] },

    // --- Site work ---------------------------------------------------------
    { id: "Site Work and Excavation", label: "Site Work and Excavation", group: "Site work",
      considerations: ["permits", "inspection", "utility_shutoff", "insurance", "weather_delay"] },
    { id: "Grading and Paving", label: "Grading and Paving", group: "Site work",
      considerations: ["licensing", "permits", "inspection", "bonding", "weather_delay"] },
    { id: "Utilities and Underground", label: "Utilities and Underground", group: "Site work",
      considerations: ["licensing", "permits", "inspection", "utility_shutoff", "bonding"] },
    { id: "Septic and Well", label: "Septic and Well", group: "Site work",
      considerations: ["licensing", "permits", "inspection"] },
    { id: "Demolition", label: "Demolition", group: "Site work",
      considerations: ["licensing", "permits", "inspection", "hazardous_material", "utility_shutoff", "insurance"] },

    // --- Structure ---------------------------------------------------------
    { id: "Foundations", label: "Foundations", group: "Structure",
      considerations: ["permits", "inspection", "weather_delay"] },
    { id: "Concrete and Masonry", label: "Concrete and Masonry", group: "Structure",
      considerations: ["permits", "inspection", "weather_delay"] },
    { id: "Framing", label: "Framing", group: "Structure",
      considerations: ["permits", "inspection", "weather_delay"] },
    { id: "Carpentry", label: "Carpentry", group: "Structure",
      considerations: ["permits", "inspection"] },
    { id: "Structural Steel", label: "Structural Steel", group: "Structure",
      considerations: ["licensing", "permits", "inspection", "bonding", "insurance"] },
    { id: "Welding and Metal Fabrication", label: "Welding and Metal Fabrication", group: "Structure",
      considerations: ["licensing", "inspection", "insurance"] },
    { id: "Scaffolding and Shoring", label: "Scaffolding and Shoring", group: "Structure",
      considerations: ["permits", "inspection", "insurance"] },

    // --- Building envelope -------------------------------------------------
    { id: "Roofing", label: "Roofing", group: "Building envelope",
      considerations: ["licensing", "permits", "inspection", "insurance", "weather_delay"] },
    { id: "Siding and Exterior", label: "Siding and Exterior", group: "Building envelope",
      considerations: ["permits", "inspection", "weather_delay"] },
    { id: "Waterproofing", label: "Waterproofing", group: "Building envelope",
      considerations: ["inspection", "weather_delay"] },
    { id: "Insulation", label: "Insulation", group: "Building envelope",
      considerations: ["permits", "inspection", "hazardous_material"] },
    { id: "Windows and Doors", label: "Windows and Doors", group: "Building envelope",
      considerations: ["permits", "inspection"] },
    { id: "Glass and Glazing", label: "Glass and Glazing", group: "Building envelope",
      considerations: ["permits", "inspection"] },

    // --- Systems -----------------------------------------------------------
    { id: "Electrical", label: "Electrical", group: "Systems",
      considerations: ["licensing", "permits", "inspection", "utility_shutoff"] },
    { id: "Plumbing", label: "Plumbing", group: "Systems",
      considerations: ["licensing", "permits", "inspection", "utility_shutoff"] },
    { id: "HVAC", label: "HVAC", group: "Systems",
      considerations: ["licensing", "permits", "inspection"] },
    { id: "Fire Protection", label: "Fire Protection", group: "Systems",
      considerations: ["licensing", "permits", "inspection", "bonding"] },
    { id: "Low Voltage and Security", label: "Low Voltage and Security", group: "Systems",
      considerations: ["licensing", "permits", "inspection"] },
    { id: "Solar and Renewables", label: "Solar and Renewables", group: "Systems",
      considerations: ["licensing", "permits", "inspection", "utility_shutoff", "insurance"] },
    { id: "Elevators and Conveying", label: "Elevators and Conveying", group: "Systems",
      considerations: ["licensing", "permits", "inspection", "bonding", "insurance"] },

    // --- Interiors ---------------------------------------------------------
    { id: "Drywall and Painting", label: "Drywall and Painting", group: "Interiors",
      considerations: ["hazardous_material"] },
    { id: "Plaster and Stucco", label: "Plaster and Stucco", group: "Interiors",
      considerations: ["inspection", "weather_delay"] },
    { id: "Tile and Stone", label: "Tile and Stone", group: "Interiors",
      considerations: ["inspection"] },
    { id: "Flooring", label: "Flooring", group: "Interiors",
      considerations: ["hazardous_material"] },
    { id: "Cabinetry and Millwork", label: "Cabinetry and Millwork", group: "Interiors",
      considerations: [] },
    { id: "Countertops", label: "Countertops", group: "Interiors",
      considerations: [] },

    // --- Specialty ---------------------------------------------------------
    { id: "Landscaping", label: "Landscaping", group: "Specialty",
      considerations: ["permits", "weather_delay"] },
    { id: "Fencing and Gates", label: "Fencing and Gates", group: "Specialty",
      considerations: ["permits", "inspection"] },
    { id: "Decking", label: "Decking", group: "Specialty",
      considerations: ["permits", "inspection", "weather_delay"] },
    { id: "Pools and Spas", label: "Pools and Spas", group: "Specialty",
      considerations: ["licensing", "permits", "inspection"] },
    { id: "Environmental and Abatement", label: "Environmental and Abatement", group: "Specialty",
      considerations: ["licensing", "permits", "inspection", "hazardous_material", "insurance"] },
    { id: "Restoration and Water Damage", label: "Restoration and Water Damage", group: "Specialty",
      considerations: ["licensing", "hazardous_material", "insurance"] },
    { id: "Equipment and Hauling", label: "Equipment and Hauling", group: "Specialty",
      considerations: ["permits", "insurance"] },
    { id: "Other", label: "Other", group: "Specialty", considerations: [] },
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
        "bonding",
        "insurance",
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
    bonding:
        "Work at this scale may need payment or performance bonds. Worth agreeing who provides them and who carries the cost.",
    insurance:
        "This work often carries higher insurance requirements. Worth agreeing the limits and who has to be named as additional insured.",
    utility_shutoff:
        "This work may need power or water shut off. Worth agreeing who arranges it.",
    hazardous_material:
        "Older buildings can involve lead or asbestos. Worth agreeing what happens if it is found.",
    weather_delay:
        "Weather can hold this work up. Worth agreeing whether that moves the completion date.",
};
