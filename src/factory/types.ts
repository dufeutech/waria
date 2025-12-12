/**
 * Component Factory Types - Schema definitions for declarative components
 */

import type { State } from '../core/state';
import type { Transition, TransitionConfig } from '../core/transitions';
import type { SchedulerInstance } from '../core/scheduler';
import type { CacheInstance } from '../core/cache';
import type { EventScope } from '../core/events';

// Property types
export type PropType =
  | typeof String
  | typeof Number
  | typeof Boolean
  | typeof Array
  | typeof Object;

export interface PropDefinition {
  name: string;
  type: PropType;
  default?: unknown;
  reflect?: boolean;
  attribute?: string;
}

// Child configuration
export interface ChildConfig {
  selector: string;
  lazy?: boolean;
  multiple?: boolean;
  observe?: boolean;
}

export type ChildDefinition = string | ChildConfig;

// Event configuration
export interface EventConfig {
  selector?: string;
  handler: string;
  prevent?: boolean;
  stop?: boolean;
  passive?: boolean;
  capture?: boolean;
  once?: boolean;
}

// Viewport configuration
export interface ViewportConfig {
  scroll?: boolean;
  resize?: boolean;
  handler: string;
}

// ARIA configuration
export interface AriaConfig {
  role?: string;
  labelledBy?: string;
  describedBy?: string;
}

// Transition configuration for schema
export interface SchemaTransitionConfig extends TransitionConfig {
  target?: string;
}

// Cleanup function type
export type CleanupFn = () => void;

/**
 * Component Context - Provided to setup function
 */
export interface ComponentContext<T extends HTMLElement = HTMLElement> {
  /** The custom element instance */
  element: T;

  /** AbortSignal for cleanup */
  signal: AbortSignal;

  /** Create reactive state */
  state: <S>(initial: S) => State<S>;

  /** Child access (lazy, cached) */
  children: {
    [key: string]: HTMLElement | HTMLElement[] | null;
  };

  /** Transitions */
  transitions: {
    [name: string]: Transition;
  };

  /** Event scope (auto-cleanup) */
  events: EventScope;

  /** Scheduler access */
  scheduler: SchedulerInstance;

  /** Cache access */
  cache: CacheInstance;

  /** Register cleanup function */
  onCleanup(fn: CleanupFn): void;

  /** Query helpers */
  query<E extends Element = Element>(selector: string): E | null;
  queryAll<E extends Element = Element>(selector: string): E[];
  querySlot<E extends Element = Element>(slot: string): E[];

  /** Emit custom event */
  emit<D = unknown>(event: string, detail?: D, options?: CustomEventInit): boolean;

  /** ARIA helpers */
  aria: {
    setExpanded(value: boolean): void;
    setSelected(value: boolean): void;
    setChecked(value: boolean | 'mixed'): void;
    setPressed(value: boolean | 'mixed'): void;
    setDisabled(value: boolean): void;
    setHidden(value: boolean): void;
    setActiveDescendant(id: string | null): void;
  };
}

/**
 * Component Schema - Declarative configuration for defineComponent
 */
export interface ComponentSchema<T extends HTMLElement = HTMLElement> {
  /** Custom element tag name (must include hyphen) */
  tag: string;

  /** Reactive properties */
  props?: PropDefinition[];

  /** Child element collection */
  children?: {
    [key: string]: ChildDefinition;
  };

  /** Event delegation */
  events?: {
    [eventType: string]: EventConfig | EventConfig[];
  };

  /** Viewport event handling (RAF-throttled) */
  viewport?: boolean | ViewportConfig;

  /** Transitions */
  transitions?: {
    [name: string]: SchemaTransitionConfig;
  };

  /** ARIA configuration */
  aria?: AriaConfig;

  /** Lifecycle setup */
  setup?: (ctx: ComponentContext<T>) => void | CleanupFn;

  /** Methods to add to the element prototype */
  methods?: {
    [name: string]: (this: T, ...args: unknown[]) => unknown;
  };
}

/**
 * Extended HTMLElement interface for components
 */
export interface WComponent extends HTMLElement {
  /** Update the component (re-query children, etc.) */
  $update(): void;
}
