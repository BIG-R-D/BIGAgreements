import Image from "next/image";
import { branding } from "@/app/lib/branding";

/**
 * The BIG Agreements brand mark.
 *
 * Deliberately separate from status indication. A flat multicolour logo cannot
 * spin or recolour for an error without looking broken, so brand surfaces use
 * this and assistant status uses `ResponseIndicator`. Upstream's `MikeIcon`
 * conflated the two jobs and no longer renders anywhere.
 *
 * The file itself is `public/big-logo.png` by default and is swappable without
 * touching code — set NEXT_PUBLIC_PRODUCT_LOGO (build-time, like every
 * NEXT_PUBLIC_ value).
 */
export function BrandLogo({
    size = 24,
    className = "",
}: {
    size?: number;
    className?: string;
}) {
    return (
        <Image
            src={branding.logoUrl}
            alt={`${branding.productName} logo`}
            width={size}
            height={size}
            className={`shrink-0 object-contain ${className}`}
            // A logo is above the fold on the login screen and in the sidebar;
            // lazy-loading it causes a visible pop on first paint.
            priority
            unoptimized={branding.logoUrl.endsWith(".svg")}
        />
    );
}
