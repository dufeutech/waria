import { defineComponent } from "../factory";
import { SLOT } from "../constants";

interface AspectRatioElement extends HTMLElement {
  ratio: string;
}

defineComponent({
  tag: "w-aspect-ratio",

  props: [{ name: "ratio", type: String, default: "1/1" }],

  children: {
    content: SLOT.body,
  },

  aria: {
    role: "none",
  },

  setup(ctx) {
    const el = ctx.element as unknown as AspectRatioElement;

    const parseRatio = (ratioStr: string): number => {
      const parts = ratioStr.split("/");
      if (parts.length === 2) {
        const width = parseFloat(parts[0]);
        const height = parseFloat(parts[1]);
        if (!isNaN(width) && !isNaN(height) && height !== 0) {
          return width / height;
        }
      }
      // Try parsing as decimal
      const decimal = parseFloat(ratioStr);
      if (!isNaN(decimal)) {
        return decimal;
      }
      return 1;
    };

    const updateStyles = (): void => {
      const content = ctx.query<HTMLElement>(SLOT.body);
      const ratio = parseRatio(el.ratio);

      // Apply styles to container using CSS aspect-ratio if supported
      // with padding-bottom fallback
      el.style.position = "relative";
      el.style.width = "100%";

      // Modern browsers support CSS aspect-ratio
      if (CSS.supports("aspect-ratio", "1")) {
        el.style.aspectRatio = String(ratio);
        el.style.paddingBottom = "0";
      } else {
        // Fallback for older browsers
        el.style.paddingBottom = `${(1 / ratio) * 100}%`;
      }

      // Apply styles to content
      if (content) {
        content.style.position = "absolute";
        content.style.top = "0";
        content.style.left = "0";
        content.style.width = "100%";
        content.style.height = "100%";
        content.style.objectFit = "cover";
      }
    };

    updateStyles();

    // Observe attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "ratio") {
          updateStyles();
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });
    ctx.onCleanup(() => observer.disconnect());
  },
});

export {};
