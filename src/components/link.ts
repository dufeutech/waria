import { defineComponent } from "../factory";
import { ARIA } from "../constants";

interface LinkElement extends HTMLElement {
  href: string;
  external: boolean;
  disabled: boolean;
  variant: "default" | "subtle" | "underline";
}

defineComponent({
  tag: "w-link",

  props: [
    { name: "href", type: String, default: "" },
    { name: "external", type: Boolean, default: false },
    { name: "disabled", type: Boolean, default: false },
    { name: "variant", type: String, default: "default" },
  ],

  setup(ctx) {
    const el = ctx.element as unknown as LinkElement;

    let anchorElement: HTMLAnchorElement | null = null;

    const createAnchor = (): void => {
      // Check if anchor already exists or was provided via slot
      const existingAnchor = el.querySelector("a");
      if (existingAnchor) {
        anchorElement = existingAnchor;
      } else {
        // Wrap text content in anchor
        anchorElement = document.createElement("a");
        anchorElement.style.color = "inherit";
        anchorElement.style.textDecoration = "inherit";

        // Move all children to the anchor
        while (el.firstChild) {
          anchorElement.appendChild(el.firstChild);
        }

        el.appendChild(anchorElement);
      }

      updateAnchor();
    };

    const updateAnchor = (): void => {
      if (!anchorElement) return;

      // Set href
      if (el.href) {
        anchorElement.href = el.href;
      } else {
        anchorElement.removeAttribute("href");
      }

      // Handle external links
      if (el.external) {
        anchorElement.target = "_blank";
        anchorElement.rel = "noopener noreferrer";
      } else {
        anchorElement.removeAttribute("target");
        anchorElement.rel = "";
      }

      // Handle disabled state
      if (el.disabled) {
        anchorElement.setAttribute(ARIA.disabled, "true");
        anchorElement.tabIndex = -1;
        anchorElement.style.pointerEvents = "none";
        anchorElement.style.opacity = "0.5";
        anchorElement.style.cursor = "not-allowed";

        // Prevent navigation when disabled
        anchorElement.onclick = (e) => {
          e.preventDefault();
          return false;
        };
      } else {
        anchorElement.removeAttribute(ARIA.disabled);
        anchorElement.tabIndex = 0;
        anchorElement.style.pointerEvents = "";
        anchorElement.style.opacity = "";
        anchorElement.style.cursor = "";
        anchorElement.onclick = null;
      }
    };

    const updateStyles = (): void => {
      // Base styles
      el.style.display = "inline";

      if (!anchorElement) return;

      // Variant styles
      switch (el.variant) {
        case "subtle":
          anchorElement.style.textDecoration = "none";
          break;
        case "underline":
          anchorElement.style.textDecoration = "underline";
          break;
        default:
          anchorElement.style.textDecoration = "";
      }

      // Focus styles via pseudo-class (handled by browser default)
      anchorElement.style.outline = "revert";
    };

    // Initial setup
    createAnchor();
    updateStyles();

    // Observe attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.attributeName === "href" ||
          mutation.attributeName === "external" ||
          mutation.attributeName === "disabled"
        ) {
          updateAnchor();
        } else if (mutation.attributeName === "variant") {
          updateStyles();
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
