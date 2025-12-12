/**
 * Core Layer - Performance primitives
 *
 * Zero internal dependencies. Foundation for everything else.
 */

export { scheduler } from './scheduler';
export type { SchedulerInstance } from './scheduler';

export { cache } from './cache';
export type { CacheInstance, CacheOptions } from './cache';

export { createEventScope } from './events';
export type { EventScope, EventBinding, EventBindingOptions, EventHandler } from './events';

export { createState, createDerived } from './state';
export type { State, StateConfig, StateSubscriber, StateUpdater } from './state';

export { createTransition } from './transitions';
export type { Transition, TransitionConfig, TransitionState } from './transitions';

export { observeAttributes, onAttributeChange } from './observe';
export type { AttributeObserverConfig } from './observe';
