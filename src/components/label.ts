import { defineComponent } from "../factory";

interface LabelElement extends HTMLElement {
  for: string;
  required: boolean;
  disabled: boolean;
}

// Priority-ordered selectors for focusable elements inside custom components
// We check in priority order to ensure primary interactive elements are focused
// before auxiliary elements like buttons
const FOCUSABLE_SELECTORS_PRIORITY = [
  // Primary interactive roles
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="textbox"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  // Slot-based selectors for custom components
  '[slot="input"]',
  '[slot="thumb"]',
  '[slot="trigger"]',
  // Native form elements
  "input:not([type=hidden])",
  "textarea",
  "select",
  // Lower priority - buttons and generic tabindex
  '[role="button"]',
  "button",
  '[tabindex="0"]',
];

// Check if element is a custom web component
const isCustomComponent = (element: Element): boolean => {
  return element.tagName.includes("-");
};

// Find the focusable element inside a custom component
// Checks selectors in priority order to focus the main interactive element
const findFocusableElement = (element: Element): HTMLElement | null => {
  // If element itself is focusable (native input, button, etc.)
  if (
    element.matches("input, textarea, select, button") &&
    !element.hasAttribute("disabled")
  ) {
    return element as HTMLElement;
  }

  // For custom components, find the interactive element inside
  // Check in priority order to ensure we find the primary element
  if (isCustomComponent(element)) {
    for (const selector of FOCUSABLE_SELECTORS_PRIORITY) {
      const focusable = element.querySelector<HTMLElement>(selector);
      if (focusable && !focusable.hasAttribute("disabled")) {
        return focusable;
      }
    }
  }

  // Check if element itself has a focusable role or tabindex
  for (const selector of FOCUSABLE_SELECTORS_PRIORITY) {
    if (element.matches(selector) && !element.hasAttribute("disabled")) {
      return element as HTMLElement;
    }
  }

  return null;
};

defineComponent({
  tag: "w-label",

  props: [
    { name: "for", type: String, default: "" },
    { name: "required", type: Boolean, default: false },
    { name: "disabled", type: Boolean, default: false },
  ],

  aria: {
    role: "none", // w-label itself has no role; the native label inside does
  },

  setup(ctx) {
    const el = ctx.element as unknown as LabelElement;
    let nativeLabel: HTMLLabelElement | null = null;
    let customClickHandler: ((e: MouseEvent) => void) | null = null;

    // Get the target element referenced by for attribute
    const getTargetElement = (): Element | null => {
      if (!el.for) return null;
      return document.getElementById(el.for);
    };

    // Handle click on label to focus the target element or its focusable child
    const handleLabelClick = (e: MouseEvent): void => {
      if (el.disabled || !el.for) return;

      const target = getTargetElement();
      if (!target) return;

      // Find the focusable element (works for both native and custom components)
      const focusable = findFocusableElement(target);
      if (focusable) {
        e.preventDefault();
        focusable.focus();
      }
    };

    const wrapContent = (): void => {
      // Create native label if not exists
      if (!nativeLabel) {
        nativeLabel = document.createElement("label");
        // Move all child nodes into the native label
        while (el.firstChild) {
          nativeLabel.appendChild(el.firstChild);
        }
        el.appendChild(nativeLabel);

        // Always use click handler instead of native for attribute
        // This ensures proper focus management for both native and custom components
        customClickHandler = handleLabelClick;
        nativeLabel.addEventListener("click", customClickHandler);
      }

      // Never use native for attribute - we handle focus via click handler
      // This ensures consistent behavior across native inputs and custom components
      nativeLabel.removeAttribute("for");
    };

    const updateStyles = (): void => {
      if (!nativeLabel) return;

      // Add cursor pointer for clickable labels (on both elements)
      if (el.for && !el.disabled) {
        el.style.cursor = "pointer";
        nativeLabel.style.cursor = "pointer";
      } else {
        el.style.cursor = "default";
        nativeLabel.style.cursor = "default";
      }

      // Handle disabled state
      if (el.disabled) {
        nativeLabel.style.color = "#666666";
        nativeLabel.style.pointerEvents = "none";
      } else {
        nativeLabel.style.color = "";
        nativeLabel.style.pointerEvents = "";
      }
    };

    wrapContent();
    updateStyles();

    // Observe attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "for") {
          wrapContent(); // Re-check target and update accordingly
          updateStyles();
        } else if (
          mutation.attributeName === "disabled" ||
          mutation.attributeName === "required"
        ) {
          updateStyles();
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });

    ctx.onCleanup(() => {
      observer.disconnect();
      if (customClickHandler && nativeLabel) {
        nativeLabel.removeEventListener("click", customClickHandler);
      }
    });
  },
});

export {};
