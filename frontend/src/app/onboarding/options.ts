import type {
    PracticeSetting,
    ProfessionalTitle,
} from "@/app/lib/mikeApi";

/**
 * US states. BIG operates in the United States and agreement terms are
 * state-specific — lien rights, retainage caps and licensing all vary by
 * state, so a country is not a useful answer here.
 */
export const US_STATE_OPTIONS = [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "District of Columbia",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
    "Puerto Rico",
] as const;

export const OTHER_JURISDICTION_OPTION = "Other" as const;

/**
 * Trades, grouped in build order — preconstruction, site, structure, envelope,
 * systems, interiors, then specialty — because that is the order a contractor
 * already thinks in, and because a flat list this long is not scannable.
 *
 * This must stay in step with `TRADES` in `backend/src/lib/trades.ts`, which
 * validates the write. A value offered here but unknown there is dropped
 * silently on save.
 */
export const TRADE_GROUP_OPTIONS = [
    {
        label: "General",
        trades: ["General Construction", "Remodeling"],
    },
    {
        label: "Preconstruction",
        trades: ["Design and Engineering", "Surveying"],
    },
    {
        label: "Site work",
        trades: [
            "Site Work and Excavation",
            "Grading and Paving",
            "Utilities and Underground",
            "Septic and Well",
            "Demolition",
        ],
    },
    {
        label: "Structure",
        trades: [
            "Foundations",
            "Concrete and Masonry",
            "Framing",
            "Carpentry",
            "Structural Steel",
            "Welding and Metal Fabrication",
            "Scaffolding and Shoring",
        ],
    },
    {
        label: "Building envelope",
        trades: [
            "Roofing",
            "Siding and Exterior",
            "Waterproofing",
            "Insulation",
            "Windows and Doors",
            "Glass and Glazing",
        ],
    },
    {
        label: "Systems",
        trades: [
            "Electrical",
            "Plumbing",
            "HVAC",
            "Fire Protection",
            "Low Voltage and Security",
            "Solar and Renewables",
            "Elevators and Conveying",
        ],
    },
    {
        label: "Interiors",
        trades: [
            "Drywall and Painting",
            "Plaster and Stucco",
            "Tile and Stone",
            "Flooring",
            "Cabinetry and Millwork",
            "Countertops",
        ],
    },
    {
        label: "Specialty",
        trades: [
            "Landscaping",
            "Fencing and Gates",
            "Decking",
            "Pools and Spas",
            "Environmental and Abatement",
            "Restoration and Water Damage",
            "Equipment and Hauling",
            "Other",
        ],
    },
] as const satisfies readonly { label: string; trades: readonly string[] }[];

export type PracticeArea =
    (typeof TRADE_GROUP_OPTIONS)[number]["trades"][number];

/** Flat list, in the same order the groups render. */
export const PRACTICE_AREA_OPTIONS: readonly PracticeArea[] =
    TRADE_GROUP_OPTIONS.flatMap((group) => group.trades);

export const PRACTICE_SETTING_OPTIONS = [
    { value: "general_contractor", label: "General contractor" },
    { value: "subcontractor", label: "Subcontractor" },
    { value: "independent", label: "Independent contractor" },
    { value: "owner_developer", label: "Owner or developer" },
    { value: "vendor_supplier", label: "Vendor or supplier" },
    { value: "other", label: "Other" },
] as const satisfies readonly { value: PracticeSetting; label: string }[];

export type { PracticeSetting } from "@/app/lib/mikeApi";

export const PROFESSIONAL_TITLE_OPTIONS = [
    "Owner",
    "Project Manager",
    "Site Supervisor",
    "Foreman",
    "Estimator",
    "Office Manager",
    "Tradesperson",
    "Other",
] as const satisfies readonly ProfessionalTitle[];

export type { ProfessionalTitle } from "@/app/lib/mikeApi";
