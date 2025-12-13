import { defineComponent } from "../factory";
import { setAriaLabel, setAriaOrientation } from "../aria";
import { createRovingTabindex } from "../infra/focus";
import { SLOT, ARIA, KEY } from "../constants";

interface ToolbarElement extends HTMLElement {
  label: string;
  orientation: "horizontal" | "vertical";
}

defineComponent({
  tag: "w-toolbar",

  props: [
    { name: "label", type: String, default: "Toolbar" },
    { name: "orientation", type: String, default: "horizontal" },
  ],

  children: {
    items: { selector: SLOT.item, multiple: true },
    separators: { selector: SLOT.sep, multiple: true },
  },

  events: {
    keydown: {
      handler: "handleKeyDown",
    },
    click: {
      selector: SLOT.item,
      handler: "handleItemClick",
    },
  },

  aria: {
    role: "toolbar",
  },

  setup(ctx) {
    const el = ctx.element as unknown as ToolbarElement;

    let rovingTabindex: ReturnType<typeof createRovingTabindex> | null = null;

    const getItems = (): HTMLElement[] => {
      return Array.from(ctx.element.querySelectorAll<HTMLElement>(SLOT.item));
    };

    const getSeparators = (): HTMLElement[] => {
      return Array.from(
        ctx.element.querySelectorAll<HTMLElement>(SLOT.sep)
      );
    };

    const updateAria = (): void => {
      setAriaLabel(ctx.element, el.label);
      setAriaOrientation(ctx.element, el.orientation);

      const items = getItems();
      items.forEach((item, index) => {
        // Ensure items are focusable
        if (!item.matches("button, [tabindex]")) {
          item.setAttribute("tabindex", index === 0 ? "0" : "-1");
        }
      });

      // Mark separators with proper role
      const separators = getSeparators();
      separators.forEach((sep) => {
        sep.setAttribute("role", "separator");
        sep.setAttribute(
          ARIA.orientation,
          el.orientation === "horizontal" ? "vertical" : "horizontal"
        );
      });
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

    updateAria();
    setupRovingTabindex();

    Object.assign(ctx.element, {
      handleKeyDown(e: KeyboardEvent): void {
        const target = e.target as HTMLElement;
        if (!target.matches(SLOT.item)) return;

        // Home/End navigation
        if (e.key === KEY.Home) {
          e.preventDefault();
          rovingTabindex?.first();
        } else if (e.key === KEY.End) {
          e.preventDefault();
          rovingTabindex?.last();
        }
      },

      handleItemClick(_e: Event, target: HTMLElement): void {
        const itemName = target.getAttribute("name");

        ctx.emit("action", {
          item: itemName,
          element: target,
        });
      },
    });

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
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });

    // Watch for child changes
    const childObserver = new MutationObserver(() => {
      updateAria();
      setupRovingTabindex();
    });

    childObserver.observe(ctx.element, { childList: true, subtree: true });

    ctx.onCleanup(() => {
      observer.disconnect();
      childObserver.disconnect();
      rovingTabindex?.destroy();
    });
  },
});

export {};
