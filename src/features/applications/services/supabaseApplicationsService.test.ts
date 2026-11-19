import { createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/lib/database.types";
import type { JobApplication } from "../types";
import { importLocalApplicationsToSupabase } from "./supabaseApplicationsService";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("importLocalApplicationsToSupabase", () => {
  it("does not insert rows if the retry map cannot be persisted", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response("[]", {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Range": "*/0",
        },
      }),
    );
    const client = createClient<Database>(
      "https://launchpad-test.supabase.co",
      "test-public-key",
      { auth: { persistSession: false }, global: { fetch: fetchMock } },
    );
    const application: JobApplication = {
      id: "123e4567-e89b-42d3-a456-426614174000",
      company: "Northstar",
      role: "Frontend Engineer",
      status: "wishlist",
      createdAt: "2026-11-19T10:00:00.000Z",
      tags: [],
      activity: [],
    };
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
      if (key.startsWith("launchpad.supabase.application-id-map.v1:")) {
        throw new Error("storage full");
      }
      originalSetItem.call(localStorage, key, value);
    });

    await expect(
      importLocalApplicationsToSupabase(client, "test-user", [application]),
    ).rejects.toThrow("Could not save the application migration map");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[1]?.method).not.toBe("POST");
  });
});
