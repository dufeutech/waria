/**
 * Infrastructure Layer - Domain utilities built on core
 */

export {
  calculatePosition,
  applyPosition,
  position,
  autoPosition,
} from './position';
export type { Placement, Side, Alignment, PositionConfig, Position } from './position';

export {
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable,
  saveFocus,
  restoreFocus,
  getSavedFocus,
  createFocusTrap,
  createRovingTabindex,
} from './focus';
export type { FocusTrap, RovingTabindex } from './focus';

export {
  getPortalContainer,
  getNextZIndex,
  getTopStack,
  isInStack,
  pushStack,
  popStack,
  createPortal,
  teleport,
  portalContains,
} from './portal';
export type { Portal } from './portal';

export {
  onClickOutside,
  onClickOutsideOnce,
  onEscapeKey,
  onDismiss,
} from './click-outside';
export type { ClickOutsideOptions, ClickOutsideHandler } from './click-outside';
