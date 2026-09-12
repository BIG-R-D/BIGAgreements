import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `branding` is built once at module load from `process.env`, because Next.js
 * inlines `NEXT_PUBLIC_*` at build time. Each case therefore stubs the
 * environment, resets the module registry, and re-imports so the constant is
 * rebuilt — covering both sides of every `||` fallback.
 */
async function loadBranding(env: Record<string, string> = {}) {
    vi.resetModules();
    for (const [key, value] of Object.entries(env)) {
        vi.stubEnv(key, value);
    }
    return (await import("./branding")).branding;
}

afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
});

describe("branding defaults", () => {
    it("falls back to the BIG Agreements brand when nothing is configured", async () => {
        const branding = await loadBranding();
        expect(branding.productName).toBe("BIG Agreements");
        expect(branding.productShortName).toBe("BIG Agreements");
        expect(branding.assistantName).toBe("BIG Agreements");
        expect(branding.marketingUrl).toBe("https://bigapp.work");
        expect(branding.publicAppUrl).toBe("https://legal.bigapp.ai");
        expect(branding.supportEmail).toBe("support@bigapp.work");
        expect(branding.legalFooter).toBe("BIG R/D");
        expect(branding.termsUrl).toBe("https://bigapp.work/terms");
        expect(branding.privacyUrl).toBe("https://bigapp.work/privacy");
        expect(branding.description).toContain("agreements");
        expect(branding.logoUrl).toBe("/big-logo.png");
    });

    it("points the open-source notice at the source repository", async () => {
        // AGPL-3.0 section 13: network users must be offered the source.
        const branding = await loadBranding();
        expect(branding.openSourceNoticeUrl).toBe(
            "https://github.com/BIG-R-D/BIGAgreements",
        );
    });
});

describe("branding overrides", () => {
    it("derives the short and assistant names from PRODUCT_NAME", async () => {
        const branding = await loadBranding({
            NEXT_PUBLIC_PRODUCT_NAME: "Acme Contracts",
        });
        expect(branding.productName).toBe("Acme Contracts");
        expect(branding.productShortName).toBe("Acme Contracts");
        expect(branding.assistantName).toBe("Acme Contracts");
    });

    it("lets every value be overridden independently", async () => {
        const branding = await loadBranding({
            NEXT_PUBLIC_PRODUCT_NAME: "Acme Contracts",
            NEXT_PUBLIC_PRODUCT_SHORT_NAME: "Acme",
            NEXT_PUBLIC_PRODUCT_ASSISTANT_NAME: "Ace",
            NEXT_PUBLIC_PRODUCT_DESCRIPTION: "Contracts, quickly.",
            NEXT_PUBLIC_PRIMARY_BRAND_URL: "https://acme.example",
            NEXT_PUBLIC_PUBLIC_APP_URL: "https://app.acme.example",
            NEXT_PUBLIC_SUPPORT_EMAIL: "help@acme.example",
            NEXT_PUBLIC_LEGAL_FOOTER: "Acme Inc",
            NEXT_PUBLIC_OPEN_SOURCE_NOTICE_URL: "https://acme.example/source",
            NEXT_PUBLIC_TERMS_URL: "https://acme.example/terms",
            NEXT_PUBLIC_PRIVACY_URL: "https://acme.example/privacy",
            NEXT_PUBLIC_PRODUCT_LOGO: "/acme-logo.svg",
        });
        expect(branding).toEqual({
            productName: "Acme Contracts",
            productShortName: "Acme",
            assistantName: "Ace",
            description: "Contracts, quickly.",
            marketingUrl: "https://acme.example",
            publicAppUrl: "https://app.acme.example",
            supportEmail: "help@acme.example",
            legalFooter: "Acme Inc",
            openSourceNoticeUrl: "https://acme.example/source",
            termsUrl: "https://acme.example/terms",
            privacyUrl: "https://acme.example/privacy",
            logoUrl: "/acme-logo.svg",
        });
    });

    it("treats an empty override as unset rather than blanking the brand", async () => {
        const branding = await loadBranding({ NEXT_PUBLIC_PRODUCT_NAME: "" });
        expect(branding.productName).toBe("BIG Agreements");
    });
});
