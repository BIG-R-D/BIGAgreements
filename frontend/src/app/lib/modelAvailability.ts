import {
    MODELS,
    SETTINGS_MODELS,
    type ModelOption,
} from "../components/assistant/ModelToggle";
import type { ApiKeyState } from "@/app/lib/mikeApi";

export type ModelProvider =
    | "claude"
    | "gemini"
    | "openai"
    | "openrouter"
    | "vercel"
    | "opencode-go"
    | "ollama";

export function getModelProvider(modelId: string): ModelProvider | null {
    if (modelId.startsWith("ollama/")) return "ollama"; // dynamic, not in the static list
    if (modelId.startsWith("openrouter/")) return "openrouter";
    if (modelId.startsWith("vercel/")) return "vercel";
    if (modelId.startsWith("opencode-go/")) return "opencode-go";
    const model = SETTINGS_MODELS.find((m) => m.id === modelId);
    if (!model) return null;
    return modelGroupToProvider(model.group);
}

export function isModelAvailable(
    modelId: string,
    apiKeys: ApiKeyState,
): boolean {
    const provider = getModelProvider(modelId);
    if (!provider) return false;
    return isProviderAvailable(provider, apiKeys);
}

export function isProviderAvailable(
    provider: ModelProvider,
    apiKeys: ApiKeyState,
): boolean {
    if (provider === "ollama") return true; // local, no key needed
    return !!apiKeys[provider]?.configured;
}

/**
 * A model to use when the member has not chosen one.
 *
 * BIG members are contractors. Asking one to decide between "Claude Opus 4.7"
 * and "Claude Sonnet 4.6" before they can compare two bids is asking a question
 * they have no way to answer, and it blocked the create button until they
 * guessed. Model choice belongs in Settings for the people who care.
 *
 * No ranking is invented here: this walks MODELS in its existing order and
 * takes the first entry whose provider has a key. Missing key state means the
 * profile has not loaded or is degraded, and the caller should not be blocked
 * on that, so the first model wins — the same assumption the availability
 * check already makes elsewhere.
 */
export function defaultModelId(apiKeys?: ApiKeyState): string | null {
    for (const model of MODELS) {
        if (!apiKeys || isModelAvailable(model.id, apiKeys)) return model.id;
    }
    return null;
}

export function providerLabel(provider: ModelProvider): string {
    if (provider === "claude") return "Anthropic (Claude)";
    if (provider === "openai") return "OpenAI";
    if (provider === "openrouter") return "OpenRouter";
    if (provider === "vercel") return "Vercel AI Gateway";
    if (provider === "opencode-go") return "OpenCode Go";
    if (provider === "ollama") return "Local (Ollama)";
    return "Google (Gemini)";
}

export function modelGroupToProvider(
    group: ModelOption["group"],
): ModelProvider {
    if (group === "Anthropic") return "claude";
    if (group === "OpenAI") return "openai";
    if (group === "OpenRouter") return "openrouter";
    if (group === "Vercel AI Gateway") return "vercel";
    if (group === "OpenCode Go") return "opencode-go";
    if (group === "Local") return "ollama";
    return "gemini";
}
