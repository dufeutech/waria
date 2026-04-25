import { defineComponent } from "../factory";
import { ensureId } from "../aria";
import { forwardClasses } from "../core/forward-class";

interface LabelElement extends HTMLElement {
  for: string;
  required: boolean;
  disabled: boolean;
}

// Elements the browser natively associates with `<label for>`. For these,
// clicking the label fires a synthetic click on the control (focuses,
// toggles checkbox/radio, etc.), so we don't intercept clicks ourselves.
const LABELABLE_SELECTOR =
  "input:not([type=hidden]), textarea, select, button, output, meter, progress";

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
  // Slot-based selectors for custom components (matches `<w-slot X>` content)
  "w-slot[input] > *",
  "w-slot[knob] > *",
  "w-slot[value] > *",
  "w-slot[trigger] > *",
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

// Find the labellable form field inside (or as) the given element. Returns
// disabled fields too — the label still needs to associate with them so that
// AT and lint tools see a labelled field. Callers that want to act on the
// element interactively (focus, click forwarding) should additionally check
// the disabled / aria-disabled state.
const findFocusableElement = (element: Element): HTMLElement | null => {
  if (element.matches("input, textarea, select, button")) {
    return element as HTMLElement;
  }

  if (isCustomComponent(element)) {
    for (const selector of FOCUSABLE_SELECTORS_PRIORITY) {
      const focusable = element.querySelector<HTMLElement>(selector);
      if (focusable) return focusable;
    }
  }

  for (const selector of FOCUSABLE_SELECTORS_PRIORITY) {
    if (element.matches(selector)) {
      return element as HTMLElement;
    }
  }

  return null;
};

defineComponent({
  tag: "w-label",

  styles: `
    w-label { cursor: pointer; }
    w-label[disabled] { cursor: default; pointer-events: none; }
    w-label[disabled] > label { color: #666; }
  `,

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

    // Resolve the labelled element. Priority: explicit `for` id → first
    // following sibling that contains a focusable form field. Falling back to
    // siblings means consumers can drop the `for`/`id` boilerplate when the
    // label sits next to its field, and it still associates correctly.
    const getTargetElement = (): Element | null => {
      if (el.for) {
        const explicit = document.getElementById(el.for);
        if (explicit) return explicit;
      }
      let sibling = el.nextElementSibling;
      while (sibling) {
        if (findFocusableElement(sibling)) return sibling;
        sibling = sibling.nextElementSibling;
      }
      return null;
    };

    // Handle click on label only when the focusable target isn't a native
    // labelable element. Native labelable elements get click forwarding for
    // free via the `<label for>` association we set in associateLabel.
    const handleLabelClick = (e: MouseEvent): void => {
      if (el.disabled) return;

      const target = getTargetElement();
      if (!target) return;

      const focusable = findFocusableElement(target);
      if (!focusable) return;
      if (
        focusable.hasAttribute("disabled") ||
        focusable.getAttribute("aria-disabled") === "true"
      )
        return;
      if (focusable.matches(LABELABLE_SELECTOR)) return;

      e.preventDefault();
      focusable.focus();
    };

    const wrapContent = (): void => {
      if (!nativeLabel) {
        nativeLabel = document.createElement("label");
        while (el.firstChild) {
          nativeLabel.appendChild(el.firstChild);
        }
        el.appendChild(nativeLabel);

        customClickHandler = handleLabelClick;
        nativeLabel.addEventListener("click", customClickHandler);
      }
    };

    // Resolve the actual focusable form field, give it an id, and wire up
    // both the native `<label for>` association and aria-labelledby. This
    // satisfies a11y tools that expect form fields to have an id and a
    // discoverable label, for native inputs and custom widgets alike.
    const associateLabel = (): void => {
      if (!nativeLabel) return;

      // Always associate (even when label/field is disabled) so AT and lint
      // tools see a labelled field with an id; the click handler is what gates
      // interaction, not the association.
      const target = getTargetElement();
      const focusable = target ? findFocusableElement(target) : null;

      if (!focusable) {
        nativeLabel.removeAttribute("for");
        return;
      }

      ensureId(focusable, "w-label-target");
      ensureId(nativeLabel, "w-label");

      nativeLabel.setAttribute("for", focusable.id);

      // aria-labelledby covers non-labelable widgets (e.g. role="slider" divs)
      // where the native `for` association is ignored by AT.
      if (focusable.getAttribute("aria-labelledby") !== nativeLabel.id) {
        focusable.setAttribute("aria-labelledby", nativeLabel.id);
      }
    };

    wrapContent();
    // Defer one frame so the target's setup (which may set role/ids on its
    // inner focusable) has a chance to run before we resolve the association.
    requestAnimationFrame(associateLabel);

    // w-label is a shapeless wrapper, so classes on the host should style the
    // inner <label> (which is the actual rendered element).
    const stopForwarding = nativeLabel
      ? forwardClasses(el, nativeLabel)
      : () => {};

    // Observe attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.attributeName === "for" ||
          mutation.attributeName === "disabled" ||
          mutation.attributeName === "required"
        ) {
          associateLabel();
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });

    ctx.onCleanup(() => {
      observer.disconnect();
      stopForwarding();
      if (customClickHandler && nativeLabel) {
        nativeLabel.removeEventListener("click", customClickHandler);
      }
    });
  },
});

export {};
