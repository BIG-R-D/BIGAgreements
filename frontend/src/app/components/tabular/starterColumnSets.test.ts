import { describe, expect, it } from "vitest";
import {
    STARTER_COLUMN_SETS,
    STARTER_SET_PREFIX,
    starterColumnsFor,
    starterSetFor,
    starterSetOptionValue,
} from "./starterColumnSets";

describe("the starter column sets", () => {
    it("has unique ids", () => {
        const ids = STARTER_COLUMN_SETS.map((set) => set.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("gives every set columns with unique names", () => {
        for (const set of STARTER_COLUMN_SETS) {
            expect(set.columns.length).toBeGreaterThan(0);
            const names = set.columns.map((column) => column.name);
            expect(new Set(names).size).toBe(names.length);
        }
    });

    it("gives every column a prompt that asks for something specific", () => {
        for (const set of STARTER_COLUMN_SETS) {
            for (const column of set.columns) {
                expect(column.prompt.trim().length).toBeGreaterThan(40);
                expect(column.format).toBeTruthy();
            }
        }
    });

    it("asks what a document says, never whether a term is acceptable", () => {
        // These columns feed a grid a member acts on. A prompt that graded a
        // term would be handing out an opinion on the contract.
        for (const set of STARTER_COLUMN_SETS) {
            for (const column of set.columns) {
                expect(column.prompt).not.toMatch(
                    /\b(unfair|unreasonable|you should|we recommend|advise|is illegal|unenforceable)\b/i,
                );
            }
        }
    });
});

describe("starterColumnsFor", () => {
    it("numbers the columns from zero, in order", () => {
        const set = STARTER_COLUMN_SETS[0];
        const columns = starterColumnsFor(starterSetOptionValue(set));
        expect(columns?.map((column) => column.index)).toEqual(
            set.columns.map((_, index) => index),
        );
        expect(columns?.[0].name).toBe(set.columns[0].name);
    });

    it("returns null for a saved workflow id, so the caller falls through", () => {
        expect(starterColumnsFor("6f1c2d9e-0000-4000-8000-000000000000")).toBeNull();
        expect(starterColumnsFor("")).toBeNull();
        expect(starterColumnsFor(null)).toBeNull();
    });

    it("returns null for a prefixed id that no longer exists", () => {
        expect(starterColumnsFor(`${STARTER_SET_PREFIX}removed-set`)).toBeNull();
    });
});

describe("starterSetFor", () => {
    it("round-trips an option value back to its set", () => {
        for (const set of STARTER_COLUMN_SETS) {
            expect(starterSetFor(starterSetOptionValue(set))?.id).toBe(set.id);
        }
    });

    it("returns null for anything else", () => {
        expect(starterSetFor("bid-comparison")).toBeNull(); // unprefixed
        expect(starterSetFor(null)).toBeNull();
    });
});
