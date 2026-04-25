import { defineComponent } from "../factory";

interface AspectRatioElement extends HTMLElement {
  ratio: string;
}

// Default layout: container becomes a relatively-positioned block with the
// requested aspect-ratio; any direct child (or `<w-slot body>` content)
// absolutely fills it. `:where()` keeps specificity at 0 so users can override.
const STYLE_ID = "w-aspect-ratio-defaults";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
:where(w-aspect-ratio) {
  display: block;
  position: relative;
  width: 100%;
}
:where(w-aspect-ratio) > :where(:not(w-slot)),
:where(w-aspect-ratio) > :where(w-slot[body]) > * {
  position: absolute;
  inset: 0;
  object-fit: cover;
}
`;
  document.head.appendChild(style);
}

defineComponent({
  tag: "w-aspect-ratio",

  props: [{ name: "ratio", type: String, default: "1/1" }],

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
      const decimal = parseFloat(ratioStr);
      return !isNaN(decimal) ? decimal : 1;
    };

    const applyRatio = (): void => {
      el.style.aspectRatio = String(parseRatio(el.ratio));
    };

    applyRatio();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "ratio") {
          applyRatio();
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });
    ctx.onCleanup(() => observer.disconnect());
  },
});

export {};
