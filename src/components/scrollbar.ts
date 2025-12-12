import { defineComponent } from "../factory";

interface ScrollbarElement extends HTMLElement {
  orientation: "horizontal" | "vertical" | "both";
}

defineComponent({
  tag: "w-scrollbar",

  props: [{ name: "orientation", type: String, default: "vertical" }],

  aria: {
    role: "none",
  },

  setup(ctx) {
    const el = ctx.element as unknown as ScrollbarElement;

    const applyStyles = (): void => {
      // Set display to block if not set
      if (!el.style.display) {
        el.style.display = "block";
      }

      // Make focusable for keyboard scrolling (WCAG requirement)
      if (!el.hasAttribute("tabindex")) {
        el.setAttribute("tabindex", "0");
      }

      // Apply overflow based on orientation
      switch (el.orientation) {
        case "horizontal":
          el.style.overflowX = "auto";
          el.style.overflowY = "hidden";
          break;
        case "both":
          el.style.overflow = "auto";
          break;
        case "vertical":
        default:
          el.style.overflowX = "hidden";
          el.style.overflowY = "auto";
          break;
      }
    };

    // Apply initial styles
    applyStyles();

    // Handle wheel events - convert vertical wheel to horizontal scroll when horizontal
    const handleWheel = (e: WheelEvent): void => {
      if (el.orientation === "horizontal" && e.deltaY !== 0 && e.deltaX === 0) {
        // Convert vertical wheel to horizontal scroll
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });

    // Watch for orientation changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "orientation") {
          applyStyles();
        }
      }
    });

    observer.observe(el, { attributes: true });
    ctx.onCleanup(() => {
      observer.disconnect();
      el.removeEventListener("wheel", handleWheel);
    });

    // Public API - expose native scroll methods
    Object.assign(el, {
      scrollToPosition(x: number, y: number): void {
        el.scroll({ left: x, top: y, behavior: "smooth" });
      },

      scrollByAmount(x: number, y: number): void {
        el.scrollBy({ left: x, top: y, behavior: "smooth" });
      },
    });
  },
});

export {};
