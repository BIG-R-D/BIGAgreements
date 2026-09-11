import Link from "next/link";
import { branding } from "@/app/lib/branding";

/**
 * AGPL-3.0 section 13 source offer.
 *
 * This application is a modified version of an AGPL-licensed work operated
 * over a network, so the people interacting with it must be offered its
 * corresponding source. Upstream shipped no such notice; see
 * docs/OPEN_SOURCE_COMPLIANCE.md.
 *
 * Rendered wherever a member can reach it without signing in — the notice is
 * owed to everyone who interacts with the service, not only to members.
 */
export function OpenSourceNotice({ className = "" }: { className?: string }) {
    return (
        <p className={`text-center text-xs text-gray-500 ${className}`}>
            {branding.productName} is built on free software.{" "}
            <Link
                href={branding.openSourceNoticeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
            >
                Source code
            </Link>
            .
        </p>
    );
}
