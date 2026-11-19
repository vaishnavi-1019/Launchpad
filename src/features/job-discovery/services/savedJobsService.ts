const STORAGE_KEY = "launchpad.saved-jobs.v1";

export function loadSavedJobIds() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return [] as string[];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || parsed.some((id) => typeof id !== "string")) {
    throw new Error("Saved job data is invalid. Clear Launchpad site storage to reset it.");
  }
  return [...new Set(parsed)];
}

export function persistSavedJobIds(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown storage error";
    throw new Error(`Could not save your job wishlist: ${reason}`);
  }
}
