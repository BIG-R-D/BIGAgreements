import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OnboardingPracticePage from "./page";

const { push, replace, completeOnboarding } = vi.hoisted(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    completeOnboarding: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push, replace }),
}));

vi.mock("@/app/contexts/AuthContext", () => ({
    useAuth: () => ({
        user: { id: "user-1", email: "alex@example.com" },
        authLoading: false,
    }),
}));

vi.mock("@/app/contexts/UserProfileContext", () => ({
    useUserProfile: () => ({
        profile: {
            jurisdiction: null,
            practiceSetting: null,
            professionalTitle: null,
            practiceAreas: [],
        },
        loading: false,
        completeOnboarding,
    }),
}));

vi.mock("@/app/components/site-logo", () => ({
    SiteLogo: () => <div>Mike</div>,
}));

describe("OnboardingPracticePage", () => {
    beforeEach(() => {
        push.mockReset();
        replace.mockReset();
        completeOnboarding.mockReset();
        completeOnboarding.mockResolvedValue(true);
    });

    it("saves a custom location and multiple trades", async () => {
        const user = userEvent.setup();
        render(<OnboardingPracticePage />);

        await user.click(
            screen.getByRole("button", {
                name: "Where you work",
            }),
        );
        await user.click(
            screen.getByRole("menuitemradio", { name: "Other" }),
        );
        await user.type(
            screen.getByRole("textbox", { name: "Somewhere else" }),
            "England and Wales",
        );
        await user.click(screen.getByRole("button", { name: "Your role" }));
        await user.click(
            screen.getByRole("menuitemradio", { name: "Site Supervisor" }),
        );
        await user.click(
            screen.getByRole("button", { name: "What kind of business" }),
        );
        await user.click(
            screen.getByRole("menuitemradio", { name: "General contractor" }),
        );
        await user.click(
            screen.getByRole("button", { name: "Select the work you do" }),
        );
        await user.click(
            screen.getByRole("menuitemcheckbox", { name: "Electrical" }),
        );
        await user.click(
            screen.getByRole("menuitemcheckbox", {
                name: "Plumbing",
            }),
        );
        await user.keyboard("{Escape}");
        await user.click(screen.getByRole("button", { name: "Finish" }));

        await waitFor(() =>
            expect(completeOnboarding).toHaveBeenCalledWith({
                jurisdiction: "England and Wales",
                practiceSetting: "general_contractor",
                professionalTitle: "Site Supervisor",
                practiceAreas: [
                    "Electrical",
                    "Plumbing",
                ],
            }),
        );
        expect(replace).toHaveBeenCalledWith("/assistant");
    });

    it("requires free text when Other is selected", async () => {
        const user = userEvent.setup();
        render(<OnboardingPracticePage />);

        await user.click(
            screen.getByRole("button", {
                name: "Where you work",
            }),
        );
        await user.click(
            screen.getByRole("menuitemradio", { name: "Georgia" }),
        );
        await user.click(
            screen.getByRole("button", { name: "What kind of business" }),
        );
        await user.click(
            screen.getByRole("menuitemradio", {
                name: "Subcontractor",
            }),
        );
        await user.click(
            screen.getByRole("button", { name: "Select the work you do" }),
        );
        await user.click(
            screen.getByRole("menuitemcheckbox", { name: "Other" }),
        );
        await user.keyboard("{Escape}");
        await user.click(screen.getByRole("button", { name: "Finish" }));

        expect(screen.getByRole("alert")).toHaveTextContent(
            "Enter the other type of work",
        );
        expect(completeOnboarding).not.toHaveBeenCalled();
    });

    it("allows personalisation to be skipped", async () => {
        const user = userEvent.setup();
        render(<OnboardingPracticePage />);

        await user.click(screen.getByRole("button", { name: "Skip" }));

        await waitFor(() =>
            expect(completeOnboarding).toHaveBeenCalledWith({}),
        );
        expect(replace).toHaveBeenCalledWith("/assistant");
    });
});
