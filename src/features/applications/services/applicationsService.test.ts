import { describe, expect, it } from "vitest";
import {
  changeApplicationStatus,
  createApplication,
  updateApplication,
} from "./applicationsService";
import type { ApplicationDraft } from "../types";

const draft: ApplicationDraft = {
  company: "Northstar",
  role: "Frontend Engineer",
  status: "wishlist",
  tags: ["React"],
};

describe("application service", () => {
  it("creates an application with an initial activity event", () => {
    const [application] = createApplication([], draft);

    expect(application).toMatchObject({
      company: "Northstar",
      role: "Frontend Engineer",
      status: "wishlist",
      tags: ["React"],
    });
    expect(application?.activity).toHaveLength(1);
    expect(application?.activity[0]?.type).toBe("created");
  });

  it("records status changes and sets the application date", () => {
    const [created] = createApplication([], draft);
    expect(created).toBeDefined();
    if (!created) return;

    const [updated] = changeApplicationStatus([created], created.id, "applied");

    expect(updated?.status).toBe("applied");
    expect(updated?.appliedAt).toBeTruthy();
    expect(updated?.activity.at(-1)?.type).toBe("status_changed");
  });

  it("records note edits without mutating the original record", () => {
    const [created] = createApplication([], draft);
    expect(created).toBeDefined();
    if (!created) return;

    const updated = updateApplication([created], created.id, {
      ...draft,
      notes: "Follow up next week",
    })[0];

    expect(updated?.notes).toBe("Follow up next week");
    expect(updated?.activity.at(-1)?.type).toBe("notes_updated");
    expect(created.notes).toBeUndefined();
  });
});
