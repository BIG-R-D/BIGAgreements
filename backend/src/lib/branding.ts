/**
 * BIG Agreements product branding.
 *
 * Single source of truth for every member-facing product name, URL and
 * address the backend emits. Upstream Mike hardcoded these as literals across
 * prompts, DOCX metadata, tracked-change authorship and permission errors;
 * each of those now reads from here so the member-facing brand is one
 * configuration change rather than a search-and-replace.
 *
 * Deliberately NOT covered here: internal identifiers (the `mike_workflows`
 * table, `MikeApiError`, the default storage bucket name). Renaming those buys
 * nothing a member can see and costs a merge conflict on every upstream sync.
 *
 * Open-source notice: AGPL-3.0 section 13 obliges a network-hosted modified
 * version to offer its source to the users interacting with it.
 * `openSourceNoticeUrl` is where that offer points, and it is required in
 * production for that reason — see docs/OPEN_SOURCE_COMPLIANCE.md.
 */

export interface ProductBranding {
  /** Full member-facing product name. */
  productName: string;
  /** Short form for tight surfaces (tracked-change authorship, logos). */
  productShortName: string;
  /** Name the AI assistant uses for itself in conversation. */
  assistantName: string;
  /** Author/creator recorded in generated DOCX metadata and tracked changes. */
  documentAuthor: string;
  /** Where members reach support. */
  supportEmail: string;
  /** Public origin of the deployed application. */
  publicAppUrl: string;
  /** Marketing/landing site the logo links to. */
  marketingUrl: string;
  /** Short legal line rendered in the application footer. */
  legalFooter: string;
  /** Where the corresponding source is offered, per AGPL-3.0 section 13. */
  openSourceNoticeUrl: string;
}

const DEFAULTS: ProductBranding = {
  productName: "BIG Agreements",
  productShortName: "BIG Agreements",
  assistantName: "BIG Agreements",
  documentAuthor: "BIG Agreements",
  supportEmail: "support@bigapp.work",
  publicAppUrl: "https://legal.bigapp.ai",
  marketingUrl: "https://bigapp.work",
  legalFooter: "BIG R/D",
  openSourceNoticeUrl: "https://github.com/BIG-R-D/BIGAgreements",
};

function value(
  env: NodeJS.ProcessEnv,
  name: string,
  fallback: string,
): string {
  return env[name]?.trim() || fallback;
}

export function productBranding(
  env: NodeJS.ProcessEnv = process.env,
): ProductBranding {
  const productName = value(env, "PRODUCT_NAME", DEFAULTS.productName);
  return {
    productName,
    // The short name and assistant name default to the product name so a
    // deployment only has to set PRODUCT_NAME to be coherent everywhere.
    productShortName: value(env, "PRODUCT_SHORT_NAME", productName),
    assistantName: value(env, "PRODUCT_ASSISTANT_NAME", productName),
    documentAuthor: value(env, "PRODUCT_DOCUMENT_AUTHOR", productName),
    supportEmail: value(env, "SUPPORT_EMAIL", DEFAULTS.supportEmail),
    publicAppUrl: value(env, "PUBLIC_APP_URL", DEFAULTS.publicAppUrl).replace(
      /\/+$/,
      "",
    ),
    marketingUrl: value(env, "PRIMARY_BRAND_URL", DEFAULTS.marketingUrl).replace(
      /\/+$/,
      "",
    ),
    legalFooter: value(env, "LEGAL_FOOTER", DEFAULTS.legalFooter),
    openSourceNoticeUrl: value(
      env,
      "OPEN_SOURCE_NOTICE_URL",
      DEFAULTS.openSourceNoticeUrl,
    ),
  };
}

/** Convenience for the many call sites that only need the display name. */
export function productName(env: NodeJS.ProcessEnv = process.env): string {
  return productBranding(env).productName;
}

/**
 * Startup validation for the branding block. Kept separate from
 * validateRuntimeConfiguration so the branding contract is testable on its own
 * and so a branding mistake reports as a branding mistake.
 */
export function validateBrandingConfiguration(
  env: NodeJS.ProcessEnv = process.env,
): void {
  const errors: string[] = [];
  const branding = productBranding(env);

  for (const [name, raw] of [
    ["PUBLIC_APP_URL", branding.publicAppUrl],
    ["PRIMARY_BRAND_URL", branding.marketingUrl],
    ["OPEN_SOURCE_NOTICE_URL", branding.openSourceNoticeUrl],
  ] as const) {
    try {
      const url = new URL(raw);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        errors.push(`${name} must use http or https`);
      } else if (env.NODE_ENV === "production" && url.protocol !== "https:") {
        errors.push(`${name} must use https in production`);
      }
    } catch {
      errors.push(`${name} must be an absolute URL`);
    }
  }

  if (!branding.supportEmail.includes("@")) {
    errors.push("SUPPORT_EMAIL must be an email address");
  }

  if (errors.length > 0) {
    throw new Error(
      `Product branding configuration is invalid:\n- ${errors.join("\n- ")}`,
    );
  }
}
