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

  styles: `
    w-link { display: inline; }
    w-link > a { color: inherit; text-decoration: inherit; outline: revert; }
    w-link[variant="subtle"] > a    { text-decoration: none; }
    w-link[variant="underline"] > a { text-decoration: underline; }
    w-link[disabled] > a {
      pointer-events: none;
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,

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

        // Prevent navigation when disabled
        anchorElement.onclick = (e) => {
          e.preventDefault();
          return false;
        };
      } else {
        anchorElement.removeAttribute(ARIA.disabled);
        anchorElement.tabIndex = 0;
        anchorElement.onclick = null;
      }
    };

    // Initial setup
    createAnchor();

    // Observe attribute changes (variant is CSS-driven; href/external/disabled
    // touch ARIA and listeners so they still need JS handling).
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.attributeName === "href" ||
          mutation.attributeName === "external" ||
          mutation.attributeName === "disabled"
        ) {
          updateAnchor();
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
