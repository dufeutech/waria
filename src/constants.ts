/**
 * Shared Constants - Common values used throughout the library
 *
 * Centralizing repeated strings reduces duplication and typo risk.
 */

// ─────────────────────────────────────────────────────────────
// Slot Selectors
// ─────────────────────────────────────────────────────────────

export const SLOT = {
  trigger: '[slot="trigger"]',
  content: '[slot="content"]',
  close: '[slot="close"]',
  item: '[slot="item"]',
  items: '[slot="item"]',
  panel: '[slot="panel"]',
  label: '[slot="label"]',
  description: '[slot="description"]',
  icon: '[slot="icon"]',
  header: '[slot="header"]',
  footer: '[slot="footer"]',
  option: '[slot="option"]',
  list: '[slot="list"]',
  cell: '[slot="cell"]',
  row: '[slot="row"]',
  rowheader: '[slot="rowheader"]',
  image: '[slot="image"]',
  tab: '[slot="tab"]',
  prev: '[slot="prev"]',
  next: '[slot="next"]',
  indicators: '[slot="indicators"]',
  indicator: '[slot="indicator"]',
  fallback: '[slot="fallback"]',
  submenu: '[slot="submenu"]',
  thumb: '[slot="thumb"]',
  fill: '[slot="fill"]',
  track: '[slot="track"]',
  listbox: '[slot="listbox"]',
  // Extras
  input: '[slot="input"]',
  display: '[slot="display"]',
  increment: '[slot="increment"]',
  decrement: '[slot="decrement"]',
  separator: '[slot="separator"]',
  message: '[slot="message"]',
} as const;

// ─────────────────────────────────────────────────────────────
// Keyboard Keys
// ─────────────────────────────────────────────────────────────

export const KEY = {
  Enter: "Enter",
  Space: " ",
  Escape: "Escape",
  Tab: "Tab",
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  Home: "Home",
  End: "End",
  PageUp: "PageUp",
  PageDown: "PageDown",
} as const;

// ─────────────────────────────────────────────────────────────
// ARIA Attribute Names
// ─────────────────────────────────────────────────────────────

export const ARIA = {
  expanded: "aria-expanded",
  selected: "aria-selected",
  checked: "aria-checked",
  pressed: "aria-pressed",
  disabled: "aria-disabled",
  hidden: "aria-hidden",
  current: "aria-current",
  invalid: "aria-invalid",
  busy: "aria-busy",
  haspopup: "aria-haspopup",
  level: "aria-level",
  posinset: "aria-posinset",
  setsize: "aria-setsize",
  valuenow: "aria-valuenow",
  valuemin: "aria-valuemin",
  valuemax: "aria-valuemax",
  valuetext: "aria-valuetext",
  orientation: "aria-orientation",
  multiselectable: "aria-multiselectable",
  required: "aria-required",
  readonly: "aria-readonly",
  activedescendant: "aria-activedescendant",
  controls: "aria-controls",
  labelledby: "aria-labelledby",
  label: "aria-label",
  describedby: "aria-describedby",
  owns: "aria-owns",
  flowto: "aria-flowto",
  details: "aria-details",
  errormessage: "aria-errormessage",
  live: "aria-live",
  atomic: "aria-atomic",
  relevant: "aria-relevant",
  modal: "aria-modal",
  roledescription: "aria-roledescription",
} as const;

// ─────────────────────────────────────────────────────────────
// Common CSS for Visually Hidden Elements (Screen Reader Only)
// ─────────────────────────────────────────────────────────────

export const SR_ONLY_STYLES = `
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

// ─────────────────────────────────────────────────────────────
// Common Values
// ─────────────────────────────────────────────────────────────

export const BOOL = {
  true: "true",
  false: "false",
} as const;

// ─────────────────────────────────────────────────────────────
// ID Prefix
// ─────────────────────────────────────────────────────────────

export const ID_PREFIX = "w";
