/**
 * Shared Constants - Common values used throughout the library
 *
 * Centralizing repeated strings reduces duplication and typo risk.
 */

// ─────────────────────────────────────────────────────────────
// Slot Selectors
// ─────────────────────────────────────────────────────────────

export const SLOT = {
  // Universal (12)
  trigger: "w-slot[trigger] > *",
  body: "w-slot[body] > *",
  close: "w-slot[close] > *",
  item: "w-slot[item] > *",
  items: "w-slot[item] > *",
  label: "w-slot[label] > *",
  docs: "w-slot[docs] > *",
  icon: "w-slot[icon] > *",
  head: "w-slot[head] > *",
  foot: "w-slot[foot] > *",
  opt: "w-slot[opt] > *",
  sep: "w-slot[sep] > *",
  msg: "w-slot[msg] > *",
  // Tabs (4)
  list: "w-slot[list] > *",
  tab: "w-slot[tab] > *",
  panels: "w-slot[panels] > *",
  panel: "w-slot[panel] > *",
  // Carousel (4)
  prev: "w-slot[prev] > *",
  next: "w-slot[next] > *",
  dots: "w-slot[dots] > *",
  dot: "w-slot[dot] > *",
  // Grid (2)
  cell: "w-slot[cell] > *",
  row: "w-slot[row] > *",
  // Range (3)
  knob: "w-slot[knob] > *",
  fill: "w-slot[fill] > *",
  rail: "w-slot[rail] > *",
  // Spinbutton (4)
  input: "w-slot[input] > *",
  value: "w-slot[value] > *",
  up: "w-slot[up] > *",
  down: "w-slot[down] > *",
  // Other (4)
  menu: "w-slot[menu] > *",
  img: "w-slot[img] > *",
  alt: "w-slot[alt] > *",
  sub: "w-slot[sub] > *",
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
