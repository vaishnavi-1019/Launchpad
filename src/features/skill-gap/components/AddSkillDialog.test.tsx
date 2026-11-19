import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddSkillDialog } from "./AddSkillDialog";

afterEach(cleanup);

describe("AddSkillDialog", () => {
  it("focuses the skill field, traps focus, and closes on Escape", async () => {
    const user = userEvent.setup();
    const trigger = document.createElement("button");
    trigger.textContent = "Open skill dialog";
    document.body.append(trigger);
    trigger.focus();
    const onClose = vi.fn();

    const { unmount } = render(
      <AddSkillDialog onClose={onClose} onSave={vi.fn()} />,
    );
    const nameField = screen.getByPlaceholderText("e.g. React");

    expect(document.activeElement).toBe(nameField);
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Close dialog" }),
    );
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Add skill" }),
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();

    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
