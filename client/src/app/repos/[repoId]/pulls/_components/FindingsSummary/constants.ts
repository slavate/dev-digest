import type { Severity } from "@devdigest/shared";

/** Severity levels in display order; mirrors the `Severity` enum in @devdigest/shared. */
export const SEVERITIES: readonly Severity[] = ["CRITICAL", "WARNING", "SUGGESTION"];

/** Popover height cap; also the space needed below the trigger before it opens upward. */
export const POPOVER_MAX_HEIGHT = 360;
export const POPOVER_GAP = 6;
/** Lets the pointer cross from the trigger into the popover without it closing. */
export const CLOSE_DELAY_MS = 150;
