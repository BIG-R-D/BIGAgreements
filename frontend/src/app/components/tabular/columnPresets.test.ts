import { describe, expect, it } from "vitest";
import { PROMPT_PRESETS, getPresetConfig, getPresetPrompt } from "./columnPresets";

describe("the column prompt presets", () => {
    it("matches on the terms a contractor would actually type", () => {
        const cases: Array<[string, string]> = [
            ["Retainage", "Retainage"],
            ["retention %", "Retainage"],
            ["Base price", "Price"],
            ["Contract sum", "Price"],
            ["Pay-if-paid", "Pay-if-paid"],
            ["Change orders", "Change orders"],
            ["Liquidated damages", "Delay"],
            ["Exclusions", "Exclusions"],
            ["Permits", "Permits"],
            ["Certificate of insurance", "Insurance"],
            ["Lien waiver", "Lien rights"],
            ["Bonding", "Bonding"],
            ["Warranty", "Warranty"],
            ["Backcharges", "Backcharges"],
            ["Governing law", "Governing law"],
        ];
        for (const [typed, expected] of cases) {
            const preset = PROMPT_PRESETS.find(({ matches }) =>
                matches.test(typed),
            );
            expect(preset?.name, `"${typed}" should match ${expected}`).toBe(
                expected,
            );
        }
    });

    it("prefers the specific preset over the general one", () => {
        // "Retainage" contains no payment keyword, but "Payment terms" and
        // "Pay-if-paid" both look payment-shaped: order decides the winner.
        expect(getPresetConfig("Pay-if-paid")?.prompt).toMatch(
            /condition precedent/i,
        );
        expect(getPresetConfig("Payment terms")?.prompt).toMatch(
            /progress billing/i,
        );
        // "Scope of work" must not be captured by the exclusions preset.
        expect(getPresetConfig("Scope of work")?.format).toBe("bulleted_list");
        expect(getPresetConfig("Scope of work")?.prompt).toMatch(/is included/i);
        expect(getPresetConfig("Scope exclusions")?.prompt).toMatch(
            /explicitly excluded/i,
        );
    });

    it("has no leftover corporate-transaction presets", () => {
        const names = PROMPT_PRESETS.map((preset) => preset.name);
        expect(names).not.toContain("Change of Control");
        expect(names).not.toContain("Amendment");
    });

    it("asks what a document says, never whether a term is acceptable", () => {
        for (const preset of PROMPT_PRESETS) {
            expect(preset.prompt).not.toMatch(
                /\b(unfair|unreasonable|you should|we recommend|advise|is illegal|unenforceable)\b/i,
            );
        }
    });

    it("returns nothing for a column name it does not know", () => {
        expect(getPresetPrompt("Widget count")).toBeNull();
        expect(getPresetPrompt("   ")).toBeNull();
    });
});
