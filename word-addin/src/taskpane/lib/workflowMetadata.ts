export const DEFAULT_WORKFLOW_LANGUAGE = "English";
export const DEFAULT_WORKFLOW_PRACTICE = "General Construction";
export const DEFAULT_WORKFLOW_JURISDICTION = "General";

// English and Spanish only — see the note in the web app's
// NewWorkflowModal. The two lists must stay in step.
export const WORKFLOW_LANGUAGE_OPTIONS = [
  "English",
  "Spanish",
] as const;

// Mirrors TRADE_GROUP_OPTIONS in the web app's onboarding/options.ts and
// TRADES in backend/src/lib/trades.ts. All three must stay in step: the
// backend drops any value it does not recognise.
export const WORKFLOW_PRACTICE_OPTIONS = [
  // General
  "General Construction",
  "Remodeling",
  // Preconstruction
  "Design and Engineering",
  "Surveying",
  // Site work
  "Site Work and Excavation",
  "Grading and Paving",
  "Utilities and Underground",
  "Septic and Well",
  "Demolition",
  // Structure
  "Foundations",
  "Concrete and Masonry",
  "Framing",
  "Carpentry",
  "Structural Steel",
  "Welding and Metal Fabrication",
  "Scaffolding and Shoring",
  // Building envelope
  "Roofing",
  "Siding and Exterior",
  "Waterproofing",
  "Insulation",
  "Windows and Doors",
  "Glass and Glazing",
  // Systems
  "Electrical",
  "Plumbing",
  "HVAC",
  "Fire Protection",
  "Low Voltage and Security",
  "Solar and Renewables",
  "Elevators and Conveying",
  // Interiors
  "Drywall and Painting",
  "Plaster and Stucco",
  "Tile and Stone",
  "Flooring",
  "Cabinetry and Millwork",
  "Countertops",
  // Specialty
  "Landscaping",
  "Fencing and Gates",
  "Decking",
  "Pools and Spas",
  "Environmental and Abatement",
  "Restoration and Water Damage",
  "Equipment and Hauling",
  "Other",
] as const;

// US states, matching the web app. BIG operates in the United States and
// agreement terms are state-specific; "General" covers work that is not.
export const WORKFLOW_JURISDICTION_OPTIONS = [
  "General",
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
  "Other",
] as const;
