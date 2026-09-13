import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const persistChatModelSelection = vi.hoisted(() => vi.fn(async () => true));

vi.mock("@/app/hooks/useOllamaModels", () => ({
    useOllamaModels: () => [],
}));

vi.mock("@/app/contexts/UserProfileContext", () => ({
    useUserProfile: () => ({
        profile: {
            // Legacy id stored before the catalog rename.
            titleModel: "gemini-3.1-flash-lite-preview",
            tabularModel: "gemini-3-flash-preview",
            openRouterModels: [],
            vercelModels: [],
            openCodeGoModels: [],
            apiKeys: {
                claude: { configured: false, source: null },
                gemini: { configured: true, source: "user" },
                openai: { configured: true, source: "user" },
                openrouter: { configured: false, source: null },
                vercel: { configured: false, source: null },
                "opencode-go": { configured: false, source: null },
                courtlistener: { configured: false, source: null },
            },
        },
        updateModelPreference: vi.fn(),
        persistChatModelSelection,
    }),
}));

import ModelPreferencesPage from "./page";

describe("model preferences page legacy ids", () => {
    it("shows the renamed model for a stored legacy preference", () => {
        render(<ModelPreferencesPage />);

        // Without the LEGACY_MODEL_IDS mapping the stored title value
        // matches no option and the dropdown falls back to "Select a model".
        expect(screen.getByText("Gemini 3.5 Flash-Lite")).toBeInTheDocument();
        expect(screen.queryByText("Select a model")).not.toBeInTheDocument();
    });
});

describe("assistant model preference", () => {
    beforeEach(() => persistChatModelSelection.mockReset().mockResolvedValue(true));

    it("saves the selected model as a profile default", async () => {
        const user = userEvent.setup();
        render(<ModelPreferencesPage />);
        await user.click(screen.getByRole("button", { name: "Assistant model" }));
        await user.click(screen.getByRole("menuitem", { name: "GPT-5.6 Sol" }));
        await waitFor(() => expect(persistChatModelSelection).toHaveBeenCalledWith("gpt-5.6-sol"));
        expect(screen.getByRole("button", { name: "Assistant model" })).toHaveTextContent("GPT-5.6 Sol");
    });

    it("allows returning to automatic selection", async () => {
        const user = userEvent.setup();
        render(<ModelPreferencesPage />);
        await user.click(screen.getByRole("button", { name: "Assistant model" }));
        await user.click(screen.getByRole("menuitem", { name: "Automatic" }));
        await waitFor(() => expect(persistChatModelSelection).toHaveBeenCalledWith(""));
    });

    it("reports a failed save and restores the current preference", async () => {
        persistChatModelSelection.mockResolvedValue(false);
        const user = userEvent.setup();
        render(<ModelPreferencesPage />);
        await user.click(screen.getByRole("button", { name: "Assistant model" }));
        await user.click(screen.getByRole("menuitem", { name: "GPT-5.6 Sol" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Couldn’t save");
        expect(screen.getByRole("button", { name: "Assistant model" })).toHaveTextContent("Automatic");
    });
});
