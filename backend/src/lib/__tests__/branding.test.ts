import { describe, expect, it } from "vitest";
import {
  productBranding,
  productName,
  validateBrandingConfiguration,
} from "../branding";

const base: NodeJS.ProcessEnv = {};

describe("productBranding", () => {
  it("defaults to the BIG Agreements brand", () => {
    const branding = productBranding(base);
    expect(branding.productName).toBe("BIG Agreements");
    expect(branding.supportEmail).toBe("support@bigapp.work");
    expect(branding.publicAppUrl).toBe("https://legal.bigapp.ai");
  });

  it("derives the short, assistant and document names from PRODUCT_NAME", () => {
    const branding = productBranding({ PRODUCT_NAME: "Acme Contracts" });
    expect(branding.productShortName).toBe("Acme Contracts");
    expect(branding.assistantName).toBe("Acme Contracts");
    expect(branding.documentAuthor).toBe("Acme Contracts");
  });

  it("lets each derived name be overridden independently", () => {
    const branding = productBranding({
      PRODUCT_NAME: "Acme Contracts",
      PRODUCT_SHORT_NAME: "Acme",
      PRODUCT_ASSISTANT_NAME: "Ace",
      PRODUCT_DOCUMENT_AUTHOR: "Acme Legal",
    });
    expect(branding.productShortName).toBe("Acme");
    expect(branding.assistantName).toBe("Ace");
    expect(branding.documentAuthor).toBe("Acme Legal");
  });

  it("ignores blank overrides rather than blanking the brand", () => {
    expect(productName({ PRODUCT_NAME: "   " })).toBe("BIG Agreements");
  });

  it("strips trailing slashes from URLs", () => {
    const branding = productBranding({
      PUBLIC_APP_URL: "https://agreements.example.com/",
      PRIMARY_BRAND_URL: "https://example.com///",
    });
    expect(branding.publicAppUrl).toBe("https://agreements.example.com");
    expect(branding.marketingUrl).toBe("https://example.com");
  });
});

describe("validateBrandingConfiguration", () => {
  it("accepts the defaults", () => {
    expect(() => validateBrandingConfiguration(base)).not.toThrow();
  });

  it("rejects a relative application URL", () => {
    expect(() =>
      validateBrandingConfiguration({ PUBLIC_APP_URL: "/agreements" }),
    ).toThrow(/PUBLIC_APP_URL must be an absolute URL/);
  });

  it("rejects a non-http protocol", () => {
    expect(() =>
      validateBrandingConfiguration({
        PRIMARY_BRAND_URL: "ftp://example.com",
      }),
    ).toThrow(/PRIMARY_BRAND_URL must use http or https/);
  });

  it("allows http outside production", () => {
    expect(() =>
      validateBrandingConfiguration({
        NODE_ENV: "development",
        PUBLIC_APP_URL: "http://localhost:3000",
      }),
    ).not.toThrow();
  });

  it("requires https for every URL in production", () => {
    expect(() =>
      validateBrandingConfiguration({
        NODE_ENV: "production",
        PUBLIC_APP_URL: "http://agreements.example.com",
      }),
    ).toThrow(/PUBLIC_APP_URL must use https in production/);
  });

  it("rejects a support address that is not an email", () => {
    expect(() =>
      validateBrandingConfiguration({ SUPPORT_EMAIL: "support" }),
    ).toThrow(/SUPPORT_EMAIL must be an email address/);
  });

  it("reports every problem at once", () => {
    expect(() =>
      validateBrandingConfiguration({
        PUBLIC_APP_URL: "nope",
        SUPPORT_EMAIL: "nope",
      }),
    ).toThrow(/PUBLIC_APP_URL[\s\S]*SUPPORT_EMAIL/);
  });
});
