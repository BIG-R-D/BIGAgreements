/**
 * Deployment preflight.
 *
 * `validateRuntimeConfiguration()` covers the authentication boundary and
 * exits the process when it is unusable. Everything else fails lazily, at the
 * moment a member first tries to use it — which in practice means a
 * misconfigured deployment looks healthy (`/health` returns ok, login works)
 * and then breaks mid-demo with a generic "please try again".
 *
 * Concretely, this has already happened on this project:
 *   - R2 unset      -> every document operation fails, boot is silent
 *   - no LLM key    -> every prompt fails, boot is silent
 *   - unfunded key  -> every prompt fails, boot is silent
 *
 * So this reports the gaps at startup instead. It deliberately does NOT exit:
 * a deployment with no model provider is still a useful deployment (members
 * can sign in, upload, read), and refusing to boot would turn a degraded
 * service into an outage. Warnings go to the log; the same data is exposed on
 * /readiness for a human or a smoke test to read.
 */

export interface PreflightFinding {
  area: "storage" | "llm" | "secrets" | "integration";
  severity: "blocking" | "degraded";
  detail: string;
  /** What stops working for a member while this is unresolved. */
  impact: string;
}

const LLM_KEYS = [
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
  "OPENAI_API_KEY",
  "OPENROUTER_API_KEY",
  "AI_GATEWAY_API_KEY",
  "OPENCODE_API_KEY",
] as const;

export function preflightFindings(
  env: NodeJS.ProcessEnv = process.env,
): PreflightFinding[] {
  const findings: PreflightFinding[] = [];
  const set = (name: string) => Boolean(env[name]?.trim());

  // --- Object storage -------------------------------------------------------
  const storageVars = [
    "R2_ENDPOINT_URL",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
  ];
  const missingStorage = storageVars.filter((n) => !set(n));
  if (missingStorage.length > 0) {
    findings.push({
      area: "storage",
      severity: "blocking",
      detail: `Object storage is not configured (missing ${missingStorage.join(", ")}).`,
      impact:
        "Document upload, generation, download and versions all fail. For an agreements product this is everything.",
    });
  }

  // --- Model providers ------------------------------------------------------
  // Members can supply their own key via Settings -> Bring Your Own Keys, so a
  // deployment without a server key is degraded rather than broken.
  const providers = LLM_KEYS.filter((n) => set(n));
  if (providers.length === 0) {
    findings.push({
      area: "llm",
      severity: "degraded",
      detail: "No model provider key is configured on the server.",
      impact:
        "Prompts, generation and translation fail for every member who has not added their own key under Settings -> Bring Your Own Keys.",
    });
  }

  // --- Secrets that are only read on first use -----------------------------
  if (!set("DOWNLOAD_SIGNING_SECRET")) {
    findings.push({
      area: "secrets",
      severity: "blocking",
      detail: "DOWNLOAD_SIGNING_SECRET is not set.",
      impact: "Every document download link fails to sign.",
    });
  }
  if (!set("USER_API_KEYS_ENCRYPTION_SECRET")) {
    findings.push({
      area: "secrets",
      severity: "blocking",
      detail: "USER_API_KEYS_ENCRYPTION_SECRET is not set.",
      impact:
        "Bring Your Own Keys cannot store or read a member's provider key.",
    });
  }
  if (set("WORD_ADDIN_URL") && !set("AUTH_HANDOFF_ENCRYPTION_SECRET")) {
    findings.push({
      area: "secrets",
      severity: "blocking",
      detail:
        "WORD_ADDIN_URL is set but AUTH_HANDOFF_ENCRYPTION_SECRET is not.",
      impact: "Session handoff cannot issue tickets.",
    });
  }

  return findings;
}

/** One-line-per-finding startup report. Never throws, never exits. */
export function logPreflight(env: NodeJS.ProcessEnv = process.env): void {
  const findings = preflightFindings(env);
  if (findings.length === 0) {
    console.log("[preflight] all optional subsystems configured");
    return;
  }
  for (const f of findings) {
    const tag = f.severity === "blocking" ? "BLOCKING" : "degraded";
    console.warn(`[preflight] ${tag} (${f.area}): ${f.detail} — ${f.impact}`);
  }
}
