import { defineComponent } from "../factory";
import { Router, ROUTE_CHANGE_EVENT } from "../app";

interface ViewElement extends HTMLElement {
  path: string;
  label: string;
  mode: "hash" | "path";
  hash: boolean;
  base: string;
  active: boolean;
}

// Track all view instances for efficient updates
const VIEWS = new Set<ViewElement>();

// Normalize path for comparison (lowercase, remove trailing slashes, hyphens)
const normalizePath = (path: string): string => {
  return path
    .toLowerCase()
    .replace(/^[#/]+/, "") // Remove leading # or /
    .replace(/\/+$/, "") // Remove trailing slashes
    .replace(/-/g, ""); // Remove hyphens for flexible matching
};

// Global route change handler - updates all views
const handleGlobalRouteChange = (): void => {
  VIEWS.forEach((view) => {
    updateViewVisibility(view);
  });
};

// Update a single view's visibility based on current route
const updateViewVisibility = (view: ViewElement, forceUpdate = false): void => {
  // Use getPath() to compare only the path portion, ignoring query strings
  const currentPath = Router.getPath();
  const normalizedRoute = normalizePath(currentPath);
  const normalizedPath = normalizePath(view.path);

  const shouldBeActive = normalizedRoute === normalizedPath;

  if (forceUpdate || view.active !== shouldBeActive) {
    view.active = shouldBeActive;
    view.hidden = !shouldBeActive;
    view.style.display = shouldBeActive ? "block" : "none";

    // Dispatch visibility change event (only if not initial setup)
    if (!forceUpdate) {
      view.dispatchEvent(
        new CustomEvent("view-change", {
          detail: { active: shouldBeActive, path: view.path },
          bubbles: true,
        })
      );
    }
  }
};

// Setup global listeners once
let globalListenersSetup = false;
const setupGlobalListeners = (): void => {
  if (globalListenersSetup) return;
  globalListenersSetup = true;

  // Listen to Router's route change event (single source of truth)
  window.addEventListener(ROUTE_CHANGE_EVENT, handleGlobalRouteChange);
};

defineComponent({
  tag: "w-view",

  props: [
    { name: "path", type: String, default: "" },
    { name: "label", type: String, default: "" },
    { name: "active", type: Boolean, default: false },
  ],

  // No default role - views are structural containers
  // If label is provided, we'll add role="region" with aria-label

  setup(ctx) {
    const el = ctx.element as unknown as ViewElement;
    el.mode = Router.settings.hash ? "hash" : "path";
    el.base = Router.settings.base;

    // Only add role="region" if a label is provided (WCAG: regions must have accessible names)
    if (el.label) {
      el.setAttribute("role", "region");
      el.setAttribute("aria-label", el.label);
    }

    // Register this view
    VIEWS.add(el);
    setupGlobalListeners();

    // Initial visibility check (force update to ensure correct initial state)
    updateViewVisibility(el, true);

    // Method to programmatically navigate to this view
    Object.assign(ctx.element, {
      /**
       * Navigate to this view's path
       */
      navigate(): void {
        // Use Router.navigate - it handles hash/path mode internally
        Router.navigate(el.path);
      },

      /**
       * Check if this view is currently active
       */
      isActive(): boolean {
        return el.active;
      },

      /**
       * Force refresh visibility state
       */
      refresh(): void {
        updateViewVisibility(el);
      },
    });

    // Watch for attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.attributeName === "path" ||
          mutation.attributeName === "mode" ||
          mutation.attributeName === "base"
        ) {
          updateViewVisibility(el);
        }
        if (mutation.attributeName === "active") {
          el.hidden = !el.active;
          el.style.display = el.active ? "block" : "none";
        }
        if (mutation.attributeName === "label") {
          if (el.label) {
            el.setAttribute("role", "region");
            el.setAttribute("aria-label", el.label);
          } else {
            el.removeAttribute("role");
            el.removeAttribute("aria-label");
          }
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });

    // Cleanup
    ctx.onCleanup(() => {
      observer.disconnect();
      VIEWS.delete(el);

      // Remove global listeners if no more views
      if (VIEWS.size === 0) {
        window.removeEventListener(ROUTE_CHANGE_EVENT, handleGlobalRouteChange);
        globalListenersSetup = false;
      }
    });
  },
});

export {};
