import { AlertCircle, Check, Loader2 } from "lucide-react";

/**
 * Neutral generating/done/error indicator for assistant responses.
 *
 * Replaces upstream's branded starburst. It is deliberately unbranded: this is
 * a status affordance, not a logo. A flat multicolour brand mark cannot spin
 * or recolour for an error state without looking broken, so the brand lives on
 * brand surfaces (BrandLogo) and this carries the state.
 *
 * Idle renders nothing rather than a resting icon — with no branding to show,
 * a permanent dot beside every message is noise.
 */
export function ResponseIndicator({
    state,
    size = 18,
}: {
    state: "active" | "done" | "error" | null;
    size?: number;
}) {
    if (state === null) return null;

    if (state === "error") {
        return (
            <AlertCircle
                size={size}
                className="shrink-0 text-red-600"
                aria-label="Response failed"
                role="img"
            />
        );
    }

    if (state === "done") {
        return (
            <Check
                size={size}
                className="shrink-0 text-gray-500"
                aria-label="Response complete"
                role="img"
            />
        );
    }

    return (
        <Loader2
            size={size}
            className="shrink-0 animate-spin text-gray-400"
            aria-label="Generating a response"
            role="img"
        />
    );
}
