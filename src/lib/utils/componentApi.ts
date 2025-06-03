// src/lib/utils/componentApi.ts
import type { SvelteComponent } from 'svelte';

/**
 * Component API pattern types
 */
export enum ComponentApiPattern {
  ATOMIC = 'atomic',
  COMPOUND = 'compound',
  RENDER_PROP = 'render-prop',
  PROVIDER = 'provider',
  CONTROLLER = 'controller'
}

/**
 * Component documentation metadata
 */
export interface ComponentMeta {
  /** Component name */
  name: string;
  /** Component description */
  description: string;
  /** Component API pattern */
  pattern: ComponentApiPattern;
  /** Component props */
  props?: Record<string, PropMeta>;
  /** Component slots */
  slots?: Record<string, SlotMeta>;
  /** Component events */
  events?: Record<string, EventMeta>;
  /** Component examples */
  examples?: Example[];
  /** Related components */
  related?: string[];
  /** Component author */
  author?: string;
  /** Component version */
  version?: string;
  /** Component status (experimental, stable, deprecated) */
  status?: 'experimental' | 'stable' | 'deprecated';
}

/**
 * Component prop metadata
 */
export interface PropMeta {
  /** Prop description */
  description: string;
  /** Prop type */
  type: string;
  /** Default value */
  default?: string;
  /** Whether the prop is required */
  required?: boolean;
  /** Possible values for enum props */
  values?: string[];
  /** Validation rules */
  validation?: string;
}

/**
 * Component slot metadata
 */
export interface SlotMeta {
  /** Slot description */
  description: string;
  /** Slot props */
  props?: Record<string, PropMeta>;
  /** Whether the slot is required */
  required?: boolean;
  /** Whether the slot can be used multiple times */
  multiple?: boolean;
}

/**
 * Component event metadata
 */
export interface EventMeta {
  /** Event description */
  description: string;
  /** Event detail type */
  detail?: string;
  /** Whether the event bubbles */
  bubbles?: boolean;
  /** Whether the event is cancelable */
  cancelable?: boolean;
}

/**
 * Component example
 */
export interface Example {
  /** Example name */
  name: string;
  /** Example description */
  description: string;
  /** Example code */
  code: string;
  /** Example preview component */
  component?: typeof SvelteComponent;
}

/**
 * Component registry for documentation
 */
class ComponentRegistry {
  private components: Map<string, ComponentMeta> = new Map();

  /**
   * Register a component
   * @param meta Component metadata
   */
  register(meta: ComponentMeta): void {
    this.components.set(meta.name, meta);
  }

  /**
   * Get a component by name
   * @param name Component name
   * @returns Component metadata
   */
  get(name: string): ComponentMeta | undefined {
    return this.components.get(name);
  }

  /**
   * Get all components
   * @returns Array of component metadata
   */
  getAll(): ComponentMeta[] {
    return Array.from(this.components.values());
  }

  /**
   * Get components by pattern
   * @param pattern Component API pattern
   * @returns Array of component metadata
   */
  getByPattern(pattern: ComponentApiPattern): ComponentMeta[] {
    return this.getAll().filter(component => component.pattern === pattern);
  }

  /**
   * Get components by status
   * @param status Component status
   * @returns Array of component metadata
   */
  getByStatus(status: 'experimental' | 'stable' | 'deprecated'): ComponentMeta[] {
    return this.getAll().filter(component => component.status === status);
  }

  /**
   * Get related components
   * @param name Component name
   * @returns Array of related component metadata
   */
  getRelated(name: string): ComponentMeta[] {
    const component = this.get(name);
    if (!component || !component.related) {
      return [];
    }

    return component.related
      .map(relatedName => this.get(relatedName))
      .filter((meta): meta is ComponentMeta => !!meta);
  }
}

/**
 * Singleton instance of the component registry
 */
export const componentRegistry = new ComponentRegistry();

/**
 * Decorator function to register a component
 * @param meta Component metadata
 * @returns Function that takes a component constructor and returns it
 */
export function component(meta: ComponentMeta) {
  return function<T extends typeof SvelteComponent>(constructor: T): T {
    componentRegistry.register(meta);
    return constructor;
  };
}

/**
 * Create standardized component props
 * @param props Props object
 * @returns Standardized props object
 */
export function createProps<T extends Record<string, any>>(props: T): T {
  return props;
}

/**
 * Create a compound component
 * @param name Component name
 * @param components Child components
 * @returns Compound component object
 */
export function createCompoundComponent<T extends Record<string, typeof SvelteComponent>>(
  name: string,
  components: T
): T & { __compoundName: string } {
  return {
    ...components,
    __compoundName: name
  };
}

/**
 * Check if a component is a compound component
 * @param component Component to check
 * @returns True if the component is a compound component
 */
export function isCompoundComponent(
  component: any
): component is Record<string, typeof SvelteComponent> & { __compoundName: string } {
  return typeof component === 'object' && '__compoundName' in component;
}

/**
 * Extract business logic from a component
 * @param logic Business logic function
 * @returns Business logic result
 */
export function extractLogic<T extends (...args: any[]) => any>(
  logic: T
): ReturnType<T> {
  return logic();
}

/**
 * Create a controller component
 * @param controller Controller function
 * @returns Controller component props
 */
export function createController<T extends Record<string, any>>(
  controller: () => T
): T & { __controllerName: string } {
  return {
    ...controller(),
    __controllerName: controller.name
  };
}

/**
 * Check if an object is a controller
 * @param obj Object to check
 * @returns True if the object is a controller
 */
export function isController(
  obj: any
): obj is Record<string, any> & { __controllerName: string } {
  return typeof obj === 'object' && '__controllerName' in obj;
}