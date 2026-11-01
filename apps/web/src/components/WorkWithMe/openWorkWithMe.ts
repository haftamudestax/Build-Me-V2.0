export type WorkWithMePath = "delivery" | "mentor" | "coffee";

export const OPEN_WORK_WITH_ME_EVENT = "build-me:open-work-with-me";

export interface OpenWorkWithMeDetail {
  /** Path to open directly. Omit to open the paths view. */
  path?: WorkWithMePath;
}

/**
 * Asks the Work With Me modal to open, optionally on one of its paths.
 * WorkWithMeModal listens for this event, so callers do not need a reference
 * to it.
 */
export function openWorkWithMe(path?: WorkWithMePath): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<OpenWorkWithMeDetail>(OPEN_WORK_WITH_ME_EVENT, {
      detail: { path },
    }),
  );
}
