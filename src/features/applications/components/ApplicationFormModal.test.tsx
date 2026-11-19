import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApplicationFormModal } from "./ApplicationFormModal";

afterEach(cleanup);

describe("ApplicationFormModal", () => {
  it("blocks submission until required fields are filled", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(true);

    render(<ApplicationFormModal onClose={vi.fn()} onSave={onSave} />);

    const company = screen.getByPlaceholderText("e.g. Acme");
    const jobTitle = screen.getByPlaceholderText("e.g. Product Designer");
    expect(company instanceof HTMLInputElement && company.required).toBe(true);
    expect(jobTitle instanceof HTMLInputElement && jobTitle.required).toBe(true);
    await user.click(screen.getByRole("button", { name: "Add application" }));

    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves valid values and closes after success", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();

    render(<ApplicationFormModal onClose={onClose} onSave={onSave} />);
    await user.type(screen.getByPlaceholderText("e.g. Acme"), "Northstar");
    await user.type(screen.getByPlaceholderText("e.g. Product Designer"), "Frontend Engineer");
    await user.click(screen.getByRole("button", { name: "Add application" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({
      company: "Northstar",
      role: "Frontend Engineer",
      status: "applied",
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("traps keyboard focus and restores it when closed", async () => {
    const user = userEvent.setup();
    const trigger = document.createElement("button");
    trigger.textContent = "Open application form";
    document.body.append(trigger);
    trigger.focus();

    const { unmount } = render(
      <ApplicationFormModal onClose={vi.fn()} onSave={vi.fn()} />,
    );

    expect(document.activeElement).toBe(
      screen.getByPlaceholderText("e.g. Acme"),
    );
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Add application" }),
    );

    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
