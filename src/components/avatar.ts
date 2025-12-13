import { defineComponent } from "../factory";
import { observeAttributes } from "../core/observe";
import { SLOT, ARIA } from "../constants";

interface AvatarElement extends HTMLElement {
  src: string;
  fallback: string;
  size: "small" | "medium" | "large";
  shape: "circle" | "square" | "rounded";
  decorative: boolean;
  label: string;
}

defineComponent({
  tag: "w-avatar",

  props: [
    { name: "src", type: String, default: "" },
    { name: "fallback", type: String, default: "" },
    { name: "size", type: String, default: "medium" },
    { name: "shape", type: String, default: "circle" },
    { name: "decorative", type: Boolean, default: false },
    { name: "label", type: String, default: "" },
  ],

  children: {
    image: SLOT.img,
    fallbackSlot: SLOT.alt,
  },

  setup(ctx) {
    const el = ctx.element as unknown as AvatarElement;

    let imageLoaded = false;
    let imageFailed = false;
    let imgElement: HTMLImageElement | null = null;

    const updateAria = (): void => {
      // Set role for accessibility
      if (el.decorative) {
        el.setAttribute("role", "presentation");
        el.setAttribute(ARIA.hidden, "true");
      } else {
        el.setAttribute("role", "img");
        el.removeAttribute(ARIA.hidden);
        if (el.label) {
          el.setAttribute(ARIA.label, el.label);
        }
      }
    };

    const updateDisplay = (): void => {
      // Check for slotted image first
      const slottedImage = ctx.query<HTMLElement>(SLOT.img);
      const slottedFallback = ctx.query<HTMLElement>(SLOT.alt);

      if (slottedImage) {
        slottedImage.hidden = imageFailed;
      }

      if (slottedFallback) {
        slottedFallback.hidden = !imageFailed && imageLoaded;
      }

      // Handle src-based image
      if (el.src && !slottedImage) {
        if (!imgElement) {
          imgElement = document.createElement("img");
          imgElement.style.width = "100%";
          imgElement.style.height = "100%";
          imgElement.style.objectFit = "cover";
          imgElement.setAttribute(ARIA.hidden, "true"); // Avatar itself has the label

          imgElement.onload = () => {
            imageLoaded = true;
            imageFailed = false;
            updateDisplay();
          };

          imgElement.onerror = () => {
            imageLoaded = false;
            imageFailed = true;
            updateDisplay();
          };

          el.insertBefore(imgElement, el.firstChild);
        }

        imgElement.src = el.src;
        imgElement.hidden = imageFailed;
      } else if (imgElement && !el.src) {
        imgElement.remove();
        imgElement = null;
      }

      // Show fallback text if no image or image failed
      const showFallback = (!el.src && !slottedImage) || imageFailed;

      // If we have fallback text and need to show it, create/update fallback element
      if (showFallback && el.fallback && !slottedFallback) {
        let fallbackEl = el.querySelector(".w-avatar-fallback") as HTMLElement;
        if (!fallbackEl) {
          fallbackEl = document.createElement("span");
          fallbackEl.className = "w-avatar-fallback";
          fallbackEl.style.display = "flex";
          fallbackEl.style.alignItems = "center";
          fallbackEl.style.justifyContent = "center";
          fallbackEl.style.width = "100%";
          fallbackEl.style.height = "100%";
          fallbackEl.setAttribute(ARIA.hidden, "true"); // Avatar itself has the label
          el.appendChild(fallbackEl);
        }
        fallbackEl.textContent = el.fallback;
        fallbackEl.hidden = false;
      } else {
        const fallbackEl = el.querySelector(".w-avatar-fallback");
        if (fallbackEl) {
          (fallbackEl as HTMLElement).hidden = !showFallback;
        }
      }

      // Hide img element if showing fallback
      if (imgElement) {
        imgElement.hidden = showFallback;
      }
    };

    const updateStyles = (): void => {
      // Base styles
      el.style.display = "inline-flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.overflow = "hidden";
      el.style.userSelect = "none";
      el.style.verticalAlign = "middle";

      // Size
      const sizeMap: Record<string, string> = {
        small: "2rem",
        medium: "2.5rem",
        large: "3rem",
      };
      const size = sizeMap[el.size] || sizeMap.medium;
      el.style.width = size;
      el.style.height = size;
      el.style.fontSize =
        el.size === "small"
          ? "0.75rem"
          : el.size === "large"
          ? "1.25rem"
          : "1rem";

      // Shape
      switch (el.shape) {
        case "circle":
          el.style.borderRadius = "50%";
          break;
        case "square":
          el.style.borderRadius = "0";
          break;
        case "rounded":
          el.style.borderRadius = "0.375rem";
          break;
        default:
          el.style.borderRadius = "50%";
      }

      // Default background for fallback
      if (!el.style.backgroundColor) {
        el.style.backgroundColor = "#e2e8f0";
        el.style.color = "#475569";
      }
    };

    updateAria();
    updateStyles();
    updateDisplay();

    ctx.onCleanup(
      observeAttributes({
        element: ctx.element,
        attributes: ["src", "fallback", "size", "shape", "decorative", "label"],
        handler: (attr) => {
          if (attr === "src") {
            imageLoaded = false;
            imageFailed = false;
            updateDisplay();
          } else if (attr === "fallback") {
            updateDisplay();
          } else if (attr === "size" || attr === "shape") {
            updateStyles();
          } else if (attr === "decorative" || attr === "label") {
            updateAria();
          }
        },
      })
    );
  },
});

export {};
