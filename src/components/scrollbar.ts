import { defineComponent } from "../factory";

interface ScrollbarElement extends HTMLElement {
  orientation: "horizontal" | "vertical" | "both";
}

defineComponent({
  tag: "w-scrollbar",

  styles: `
    w-scrollbar { display: block; }
    w-scrollbar[orientation="horizontal"] { overflow-x: auto; overflow-y: hidden; }
    w-scrollbar[orientation="vertical"]   { overflow-x: hidden; overflow-y: auto; }
    w-scrollbar[orientation="both"]       { overflow: auto; }
  `,

  props: [{ name: "orientation", type: String, default: "vertical" }],

  aria: {
    role: "none",
  },

  setup(ctx) {
    const el = ctx.element as unknown as ScrollbarElement;

    // Make focusable for keyboard scrolling (WCAG requirement)
    if (!el.hasAttribute("tabindex")) {
      el.setAttribute("tabindex", "0");
    }

    // Handle wheel events - convert vertical wheel to horizontal scroll when horizontal
    const handleWheel = (e: WheelEvent): void => {
      if (el.orientation === "horizontal" && e.deltaY !== 0 && e.deltaX === 0) {
        // Convert vertical wheel to horizontal scroll
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });

    ctx.onCleanup(() => {
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
