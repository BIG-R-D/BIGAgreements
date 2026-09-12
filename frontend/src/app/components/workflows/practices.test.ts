import { describe, expect, it } from "vitest";
import { PRACTICE_AREA_OPTIONS } from "@/app/onboarding/options";
import { PRACTICE_OPTIONS } from "./practices";

describe("template trade options", () => {
    it("uses the profile trade list without duplicate choices", () => {
        expect(PRACTICE_OPTIONS).toEqual(PRACTICE_AREA_OPTIONS);
        expect(new Set(PRACTICE_OPTIONS).size).toBe(PRACTICE_OPTIONS.length);
    });
});
