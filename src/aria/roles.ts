/**
 * ARIA Roles - Role management utilities
 */

// Widget Roles (standalone interactive widgets)
export const WIDGET_ROLES = {
  button: 'button',
  checkbox: 'checkbox',
  combobox: 'combobox',
  gridcell: 'gridcell',
  link: 'link',
  menuitem: 'menuitem',
  menuitemcheckbox: 'menuitemcheckbox',
  menuitemradio: 'menuitemradio',
  option: 'option',
  progressbar: 'progressbar',
  radio: 'radio',
  scrollbar: 'scrollbar',
  searchbox: 'searchbox',
  slider: 'slider',
  spinbutton: 'spinbutton',
  switch: 'switch',
  tab: 'tab',
  tabpanel: 'tabpanel',
  textbox: 'textbox',
  treeitem: 'treeitem',
} as const;

// Composite Roles (manage child widgets via arrow key navigation)
export const COMPOSITE_ROLES = {
  grid: 'grid',
  listbox: 'listbox',
  menu: 'menu',
  menubar: 'menubar',
  radiogroup: 'radiogroup',
  tablist: 'tablist',
  tree: 'tree',
  treegrid: 'treegrid',
} as const;

// Landmark Roles
export const LANDMARK_ROLES = {
  banner: 'banner',
  complementary: 'complementary',
  contentinfo: 'contentinfo',
  form: 'form',
  main: 'main',
  navigation: 'navigation',
  region: 'region',
  search: 'search',
} as const;

// Structure Roles
export const STRUCTURE_ROLES = {
  application: 'application',
  article: 'article',
  cell: 'cell',
  columnheader: 'columnheader',
  definition: 'definition',
  dialog: 'dialog',
  alertdialog: 'alertdialog',
  directory: 'directory',
  document: 'document',
  feed: 'feed',
  figure: 'figure',
  group: 'group',
  heading: 'heading',
  img: 'img',
  list: 'list',
  listitem: 'listitem',
  math: 'math',
  none: 'none',
  note: 'note',
  presentation: 'presentation',
  row: 'row',
  rowgroup: 'rowgroup',
  rowheader: 'rowheader',
  separator: 'separator',
  table: 'table',
  term: 'term',
  toolbar: 'toolbar',
  tooltip: 'tooltip',
} as const;

// All roles combined
export const ROLES = {
  ...WIDGET_ROLES,
  ...COMPOSITE_ROLES,
  ...LANDMARK_ROLES,
  ...STRUCTURE_ROLES,
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Set the role attribute on an element
 */
export function setRole(element: HTMLElement, role: Role): void {
  element.setAttribute('role', role);
}

/**
 * Remove the role attribute from an element
 */
export function removeRole(element: HTMLElement): void {
  element.removeAttribute('role');
}

/**
 * Get the role attribute from an element
 */
export function getRole(element: HTMLElement): string | null {
  return element.getAttribute('role');
}

/**
 * Check if an element has a specific role
 */
export function hasRole(element: HTMLElement, role: Role): boolean {
  return element.getAttribute('role') === role;
}
