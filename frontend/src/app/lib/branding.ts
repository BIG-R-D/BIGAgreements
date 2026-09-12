/**
 * BIG Agreements product branding for the web application.
 *
 * Mirrors `backend/src/big/config/branding.ts`. Kept as a separate module
 * rather than imported across the app/backend boundary because Next.js inlines
 * `process.env.NEXT_PUBLIC_*` at build time, so these values must be literal
 * property reads for the client bundle to receive them.
 *
 * Only member-facing surfaces read from here. Internal identifiers
 * (`MikeApiError`, `MikeIcon`, `mikeApi`) keep their upstream names on purpose:
 * renaming them changes nothing a member sees and costs a merge conflict on
 * every upstream sync.
 */

export interface ProductBranding {
    /** Full member-facing product name. */
    productName: string;
    /** Short form for tight surfaces such as the sidebar and logo. */
    productShortName: string;
    /** Name the AI assistant uses for itself. */
    assistantName: string;
    /** Marketing site the logo links to. */
    marketingUrl: string;
    /** Public origin of this application, used for metadata and share cards. */
    publicAppUrl: string;
    /** Where members reach support. */
    supportEmail: string;
    /** Short legal line rendered in the footer. */
    legalFooter: string;
    /** Source offer required by AGPL-3.0 section 13. */
    openSourceNoticeUrl: string;
    /** BIG's own terms of use. */
    termsUrl: string;
    /** BIG's own privacy policy. */
    privacyUrl: string;
    /** One-line description used in page metadata and share cards. */
    description: string;
    /** Brand logo served from /public. Swap the file, not the code. */
    logoUrl: string;
}

const productName = process.env.NEXT_PUBLIC_PRODUCT_NAME || "BIG Agreements";

export const branding: ProductBranding = {
    productName,
    productShortName: process.env.NEXT_PUBLIC_PRODUCT_SHORT_NAME || productName,
    assistantName: process.env.NEXT_PUBLIC_PRODUCT_ASSISTANT_NAME || productName,
    marketingUrl:
        process.env.NEXT_PUBLIC_PRIMARY_BRAND_URL || "https://bigapp.work",
    publicAppUrl:
        process.env.NEXT_PUBLIC_PUBLIC_APP_URL ||
        "https://legal.bigapp.ai",
    supportEmail:
        process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@bigapp.work",
    legalFooter: process.env.NEXT_PUBLIC_LEGAL_FOOTER || "BIG R/D",
    openSourceNoticeUrl:
        process.env.NEXT_PUBLIC_OPEN_SOURCE_NOTICE_URL ||
        "https://github.com/BIG-R-D/BIGAgreements",
    termsUrl:
        process.env.NEXT_PUBLIC_TERMS_URL || "https://bigapp.work/terms",
    privacyUrl:
        process.env.NEXT_PUBLIC_PRIVACY_URL || "https://bigapp.work/privacy",
    description:
        process.env.NEXT_PUBLIC_PRODUCT_DESCRIPTION ||
        "Generate, review and translate agreements for BIG members.",
    logoUrl: process.env.NEXT_PUBLIC_PRODUCT_LOGO || "/big-logo.png",
};
