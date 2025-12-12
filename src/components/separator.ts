import { defineComponent } from "../factory";
import { ARIA } from "../constants";

interface SeparatorElement extends HTMLElement {
  orientation: "horizontal" | "vertical";
  decorative: boolean;
}

defineComponent({
  tag: "w-separator",

  props: [
    { name: "orientation", type: String, default: "horizontal" },
    { name: "decorative", type: Boolean, default: false },
  ],

  setup(ctx) {
    const el = ctx.element as unknown as SeparatorElement;

    const updateAria = (): void => {
      if (el.decorative) {
        // Decorative separators are hidden from accessibility tree
        el.setAttribute(ARIA.hidden, "true");
        el.removeAttribute("role");
      } else {
        el.setAttribute("role", "separator");
        el.removeAttribute(ARIA.hidden);
        el.setAttribute(ARIA.orientation, el.orientation);
      }
    };

    updateAria();

    // Observe attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.attributeName === "orientation" ||
          mutation.attributeName === "decorative"
        ) {
          updateAria();
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });

    ctx.onCleanup(() => {
      observer.disconnect();
    });
  },
});

export {};
