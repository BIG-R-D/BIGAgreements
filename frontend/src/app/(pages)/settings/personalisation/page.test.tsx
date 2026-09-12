import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PersonalisationPage from "./page";

const { updatePersonalisation } = vi.hoisted(() => ({
    updatePersonalisation: vi.fn(),
}));

vi.mock("@/app/contexts/UserProfileContext", () => ({
    useUserProfile: () => ({
        profile: {
            jurisdiction: "Alabama",
            practiceSetting: "general_contractor",
            professionalTitle: "Foreman",
            practiceAreas: [],
        },
        updatePersonalisation,
    }),
}));

describe("PersonalisationPage", () => {
    beforeEach(() => {
        updatePersonalisation.mockReset();
        updatePersonalisation.mockResolvedValue(true);
    });

    it("updates the user's professional profile", async () => {
        const user = userEvent.setup();
        render(<PersonalisationPage />);

        await user.click(screen.getByRole("button", { name: "Your role" }));
        await user.click(
            screen.getByRole("menuitemradio", { name: "Site Supervisor" }),
        );
        await user.click(
            screen.getByRole("button", { name: "What kind of business" }),
        );
        await user.click(
            screen.getByRole("menuitemradio", { name: "Subcontractor" }),
        );
        await user.click(
            screen.getByRole("button", { name: "Where you work" }),
        );
        await user.click(
            screen.getByRole("menuitemradio", { name: "Georgia" }),
        );
        await user.click(
            screen.getByRole("button", { name: "Work you do" }),
        );
        const practiceAreaOption = screen.getByRole("menuitemcheckbox", {
            name: "Plumbing",
        });
        expect(practiceAreaOption).toHaveClass(
            "text-xs",
            "pl-3",
            "theme-dropdown-item",
        );
        expect(practiceAreaOption).not.toHaveClass("pl-8");
        await user.click(practiceAreaOption);
        await user.keyboard("{Escape}");
        await waitFor(() =>
            expect(updatePersonalisation).toHaveBeenCalledWith({
                jurisdiction: "Georgia",
                practiceSetting: "subcontractor",
                professionalTitle: "Site Supervisor",
                practiceAreas: ["Plumbing"],
            }),
        );
        expect(screen.getByText("Work you do").parentElement).toHaveTextContent(
            "Saved",
        );
        expect(screen.queryByText("(optional)")).not.toBeInTheDocument();
    });

    it("still saves unrelated fields while an Other box is empty, and says why", async () => {
        const user = userEvent.setup();
        render(<PersonalisationPage />);

        await user.click(
            screen.getByRole("button", { name: "Work you do" }),
        );
        await user.click(screen.getByRole("menuitemcheckbox", { name: "Other" }));
        await user.keyboard("{Escape}");
        expect(
            screen.getByText("Enter the other type of work"),
        ).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Your role" }));
        await user.click(screen.getByRole("menuitemradio", { name: "Owner" }));
        await waitFor(() =>
            expect(updatePersonalisation).toHaveBeenCalledWith({
                jurisdiction: "Alabama",
                practiceSetting: "general_contractor",
                professionalTitle: "Owner",
                // The half-finished Other box falls back to the stored areas.
                practiceAreas: [],
            }),
        );
    });

    it("does not drop an earlier pending edit when an Other box turns invalid", async () => {
        const user = userEvent.setup();
        const { unmount } = render(<PersonalisationPage />);

        // Title edit is pending (still inside the debounce window)...
        await user.click(screen.getByRole("button", { name: "Your role" }));
        await user.click(screen.getByRole("menuitemradio", { name: "Owner" }));
        // ...when the user ticks "Other" and leaves it empty.
        await user.click(
            screen.getByRole("button", { name: "Work you do" }),
        );
        await user.click(screen.getByRole("menuitemcheckbox", { name: "Other" }));
        await user.keyboard("{Escape}");

        unmount(); // flush: the Title change must survive
        await waitFor(() =>
            expect(updatePersonalisation).toHaveBeenCalledWith({
                jurisdiction: "Alabama",
                practiceSetting: "general_contractor",
                professionalTitle: "Owner",
                practiceAreas: [],
            }),
        );
    });

    it("flushes a save that is still inside its debounce window on unmount", async () => {
        const user = userEvent.setup();
        const { unmount } = render(<PersonalisationPage />);

        await user.click(screen.getByRole("button", { name: "Your role" }));
        await user.click(screen.getByRole("menuitemradio", { name: "Owner" }));
        expect(updatePersonalisation).not.toHaveBeenCalled();

        unmount();
        await waitFor(() =>
            expect(updatePersonalisation).toHaveBeenCalledWith(
                expect.objectContaining({ professionalTitle: "Owner" }),
            ),
        );
    });
});
