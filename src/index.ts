/**
 * WC-Aria - Accessible Web Components Library
 *
 * Framework-agnostic, performant, accessible UI primitives.
 */

// Core Layer - Performance primitives
export {
  scheduler,
  cache,
  createEventScope,
  createState,
  createDerived,
  createTransition,
  observeAttributes,
  onAttributeChange,
} from "./core";
export type {
  SchedulerInstance,
  CacheInstance,
  CacheOptions,
  EventScope,
  EventBinding,
  EventBindingOptions,
  EventHandler,
  State,
  StateConfig,
  StateSubscriber,
  StateUpdater,
  Transition,
  TransitionConfig,
  TransitionState,
  AttributeObserverConfig,
} from "./core";

// ARIA Utilities
export {
  // Attributes
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
  // Roles
  ROLES,
  WIDGET_ROLES,
  COMPOSITE_ROLES,
  LANDMARK_ROLES,
  STRUCTURE_ROLES,
  setRole,
  removeRole,
  getRole,
  hasRole,
  // Relationships
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
  // Live Regions
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
  // ID
  generateId,
  ensureId,
  generateScopedId,
} from "./aria";
export type { Role } from "./aria";

// Infrastructure Layer
export {
  // Position
  calculatePosition,
  applyPosition,
  position,
  autoPosition,
  // Focus
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable,
  saveFocus,
  restoreFocus,
  getSavedFocus,
  createFocusTrap,
  createRovingTabindex,
  // Portal
  getPortalContainer,
  getNextZIndex,
  getTopStack,
  isInStack,
  pushStack,
  popStack,
  createPortal,
  teleport,
  portalContains,
  // Click Outside
  onClickOutside,
  onClickOutsideOnce,
  onEscapeKey,
  onDismiss,
} from "./infra";
export type {
  Placement,
  Side,
  Alignment,
  PositionConfig,
  Position,
  FocusTrap,
  RovingTabindex,
  Portal,
  ClickOutsideOptions,
  ClickOutsideHandler,
} from "./infra";

// Component Factory
export { defineComponent } from "./factory";
export type {
  ComponentSchema,
  ComponentContext,
  PropDefinition,
  PropType,
  ChildConfig,
  ChildDefinition,
  EventConfig,
  ViewportConfig,
  AriaConfig,
  SchemaTransitionConfig,
  CleanupFn,
  WComponent,
} from "./factory";

// Constants
export { SLOT, KEY, ARIA, SR_ONLY_STYLES, ID_PREFIX } from "./constants";

// Register all components
import "./components";

// App & Router
export { App, Router } from "./app";
export type { RouteInfo, RouteControls } from "./app";
import { App } from "./app";
export const start = (args: any) => App.start(args);
