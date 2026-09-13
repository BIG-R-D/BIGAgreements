import type { ColumnConfig } from "../shared/types";

/**
 * Built-in starter column sets.
 *
 * A new comparison used to open as an empty grid, which left the member to
 * invent the questions before the feature could do anything for them. These
 * are the three comparisons a contractor actually runs — levelling bids,
 * reading a subcontract someone else drafted, and checking a sub's paperwork —
 * so the common case is one click rather than eleven.
 *
 * They are starting points, not a checklist: columns can be edited, removed
 * and added afterwards, and nothing here decides whether a term is acceptable.
 * Prompts ask what a document *says*; the flag and the member's own judgement
 * decide what it means.
 *
 * Deliberately generic, and deliberately in the open-source app: these are the
 * questions any contractor would ask, not BIG's drafting. Trade- and
 * state-specific column sets belong in the private workflow repository, which
 * reaches the app through the same `columns_config` shape.
 */
export interface StarterColumnSet {
    id: string;
    label: string;
    /** One line, shown under the picker so the choice is not a guess. */
    description: string;
    columns: Omit<ColumnConfig, "index">[];
}

export const STARTER_COLUMN_SETS: readonly StarterColumnSet[] = [
    {
        id: "bid-comparison",
        label: "Compare bids",
        description:
            "Level several bids for the same scope side by side.",
        columns: [
            {
                name: "Base price",
                format: "monetary_amount",
                prompt: "State the total base bid price, including the currency. If the bid gives a range or separates a base from alternates, state the base figure only and note that alternates exist.",
            },
            {
                name: "Scope included",
                format: "bulleted_list",
                prompt: "List the work this bid says it includes. One item per bullet, in the bid's own terms. Do not infer work that is not stated.",
            },
            {
                name: "Scope excluded",
                format: "bulleted_list",
                prompt: "List everything this bid explicitly excludes, carves out, or makes someone else's responsibility. One item per bullet. This is where bids differ most, so quote exclusions precisely.",
            },
            {
                name: "Start date",
                format: "date",
                prompt: 'State the date the contractor can start on site, in DD Mon YYYY format. If the bid gives lead time rather than a date, state the lead time instead, e.g. "4 weeks from award".',
            },
            {
                name: "Duration",
                format: "text",
                prompt: 'State how long the work will take, e.g. "6 weeks", "45 working days". Note whether the figure is calendar days or working days if the bid says.',
            },
            {
                name: "Payment terms",
                format: "text",
                prompt: "State when and how payment is due: deposit or mobilisation payment, progress billing frequency, days to pay after invoice, and any late payment charge.",
            },
            {
                name: "Retainage",
                format: "percentage",
                prompt: "State the retainage percentage held from each payment, and when it is released. If retainage is not mentioned, say so.",
            },
            {
                name: "Permits",
                format: "text",
                prompt: "State who pulls the permits and who pays the permit fees. If the bid is silent, say so — this is a common source of dispute.",
            },
            {
                name: "Warranty",
                format: "text",
                prompt: 'State the warranty period and what it covers, e.g. "1 year workmanship, manufacturer warranty on materials". Note anything the warranty excludes.',
            },
            {
                name: "Insurance",
                format: "text",
                prompt: "State the insurance the contractor says it carries: general liability limits, workers' compensation, auto, and any umbrella. Note whether it offers to name others as additional insured.",
            },
            {
                name: "Change order markup",
                format: "percentage",
                prompt: "State the markup applied to change orders — overhead and profit percentages on labour, material and subcontractor costs. If stated separately, give each.",
            },
        ],
    },
    {
        id: "subcontract-review",
        label: "Review a subcontract",
        description:
            "Pull out the terms that decide when you get paid and who carries the risk.",
        columns: [
            {
                name: "Payment timing",
                format: "text",
                prompt: 'State when payment is due, and whether payment depends on the contractor being paid first. Say explicitly whether the clause is pay-when-paid (timing only) or pay-if-paid (a condition precedent), and quote the operative words.',
            },
            {
                name: "Retainage",
                format: "percentage",
                prompt: "State the retainage percentage, when it reduces, and what has to happen before the final release.",
            },
            {
                name: "Change order process",
                format: "text",
                prompt: "State how extra work must be authorised: who can approve it, whether written authorisation is required before starting, and any deadline for submitting a claim. Note what happens to unwritten changes.",
            },
            {
                name: "Schedule and delay",
                format: "text",
                prompt: "State the completion obligation and what happens if it slips: liquidated damages, actual damages, or nothing. Note which delays entitle the subcontractor to more time, and whether any delay entitles it to more money.",
            },
            {
                name: "Termination",
                format: "text",
                prompt: "State who may terminate and on what grounds, including termination for convenience. State what the subcontractor is paid on termination, and any notice or cure period.",
            },
            {
                name: "Indemnity",
                format: "text",
                prompt: "State who indemnifies whom and for what. Note whether the subcontractor must indemnify the contractor for the contractor's own negligence, and whether the obligation is capped.",
            },
            {
                name: "Lien waivers",
                format: "text",
                prompt: "State what lien waivers are required, at what point, and whether they are conditional or unconditional. Note any requirement to waive lien rights in advance.",
            },
            {
                name: "Backcharges",
                format: "yes_no",
                prompt: "Can the contractor deduct backcharges from amounts owed without the subcontractor's agreement? Answer yes or no, and state any notice the contractor must give first.",
            },
            {
                name: "Dispute resolution",
                format: "text",
                prompt: "State how disputes are resolved: negotiation, mediation, arbitration or litigation, where, and under which state's law. Note any requirement to keep working while a dispute is open.",
            },
        ],
    },
    {
        id: "compliance-check",
        label: "Check a sub's paperwork",
        description:
            "Confirm licence, insurance and bonding before anyone starts work.",
        columns: [
            {
                name: "Legal name",
                format: "text",
                prompt: "State the full legal entity name and entity type as written on the document, e.g. \"Peachtree Builders LLC, a Georgia limited liability company\".",
            },
            {
                name: "Licence number",
                format: "text",
                prompt: "State any contractor licence or registration number shown, the issuing state or board, and the expiry date if given.",
            },
            {
                name: "General liability",
                format: "text",
                prompt: "State the general liability limits: per occurrence and aggregate, the insurer, and the policy expiry date.",
            },
            {
                name: "Workers' compensation",
                format: "text",
                prompt: "State the workers' compensation coverage, the insurer, and the policy expiry date. If the document claims an exemption, state the basis given.",
            },
            {
                name: "Additional insured",
                format: "yes_no",
                prompt: "Is any other party named as additional insured? Answer yes or no, and name who is listed.",
            },
            {
                name: "Waiver of subrogation",
                format: "yes_no",
                prompt: "Does the policy include a waiver of subrogation in favour of another party? Answer yes or no, and name who benefits.",
            },
            {
                name: "Bonding",
                format: "text",
                prompt: "State any payment or performance bond referenced: the surety, the penal sum, and what it covers. If no bond is referenced, say so.",
            },
        ],
    },
] as const;

/** Prefix that distinguishes a built-in set from a saved workflow template id. */
export const STARTER_SET_PREFIX = "starter:";

export function starterSetOptionValue(set: StarterColumnSet): string {
    return `${STARTER_SET_PREFIX}${set.id}`;
}

/**
 * Resolve a picker value to columns. Returns null for anything that is not a
 * built-in set, so the caller can fall through to the workflow templates.
 */
export function starterColumnsFor(
    optionValue: string | null,
): ColumnConfig[] | null {
    if (!optionValue?.startsWith(STARTER_SET_PREFIX)) return null;
    const id = optionValue.slice(STARTER_SET_PREFIX.length);
    const set = STARTER_COLUMN_SETS.find((candidate) => candidate.id === id);
    if (!set) return null;
    return set.columns.map((column, index) => ({ ...column, index }));
}

export function starterSetFor(
    optionValue: string | null,
): StarterColumnSet | null {
    if (!optionValue?.startsWith(STARTER_SET_PREFIX)) return null;
    const id = optionValue.slice(STARTER_SET_PREFIX.length);
    return (
        STARTER_COLUMN_SETS.find((candidate) => candidate.id === id) ?? null
    );
}
