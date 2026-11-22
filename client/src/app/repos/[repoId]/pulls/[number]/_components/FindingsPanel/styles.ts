import type { CSSProperties } from "react";

/** Co-located styles for FindingsPanel (extracted from inline styles). */
export const s = {
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
  } satisfies CSSProperties,
  divider: {
    width: 1,
    height: 18,
    background: "var(--border)",
    margin: "0 2px",
  } satisfies CSSProperties,
  sevGroup: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12.5,
  } satisfies CSSProperties,
  sevSep: { color: "var(--text-muted)" } satisfies CSSProperties,
  sevBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "2px 8px",
    borderRadius: 4,
    // No `border` shorthand: the active state overrides borderColor (React warns on the mix).
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "transparent",
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: "0.04em",
    fontVariantNumeric: "tabular-nums",
    cursor: "pointer",
  } satisfies CSSProperties,
  sevBtnDisabled: { opacity: 0.45, cursor: "default" } satisfies CSSProperties,
  toggleGroup: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    color: "var(--text-secondary)",
  } satisfies CSSProperties,
  list: { display: "flex", flexDirection: "column", gap: 12 } satisfies CSSProperties,
} as const;
