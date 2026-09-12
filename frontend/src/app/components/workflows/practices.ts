import { PRACTICE_AREA_OPTIONS } from "@/app/onboarding/options";

export const PRACTICE_OPTIONS = PRACTICE_AREA_OPTIONS;

export type Practice = (typeof PRACTICE_OPTIONS)[number];
