import { defineComponent } from "../factory";
import { setAriaLabel } from "../aria";
import { createRovingTabindex } from "../infra/focus";
import { SLOT, KEY } from "../constants";
import { Router, ROUTE_CHANGE_EVENT } from "../app";

interface NavigationElement extends HTMLElement {
  label: string;
  orientation: "horizontal" | "vertical";
  value: string;
  sync: boolean;
}

const NAVIGATIONS = new Set<NavigationElement>();

// Sync value across all navigation instances that have sync enabled
const syncNavigationValue = (
  value: string,
  source: NavigationElement
): void => {
  if (!source.sync) return;

  NAVIGATIONS.forEach((nav) => {
    if (nav !== source && nav.sync && nav.value !== value) {
      nav.value = value;
      nav.setAttribute("value", value);
      nav.dispatchEvent(new CustomEvent("_sync", { detail: { value } }));
    }
  });
};

// Normalize path - strip # and ensure starts with /
const normalizePath = (path: string): string => {
  let normalized = path.startsWith("#") ? path.slice(1) : path;
  if (!normalized.startsWith("/")) {
    normalized = "/" + normalized;
  }
  return normalized;
};

defineComponent({
  tag: "w-nav",

  props: [
    { name: "label", type: String, default: "Navigation" },
    { name: "orientation", type: String, default: "horizontal" },
    { name: "value", type: String, default: "" },
  ],

  children: {
    items: { selector: SLOT.item, multiple: true },
  },

  events: {
    keydown: {
      handler: "handleKeyDown",
    },
    click: {
      handler: "handleClick",
    },
  },

  aria: {
    role: "navigation",
  },

  setup(ctx) {
    const el = ctx.element as unknown as NavigationElement;

    // Register this navigation
    NAVIGATIONS.add(el);

    let rovingTabindex: ReturnType<typeof createRovingTabindex> | null = null;

    const getItems = (): HTMLElement[] => {
      return Array.from(ctx.element.querySelectorAll<HTMLElement>(SLOT.item));
    };

    const getItemValue = (item: HTMLElement): string => {
      // Use data-value attribute if available, otherwise use href for links
      const value =
        item.getAttribute("data-value") || item.getAttribute("href") || "";
      // Normalize - strip # prefix
      return normalizePath(value);
    };

    const updateAriaCurrent = (): void => {
      const items = getItems();
      const currentValue = el.value;

      items.forEach((item) => {
        if (el.orientation === "vertical") {
          item.style.width = "100%";
        }
        const itemValue = getItemValue(item);
        if (currentValue && itemValue === currentValue) {
          item.setAttribute("aria-current", "page");
        } else {
          item.removeAttribute("aria-current");
        }
      });
    };

    // Convert href to hash-based href when in hash mode (skip in native mode)
    const updateHrefs = (): void => {
      if (Router.settings.native || !Router.settings.hash) return;

      const items = getItems();
      items.forEach((item) => {
        // Handle direct <a> elements
        if (item.tagName === "A" && item.hasAttribute("href")) {
          const href = item.getAttribute("href") || "";
          // Only convert if not already a hash link and not external
          if (href && !href.startsWith("#") && !href.startsWith("http")) {
            const hashHref = "#" + (href.startsWith("/") ? href : "/" + href);
            item.setAttribute("href", hashHref);
          }
        }
        // Handle w-link elements (they have href attribute and contain an <a>)
        else if (item.tagName === "W-LINK" && item.hasAttribute("href")) {
          const href = item.getAttribute("href") || "";
          if (href && !href.startsWith("#") && !href.startsWith("http")) {
            const hashHref = "#" + (href.startsWith("/") ? href : "/" + href);
            item.setAttribute("href", hashHref);
            // Also update the inner anchor if it exists
            const innerAnchor = item.querySelector("a");
            if (innerAnchor) {
              innerAnchor.setAttribute("href", hashHref);
            }
          }
        }
        // Handle <a> nested inside other elements
        else {
          const nestedAnchor = item.querySelector("a[href]");
          if (nestedAnchor) {
            const href = nestedAnchor.getAttribute("href") || "";
            if (href && !href.startsWith("#") && !href.startsWith("http")) {
              const hashHref = "#" + (href.startsWith("/") ? href : "/" + href);
              nestedAnchor.setAttribute("href", hashHref);
            }
          }
        }
      });
    };

    const updateAria = (): void => {
      setAriaLabel(ctx.element, el.label);

      const items = getItems();
      items.forEach((item, index) => {
        if (!item.hasAttribute("tabindex") && !item.matches("a, button")) {
          item.setAttribute("tabindex", index === 0 ? "0" : "-1");
        }
      });

      updateAriaCurrent();
    };

    const setupRovingTabindex = (): void => {
      rovingTabindex?.destroy();

      const items = getItems();
      if (items.length === 0) return;

      rovingTabindex = createRovingTabindex(items, {
        orientation: el.orientation,
        wrap: true,
      });
    };

    const setValue = (
      newValue: string,
      options: {
        fromSync?: boolean;
        fromRouter?: boolean;
      } = {}
    ): void => {
      const { fromSync = false, fromRouter = false } = options;

      // Normalize the value
      const normalizedValue = normalizePath(newValue);

      if (el.value !== normalizedValue) {
        el.value = normalizedValue;
        el.setAttribute("value", normalizedValue);
        updateAriaCurrent();

        // Navigate via Router if not coming from router event
        if (!fromRouter) {
          Router.navigate(normalizedValue);
        }

        // Only dispatch change and sync if not from sync event
        if (!fromSync) {
          syncNavigationValue(normalizedValue, el);

          ctx.element.dispatchEvent(
            new CustomEvent("change", {
              detail: { value: normalizedValue },
              bubbles: true,
            })
          );
        }
      }
    };

    // Handle route changes from Router
    const handleRouteChange = (e: Event): void => {
      const { to } = (e as CustomEvent).detail;
      if (to && to !== el.value) {
        setValue(to, { fromRouter: true });
      }
    };

    // Listen for sync events from other navigations
    const handleSync = (): void => {
      updateAriaCurrent();
    };
    ctx.element.addEventListener("_sync", handleSync);

    // Initialize from current route
    const initFromRoute = (): void => {
      const currentRoute = Router.getRoute();
      if (currentRoute) {
        setValue(currentRoute, { fromRouter: true });
      }
    };

    // Setup Router listener
    window.addEventListener(ROUTE_CHANGE_EVENT, handleRouteChange);

    updateHrefs();
    updateAria();
    setupRovingTabindex();
    initFromRoute();

    Object.assign(ctx.element, {
      handleKeyDown(e: KeyboardEvent): void {
        const target = e.target as HTMLElement;
        if (!target.matches(SLOT.item)) return;

        if (e.key === KEY.Home) {
          e.preventDefault();
          rovingTabindex?.first();
        } else if (e.key === KEY.End) {
          e.preventDefault();
          rovingTabindex?.last();
        }
      },

      handleClick(e: MouseEvent): void {
        const target = e.target as HTMLElement;

        // Find the item - either the target matches SLOT.item or find closest w-slot[item] and get its child
        let item: HTMLElement | null = null;
        if (target.matches(SLOT.item)) {
          item = target;
        } else {
          const slotWrapper = target.closest<HTMLElement>("w-slot[item]");
          if (slotWrapper) {
            item = slotWrapper.firstElementChild as HTMLElement;
          }
        }
        if (!item) return;

        // In native mode, let links work normally (server-side routing)
        if (Router.settings.native) {
          // Just update aria-current for visual feedback, don't prevent navigation
          const itemValue = getItemValue(item);
          if (itemValue) {
            el.value = itemValue;
            el.setAttribute("value", itemValue);
            updateAriaCurrent();
          }
          return;
        }

        // Prevent default link behavior - let Router handle navigation
        // Check for anchor elements: direct <a>, w-link, or nested <a>
        const isLink = item.tagName === "A" || item.tagName === "W-LINK";
        const anchor = isLink ? item : target.closest("a");
        if (anchor || item.querySelector("a")) {
          e.preventDefault();
        }

        const itemValue = getItemValue(item);
        if (itemValue) {
          setValue(itemValue);
        }
      },
    });

    el.style.display = "flex";
    if (el.orientation === "vertical") {
      el.style.flexDirection = "column";
    }

    // Watch for attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.attributeName === "label" ||
          mutation.attributeName === "orientation"
        ) {
          updateAria();
          if (mutation.attributeName === "orientation") {
            setupRovingTabindex();
          }
        } else if (mutation.attributeName === "value") {
          updateAriaCurrent();
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });

    // Watch for child changes
    const childObserver = new MutationObserver(() => {
      updateHrefs();
      updateAria();
      setupRovingTabindex();
    });

    childObserver.observe(ctx.element, { childList: true, subtree: true });

    ctx.onCleanup(() => {
      observer.disconnect();
      childObserver.disconnect();
      rovingTabindex?.destroy();
      ctx.element.removeEventListener("_sync", handleSync);
      window.removeEventListener(ROUTE_CHANGE_EVENT, handleRouteChange);
      NAVIGATIONS.delete(el);
    });
  },
});

export {};
