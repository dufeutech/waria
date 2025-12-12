/**
 * Component Factory - Declarative component definition
 */

export { defineComponent, init, isInitialized } from './define';
export { createContext, invalidateChildCache } from './context';
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
} from './types';
