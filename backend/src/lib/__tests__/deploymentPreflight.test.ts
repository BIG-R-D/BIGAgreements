import { describe, expect, it } from "vitest";
import {
  preflightFindings,
  logPreflight,
} from "../deploymentPreflight";

const complete: NodeJS.ProcessEnv = {
  R2_ENDPOINT_URL: "https://acct.r2.cloudflarestorage.com",
  R2_ACCESS_KEY_ID: "id",
  R2_SECRET_ACCESS_KEY: "secret",
  DOWNLOAD_SIGNING_SECRET: "a".repeat(64),
  USER_API_KEYS_ENCRYPTION_SECRET: "b".repeat(64),
  GEMINI_API_KEY: "key",
};

describe("preflightFindings", () => {
  it("reports nothing when every subsystem is configured", () => {
    expect(preflightFindings(complete)).toEqual([]);
  });

  it("flags missing object storage as blocking and names the variables", () => {
    const { R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, ...env } = complete;
    void R2_ENDPOINT_URL;
    void R2_ACCESS_KEY_ID;
    const [finding] = preflightFindings(env);
    expect(finding.area).toBe("storage");
    expect(finding.severity).toBe("blocking");
    expect(finding.detail).toContain("R2_ENDPOINT_URL");
    expect(finding.detail).toContain("R2_ACCESS_KEY_ID");
    // The one already set must not be reported as missing.
    expect(finding.detail).not.toContain("R2_SECRET_ACCESS_KEY");
  });

  it("treats a missing model provider as degraded, not blocking", () => {
    // Members can still supply their own key via Bring Your Own Keys, so the
    // deployment is usable — refusing to boot would be worse than degrading.
    const { GEMINI_API_KEY, ...env } = complete;
    void GEMINI_API_KEY;
    const finding = preflightFindings(env).find((f) => f.area === "llm");
    expect(finding?.severity).toBe("degraded");
    expect(finding?.impact).toContain("Bring Your Own Keys");
  });

  it("accepts any one of the supported providers", () => {
    for (const key of [
      "ANTHROPIC_API_KEY",
      "OPENAI_API_KEY",
      "OPENROUTER_API_KEY",
      "AI_GATEWAY_API_KEY",
      "OPENCODE_API_KEY",
    ]) {
      const { GEMINI_API_KEY, ...rest } = complete;
      void GEMINI_API_KEY;
      const env = { ...rest, [key]: "key" };
      expect(preflightFindings(env).some((f) => f.area === "llm")).toBe(false);
    }
  });

  it("flags the lazily-read secrets", () => {
    const { DOWNLOAD_SIGNING_SECRET, ...env } = complete;
    void DOWNLOAD_SIGNING_SECRET;
    const finding = preflightFindings(env).find((f) => f.area === "secrets");
    expect(finding?.severity).toBe("blocking");
    expect(finding?.detail).toContain("DOWNLOAD_SIGNING_SECRET");
  });

  it("only requires the handoff secret when the Word add-in is configured", () => {
    expect(
      preflightFindings(complete).some((f) =>
        f.detail.includes("AUTH_HANDOFF_ENCRYPTION_SECRET"),
      ),
    ).toBe(false);
    expect(
      preflightFindings({
        ...complete,
        WORD_ADDIN_URL: "https://addin.example",
      }).some((f) => f.detail.includes("AUTH_HANDOFF_ENCRYPTION_SECRET")),
    ).toBe(true);
  });

  it("treats a blank value as unset", () => {
    expect(
      preflightFindings({ ...complete, R2_ACCESS_KEY_ID: "   " }).some(
        (f) => f.area === "storage",
      ),
    ).toBe(true);
  });
});

describe("logPreflight", () => {
  it("never throws, whatever the environment", () => {
    expect(() => logPreflight(complete)).not.toThrow();
    expect(() => logPreflight({})).not.toThrow();
  });
});
