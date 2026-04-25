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

  styles: `
    w-avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      user-select: none;
      vertical-align: middle;
      background: #e2e8f0;
      color: #475569;
      width: 2.5rem;
      height: 2.5rem;
      font-size: 1rem;
      border-radius: 50%;
    }
    /* Size variants */
    w-avatar[size="small"]  { width: 2rem;   height: 2rem;   font-size: 0.75rem; }
    w-avatar[size="medium"] { width: 2.5rem; height: 2.5rem; font-size: 1rem; }
    w-avatar[size="large"]  { width: 3rem;   height: 3rem;   font-size: 1.25rem; }
    /* Shape variants */
    w-avatar[shape="circle"]  { border-radius: 50%; }
    w-avatar[shape="square"]  { border-radius: 0; }
    w-avatar[shape="rounded"] { border-radius: 0.375rem; }
    /* Image and fallback fill the host */
    w-avatar > img { width: 100%; height: 100%; object-fit: cover; }
  `,

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

    updateAria();
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
          } else if (attr === "decorative" || attr === "label") {
            updateAria();
          }
          // size/shape are handled by attribute-selector CSS
        },
      })
    );
  },
});

export {};
