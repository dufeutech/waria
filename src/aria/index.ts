/**
 * ARIA Utilities - Accessibility helpers
 */

export {
  setAriaExpanded,
  setAriaSelected,
  setAriaChecked,
  setAriaPressed,
  setAriaDisabled,
  setAriaHidden,
  setAriaCurrent,
  setAriaInvalid,
  setAriaBusy,
  setAriaHasPopup,
  setAriaLevel,
  setAriaPosition,
  setAriaValue,
  setAriaOrientation,
  setAriaMultiselectable,
  setAriaRequired,
  setAriaReadonly,
  setAriaActiveDescendant,
  setTabIndex,
} from './attributes';

export {
  ROLES,
  WIDGET_ROLES,
  COMPOSITE_ROLES,
  LANDMARK_ROLES,
  STRUCTURE_ROLES,
  setRole,
  removeRole,
  getRole,
  hasRole,
} from './roles';
export type { Role } from './roles';

export {
  setAriaControls,
  removeAriaControls,
  setAriaLabelledBy,
  setAriaLabel,
  removeAriaLabelledBy,
  setAriaDescribedBy,
  removeAriaDescribedBy,
  setAriaOwns,
  removeAriaOwns,
  setAriaFlowTo,
  removeAriaFlowTo,
  setAriaDetails,
  removeAriaDetails,
  setAriaErrorMessage,
  removeAriaErrorMessage,
  linkTriggerToContent,
} from './relationships';

export {
  announce,
  announceAssertive,
  announcePolite,
  setAriaLive,
  setAriaAtomic,
  setAriaRelevant,
  createLiveRegion,
  setAsStatusRegion,
  setAsAlertRegion,
  setAsLogRegion,
} from './live-regions';

export { generateId, ensureId, generateScopedId, resetIdCounter } from './id';
