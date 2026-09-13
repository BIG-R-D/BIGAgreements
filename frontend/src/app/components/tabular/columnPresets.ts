import type { ColumnFormat } from "../shared/types";

/**
 * Autocomplete for a single column: name a column "Retainage" and the prompt
 * writes itself.
 *
 * These were written for corporate transactions — change of control, share
 * assignment, M&A warranties — which is not what a contractor puts in this
 * grid. They now cover the terms that decide when a subcontractor gets paid
 * and who carries the risk, with the general contract terms that still matter
 * kept alongside.
 *
 * `matches` is tried in order, so put the specific pattern before the general
 * one: "retainage" must win before a bare "payment" would.
 *
 * Every prompt asks what the document *says*. None of them judge whether a
 * term is acceptable — that is the member's call, and a preset that implied
 * otherwise would be giving legal advice.
 */
export interface ColumnPreset {
    name: string;
    matches: RegExp;
    prompt: string;
    format: ColumnFormat;
    tags?: string[];
}

export const PROMPT_PRESETS: ColumnPreset[] = [
    // --- money -------------------------------------------------------------
    {
        name: "Price",
        matches: /\b(base )?(price|bid amount|contract sum|lump sum)\b/i,
        format: "monetary_amount",
        prompt: "State the total contract price or base bid, including the currency. If a base is separated from alternates or allowances, give the base figure and note that the others exist.",
    },
    {
        name: "Retainage",
        matches: /\bretainage\b|\bretention\b/i,
        format: "percentage",
        prompt: "State the retainage percentage held from each payment, when it reduces, and what has to happen before final release.",
    },
    {
        name: "Payment terms",
        matches: /\bpayment\b|\bbilling\b|\binvoic(e|ing)\b/i,
        format: "text",
        prompt: "State when and how payment is due: any deposit or mobilisation payment, progress billing frequency, days to pay after invoice, and any late payment charge.",
    },
    {
        name: "Pay-if-paid",
        matches: /\bpay[- ]?(if|when)[- ]?paid\b|\bcondition precedent\b/i,
        format: "text",
        prompt: "State whether payment depends on the contractor being paid by the owner first. Say explicitly whether the clause is pay-when-paid (timing only) or pay-if-paid (a condition precedent), and quote the operative words.",
    },
    {
        name: "Change orders",
        matches: /\bchange orders?\b|\bextra work\b|\bvariations?\b/i,
        format: "text",
        prompt: "State how extra work must be authorised: who can approve it, whether written authorisation is required before starting, any deadline for submitting a claim, and the markup allowed on cost.",
    },
    {
        name: "Allowances",
        matches: /\ballowances?\b|\bunit prices?\b/i,
        format: "text",
        prompt: "List any allowances or unit prices, with the amount and what each covers. State what happens if actual cost differs from the allowance.",
    },

    // --- schedule ----------------------------------------------------------
    {
        name: "Schedule",
        matches: /\bschedule\b|\bcompletion\b|\bduration\b|\bstart date\b/i,
        format: "text",
        prompt: "State the start date and completion obligation, and whether the figures are calendar days or working days. Note any milestone dates.",
    },
    {
        name: "Delay",
        matches: /\bdelays?\b|\bliquidated damages\b|\bextensions? of time\b/i,
        format: "text",
        prompt: "State what happens if completion slips: liquidated damages, actual damages, or nothing. Note which delays entitle the contractor to more time, and whether any entitle it to more money.",
    },
    {
        name: "Weather",
        matches: /\bweather\b/i,
        format: "text",
        prompt: "State how weather delays are handled: what counts as adverse weather, whether it extends the completion date, and whether it carries any cost.",
    },

    // --- scope -------------------------------------------------------------
    {
        name: "Scope included",
        matches: /\bscope\b(?!.*exclu)|\bwork included\b|\binclusions?\b/i,
        format: "bulleted_list",
        prompt: "List the work this document says is included. One item per bullet, in the document's own terms. Do not infer work that is not stated.",
    },
    {
        name: "Exclusions",
        matches: /\bexclusions?\b|\bexcluded\b|\bcarve[- ]?outs?\b/i,
        format: "bulleted_list",
        prompt: "List everything explicitly excluded, carved out, or made someone else's responsibility. One item per bullet. Quote exclusions precisely — this is where documents differ most.",
    },
    {
        name: "Permits",
        matches: /\bpermits?\b|\binspections?\b/i,
        format: "text",
        prompt: "State who pulls the permits and who pays the fees, and who is responsible for calling and passing inspections. If the document is silent, say so.",
    },

    // --- risk --------------------------------------------------------------
    {
        name: "Insurance",
        matches: /\binsurance\b|\bcertificate of insurance\b|\bcoi\b/i,
        format: "text",
        prompt: "State the insurance required or carried: general liability limits per occurrence and aggregate, workers' compensation, auto and umbrella. Note who must be named as additional insured.",
    },
    {
        name: "Indemnity",
        matches: /\bindemni(ty|ties|fication)\b|\bhold harmless\b/i,
        format: "text",
        prompt: "State who indemnifies whom and for what. Note whether one party must indemnify the other for that other party's own negligence, and whether the obligation is capped.",
    },
    {
        name: "Lien rights",
        matches: /\bliens?\b|\bwaivers? of lien\b|\bpreliminary notice\b/i,
        format: "text",
        prompt: "State what lien waivers are required, at what point, and whether they are conditional or unconditional. Note any requirement to waive lien rights in advance, and any notice deadline the document imposes.",
    },
    {
        name: "Bonding",
        matches: /\bbond(ing|s)?\b|\bsurety\b/i,
        format: "text",
        prompt: "State any payment or performance bond required or provided: the surety, the penal sum, and what it covers. If no bond is referenced, say so.",
    },
    {
        name: "Warranty",
        matches: /\bwarrant(y|ies|ing)\b|\bguarantee\b/i,
        format: "text",
        prompt: "State the warranty period and what it covers, separating workmanship from manufacturer warranties on materials. Note anything the warranty excludes and when the period starts.",
    },
    {
        name: "Safety",
        matches: /\bsafety\b|\bosha\b/i,
        format: "text",
        prompt: "State the safety obligations imposed and on whom: site rules, training or certification requirements, and who is responsible for site safety.",
    },
    {
        name: "Backcharges",
        matches: /\bback ?charges?\b|\bset[- ]?offs?\b|\bdeductions?\b/i,
        format: "yes_no",
        prompt: "Can one party deduct backcharges from amounts owed without the other's agreement? Answer yes or no, and state any notice required first.",
    },

    // --- general contract terms -------------------------------------------
    {
        name: "Parties",
        matches: /\bpart(y|ies)\b/i,
        format: "bulleted_list",
        prompt: 'List all parties, with each one\'s full legal name, entity type, and role, e.g.:\n• Peachtree Builders LLC, a Georgia limited liability company ("Contractor")\n• Jane Doe ("Owner")\nOne party per bullet. No additional commentary.',
    },
    {
        name: "Governing law",
        matches: /\bgoverning law\b|\bjurisdiction\b|\bstate law\b/i,
        format: "text",
        prompt: 'State only the governing law, using the state name, e.g. "Georgia law". No other text.',
    },
    {
        name: "Dispute resolution",
        matches: /\bdisputes?\b|\barbitration\b|\bmediation\b|\blitigation\b/i,
        format: "text",
        prompt: "State how disputes are resolved: negotiation, mediation, arbitration or litigation, where, and under which state's law. Note any requirement to keep working while a dispute is open.",
    },
    {
        name: "Termination",
        matches: /\bterminat(e|ion|ing)\b/i,
        format: "text",
        prompt: "State who may terminate and on what grounds, including termination for convenience. State what is paid on termination, and any notice or cure period.",
    },
    {
        name: "Effective date",
        matches: /\beffective date\b|\bdate of agreement\b/i,
        format: "date",
        prompt: 'State only the effective date in DD Mon YYYY format, e.g. "2 Jan 2026". If not explicitly stated, write "Not specified".',
    },
    {
        name: "Assignment",
        matches: /\bassign(ment|ability)?\b|\bsubcontracting\b/i,
        format: "yes_no",
        prompt: "May this agreement, or the work under it, be assigned or subcontracted without the other party's consent? Answer yes or no, and note any conditions.",
    },
    {
        name: "Confidentiality",
        matches: /\bconfidential(ity)?\b|\bnon-?disclosure\b/i,
        format: "text",
        prompt: "Summarise the confidentiality obligations: what is covered, permitted disclosures, use restrictions, duration, and key exceptions.",
    },
    {
        name: "Force majeure",
        matches: /\bforce majeure\b|\bacts? of god\b/i,
        format: "yes_no",
        prompt: "Does this document contain a force majeure clause? Answer yes or no, and list the events it covers.",
    },
];

export function getPresetConfig(
    title: string,
): Pick<ColumnPreset, "prompt" | "format" | "tags"> | null {
    const trimmed = title.trim();
    if (!trimmed) return null;
    const preset = PROMPT_PRESETS.find(({ matches }) => matches.test(trimmed));
    if (!preset) return null;
    return { prompt: preset.prompt, format: preset.format, tags: preset.tags };
}

export function getPresetPrompt(title: string): string | null {
    return getPresetConfig(title)?.prompt ?? null;
}
