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

export const PRACTICE_AREA_OPTIONS = [
    "General Construction",
    "Carpentry",
    "Electrical",
    "Plumbing",
    "HVAC",
    "Roofing",
    "Concrete and Masonry",
    "Drywall and Painting",
    "Flooring",
    "Landscaping",
    "Remodeling",
    "Demolition",
    "Other",
] as const;

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
