import { defineComponent } from "../factory";
import {
  setAriaLabel,
  setAriaLive,
  setAriaAtomic,
  setAriaRelevant,
  announcePolite,
} from "../aria";
import { createRovingTabindex, getFocusableElements } from "../infra/focus";
import { SLOT, ARIA, KEY } from "../constants";

interface FeedElement extends HTMLElement {
  label: string;
  busy: boolean;
  loading: boolean;
}

defineComponent({
  tag: "w-feed",

  props: [
    { name: "label", type: String, default: "Feed" },
    { name: "busy", type: Boolean, default: false },
    { name: "loading", type: Boolean, default: false },
  ],

  children: {
    items: { selector: SLOT.item, multiple: true },
  },

  events: {
    keydown: {
      selector: SLOT.item,
      handler: "handleKeyDown",
    },
  },

  aria: {
    role: "feed",
  },

  setup(ctx) {
    const el = ctx.element as unknown as FeedElement;

    let rovingTabindex: ReturnType<typeof createRovingTabindex> | null = null;

    const getItems = (): HTMLElement[] => {
      return Array.from(ctx.element.querySelectorAll<HTMLElement>(SLOT.item));
    };

    const updateAria = (): void => {
      setAriaLabel(ctx.element, el.label);
      ctx.element.setAttribute(ARIA.busy, String(el.busy || el.loading));

      const items = getItems();
      const itemCount = items.length;

      items.forEach((item, index) => {
        item.setAttribute("role", "article");
        item.setAttribute(ARIA.setsize, String(itemCount));
        item.setAttribute(ARIA.posinset, String(index + 1));
      });
    };

    const setupRovingTabindex = (): void => {
      rovingTabindex?.destroy();

      const items = getItems();
      if (items.length === 0) return;

      rovingTabindex = createRovingTabindex(items, {
        orientation: "vertical",
        wrap: false,
      });
    };

    updateAria();
    setupRovingTabindex();

    // Setup live region for announcements
    setAriaLive(ctx.element, "polite");
    setAriaAtomic(ctx.element, false);
    setAriaRelevant(ctx.element, "additions");

    // Helper to find focusable element before/after the feed
    const findAdjacentFocusable = (
      direction: "before" | "after"
    ): HTMLElement | null => {
      const parent = ctx.element.parentElement;
      if (!parent) return null;

      const allFocusable = getFocusableElements(parent);
      const feedIndex = allFocusable.findIndex(
        (el) => ctx.element.contains(el) || el === ctx.element
      );

      if (direction === "before") {
        // Find first focusable before the feed
        for (let i = feedIndex - 1; i >= 0; i--) {
          if (!ctx.element.contains(allFocusable[i])) {
            return allFocusable[i];
          }
        }
      } else {
        // Find first focusable after the feed
        for (let i = feedIndex + 1; i < allFocusable.length; i++) {
          if (!ctx.element.contains(allFocusable[i])) {
            return allFocusable[i];
          }
        }
      }
      return null;
    };

    Object.assign(ctx.element, {
      handleKeyDown(e: KeyboardEvent): void {
        const items = getItems();
        const currentIndex = rovingTabindex?.getCurrentIndex() ?? 0;

        switch (e.key) {
          case KEY.PageDown:
            // Move to next article
            e.preventDefault();
            if (currentIndex < items.length - 1) {
              rovingTabindex?.focus(currentIndex + 1);
            }
            break;

          case KEY.PageUp:
            // Move to previous article
            e.preventDefault();
            if (currentIndex > 0) {
              rovingTabindex?.focus(currentIndex - 1);
            }
            break;

          case KEY.End:
            if (e.ctrlKey) {
              // Move focus to first focusable element after the feed
              e.preventDefault();
              const nextFocusable = findAdjacentFocusable("after");
              if (nextFocusable) {
                nextFocusable.focus();
              }
            }
            break;

          case KEY.Home:
            if (e.ctrlKey) {
              // Move focus to first focusable element before the feed
              e.preventDefault();
              const prevFocusable = findAdjacentFocusable("before");
              if (prevFocusable) {
                prevFocusable.focus();
              }
            }
            break;
        }
      },

      // Public API for adding items
      addItem(element: HTMLElement, position: "start" | "end" = "start"): void {
        element.setAttribute("slot", "item");

        if (position === "start") {
          ctx.element.prepend(element);
        } else {
          ctx.element.append(element);
        }

        updateAria();
        setupRovingTabindex();
        announcePolite("New item added to feed");
      },

      removeItem(element: HTMLElement): void {
        if (element.parentElement === ctx.element) {
          element.remove();
          updateAria();
          setupRovingTabindex();
        }
      },

      setLoading(loading: boolean): void {
        el.loading = loading;
        ctx.element.setAttribute(ARIA.busy, String(loading || el.busy));

        if (loading) {
          announcePolite("Loading more items");
        } else {
          const items = getItems();
          announcePolite(`${items.length} items in feed`);
        }
      },

      refresh(): void {
        updateAria();
        setupRovingTabindex();
      },
    });

    // Watch for attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          ["label", "busy", "loading"].includes(mutation.attributeName ?? "")
        ) {
          updateAria();
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });

    // Watch for child changes
    const childObserver = new MutationObserver((mutations) => {
      let itemsChanged = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          itemsChanged = true;
          break;
        }
      }
      if (itemsChanged) {
        updateAria();
        setupRovingTabindex();
      }
    });

    childObserver.observe(ctx.element, { childList: true });

    ctx.onCleanup(() => {
      observer.disconnect();
      childObserver.disconnect();
      rovingTabindex?.destroy();
    });
  },
});

export {};
