import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUserProfile } from "@/app/contexts/UserProfileContext";
import { ChatInput } from "./ChatInput";

vi.mock("@/app/lib/mikeApi", () => ({
    listWorkflows: vi.fn(async () => []),
    uploadProjectDocument: vi.fn(),
    uploadStandaloneDocument: vi.fn(),
}));

vi.mock("@/app/contexts/UserProfileContext", () => ({
    useUserProfile: vi.fn(),
}));

vi.mock("./AddDocButton", () => ({ AddDocButton: () => null }));
vi.mock("./UploadOverlay", () => ({ UploadOverlay: () => null }));
vi.mock("../shared/FileTypeIcon", () => ({ FileTypeIcon: () => null }));
vi.mock("../modals/AddDocumentsModal", () => ({
    AddDocumentsModal: () => null,
}));
vi.mock("./AssistantWorkflowModal", () => ({
    AssistantWorkflowModal: () => null,
}));
vi.mock("../popups/ApiKeyMissingPopup", () => ({
    ApiKeyMissingPopup: () => null,
}));

const STORED = "openrouter/pricy/frontier";
const persistChatModelSelection = vi.fn(async () => true);
const persistChatReasoningSelection = vi.fn(async () => true);

class ResizeObserverMock {
    observe() {}
    disconnect() {}
}

function emptyApiKeys() {
    return {
        claude: { configured: false, source: null },
        gemini: { configured: false, source: null },
        openai: { configured: true, source: "server" },
        openrouter: { configured: false, source: null },
        vercel: { configured: false, source: null },
        courtlistener: { configured: false, source: null },
    };
}

function mockProfile(apiKeysDegraded: boolean) {
    vi.mocked(useUserProfile).mockReturnValue({
        profile: {
            openRouterModels: [],
            vercelModels: [],
            openCodeGoModels: [],
            lastSelectedChatModel: "gpt-5.6-luna",
            lastSelectedReasoningLevel: "high",
            apiKeys: emptyApiKeys(),
        },
        loading: false,
        apiKeysDegraded,
        persistChatModelSelection,
        persistChatReasoningSelection,
    } as unknown as ReturnType<typeof useUserProfile>);
}

describe("ChatInput model selection vs. a degraded profile", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    });

    it.each([undefined, "chat-1", "tabular-review-chat:review-1:chat-1"])(
        "sends using saved settings without exposing a picker (%s)", async (chatKey) => {
            mockProfile(true);
            const onSubmit = vi.fn();
            render(<ChatInput chatKey={chatKey} chatModel="gpt-5.6-luna"
                chatReasoningLevel="high" onSubmit={onSubmit}
                onCancel={vi.fn()} isLoading={false} />);
            expect(screen.queryByRole("button", { name: "Choose model" })).not.toBeInTheDocument();
            fireEvent.change(screen.getByRole("combobox"), { target: { value: "hello" } });
            fireEvent.click(screen.getByRole("button", { name: "Send message" }));
            await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({ model: "gpt-5.6-luna" }),
            ));
            expect(persistChatModelSelection).not.toHaveBeenCalled();
        },
    );

    it("keeps the chat model when router availability is unknown", async () => {
        mockProfile(true);
        const onSubmit = vi.fn();

        render(
            <ChatInput
                chatModel={STORED}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
                isLoading={false}
            />,
        );

        fireEvent.change(screen.getByRole("combobox"), {
            target: { value: "hello" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Send message" }));
        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({ model: STORED }),
            ),
        );
    });

    it("falls back to profile last-selected when the chat router model is stale", async () => {
        mockProfile(false);
        const onSubmit = vi.fn();

        render(
            <ChatInput
                chatModel={STORED}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
                isLoading={false}
            />,
        );

        fireEvent.change(screen.getByRole("combobox"), {
            target: { value: "hello" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Send message" }));
        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({ model: "gpt-5.6-luna" }),
            ),
        );
    });
});
