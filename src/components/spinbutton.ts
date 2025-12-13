import { defineComponent } from "../factory";
import { setAriaLabel } from "../aria";
import { SLOT, ARIA } from "../constants";

interface SpinbuttonElement extends HTMLElement {
  min: number;
  max: number;
  value: number;
  step: number;
  pageStep: number;
  disabled: boolean;
  label: string;
  name: string;
  wrap: boolean;
}

defineComponent({
  tag: "w-spinbutton",

  props: [
    { name: "min", type: Number, default: 0 },
    { name: "max", type: Number, default: 100 },
    { name: "value", type: Number, default: 0 },
    { name: "step", type: Number, default: 1 },
    { name: "pageStep", type: Number, default: 10 },
    { name: "disabled", type: Boolean, default: false },
    { name: "label", type: String, default: "" },
    { name: "name", type: String, default: "" },
    { name: "wrap", type: Boolean, default: false },
  ],

  children: {
    input: SLOT.input,
    display: SLOT.value,
    increment: SLOT.up,
    decrement: SLOT.down,
  },

  events: {
    keydown: {
      handler: "handleKeyDown",
    },
    click: [
      {
        selector: SLOT.up,
        handler: "handleIncrement",
      },
      {
        selector: SLOT.down,
        handler: "handleDecrement",
      },
    ],
    input: {
      selector: SLOT.input,
      handler: "handleInput",
    },
    wheel: {
      handler: "handleWheel",
    },
  },

  aria: {
    role: "group",
  },

  setup(ctx) {
    const el = ctx.element as unknown as SpinbuttonElement;

    let hiddenInput: HTMLInputElement | null = null;

    const getInput = (): HTMLInputElement | null =>
      ctx.query<HTMLInputElement>(SLOT.input);
    const getDisplay = (): HTMLElement | null =>
      ctx.query<HTMLElement>(SLOT.value);
    const getIncrement = (): HTMLElement | null =>
      ctx.query<HTMLElement>(SLOT.up);
    const getDecrement = (): HTMLElement | null =>
      ctx.query<HTMLElement>(SLOT.down);

    // Create hidden input for form compatibility
    const setupHiddenInput = (): void => {
      if (el.name) {
        if (!hiddenInput) {
          hiddenInput = document.createElement("input");
          hiddenInput.type = "hidden";
          ctx.element.appendChild(hiddenInput);
        }
        hiddenInput.name = el.name;
        hiddenInput.value = String(el.value);
      } else if (hiddenInput) {
        hiddenInput.remove();
        hiddenInput = null;
      }
    };

    const updateHiddenInput = (): void => {
      if (hiddenInput) {
        hiddenInput.value = String(el.value);
      }
    };

    const clamp = (value: number): number => {
      if (el.wrap) {
        const range = el.max - el.min + el.step;
        let result = value;
        while (result > el.max) result -= range;
        while (result < el.min) result += range;
        return result;
      }
      return Math.min(Math.max(value, el.min), el.max);
    };

    const roundToStep = (value: number): number => {
      const steps = Math.round((value - el.min) / el.step);
      return el.min + steps * el.step;
    };

    const updateAria = (): void => {
      const input = getInput();
      const display = getDisplay();
      const target = input || display || ctx.element;

      // Set spinbutton role on the focusable element
      target.setAttribute("role", "spinbutton");
      target.setAttribute(ARIA.valuemin, String(el.min));
      target.setAttribute(ARIA.valuemax, String(el.max));
      target.setAttribute(ARIA.valuenow, String(el.value));

      if (el.label) {
        setAriaLabel(target, el.label);
      }

      if (el.disabled) {
        target.setAttribute(ARIA.disabled, "true");
        target.setAttribute("tabindex", "-1");
      } else {
        target.removeAttribute(ARIA.disabled);
        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "0");
        }
      }

      // Update increment/decrement button states
      const increment = getIncrement();
      const decrement = getDecrement();

      if (increment) {
        if (!el.wrap && el.value >= el.max) {
          increment.setAttribute(ARIA.disabled, "true");
        } else {
          increment.removeAttribute(ARIA.disabled);
        }
      }

      if (decrement) {
        if (!el.wrap && el.value <= el.min) {
          decrement.setAttribute(ARIA.disabled, "true");
        } else {
          decrement.removeAttribute(ARIA.disabled);
        }
      }
    };

    const updateVisuals = (): void => {
      const input = getInput();
      const display = getDisplay();

      if (input) {
        input.value = String(el.value);
      }

      if (display) {
        display.textContent = String(el.value);
      }
    };

    const setValue = (newValue: number, emitEvent = true): void => {
      const oldValue = el.value;
      const clampedValue = clamp(roundToStep(newValue));

      if (clampedValue === oldValue) return;

      el.value = clampedValue;
      updateAria();
      updateVisuals();
      updateHiddenInput();

      if (emitEvent) {
        ctx.emit("change", { value: el.value, oldValue });
        ctx.emit("input", { value: el.value });
      }
    };

    const increment = (multiplier = 1): void => {
      setValue(el.value + el.step * multiplier);
    };

    const decrement = (multiplier = 1): void => {
      setValue(el.value - el.step * multiplier);
    };

    // Initial setup
    updateAria();
    updateVisuals();
    setupHiddenInput();

    Object.assign(ctx.element, {
      handleKeyDown(e: KeyboardEvent): void {
        if (el.disabled) return;

        const target = e.target as HTMLElement;
        const input = getInput();
        const display = getDisplay();
        const spinbuttonTarget = input || display;

        // Only handle keys when focus is on the spinbutton control
        if (target !== spinbuttonTarget && !ctx.element.contains(target))
          return;

        switch (e.key) {
          case "ArrowUp":
            e.preventDefault();
            increment();
            break;
          case "ArrowDown":
            e.preventDefault();
            decrement();
            break;
          case "PageUp":
            e.preventDefault();
            increment(el.pageStep / el.step);
            break;
          case "PageDown":
            e.preventDefault();
            decrement(el.pageStep / el.step);
            break;
          case "Home":
            e.preventDefault();
            setValue(el.min);
            break;
          case "End":
            e.preventDefault();
            setValue(el.max);
            break;
        }
      },

      handleIncrement(e: Event): void {
        if (el.disabled) return;
        e.preventDefault();
        increment();
        // Keep focus on the spinbutton control
        const input = getInput();
        const display = getDisplay();
        (input || display)?.focus();
      },

      handleDecrement(e: Event): void {
        if (el.disabled) return;
        e.preventDefault();
        decrement();
        // Keep focus on the spinbutton control
        const input = getInput();
        const display = getDisplay();
        (input || display)?.focus();
      },

      handleInput(e: Event): void {
        if (el.disabled) return;

        const input = e.target as HTMLInputElement;
        const numValue = parseFloat(input.value);

        if (!isNaN(numValue)) {
          setValue(numValue);
        }
      },

      handleWheel(e: WheelEvent): void {
        if (el.disabled) return;

        const target = e.target as HTMLElement;
        const input = getInput();
        const display = getDisplay();

        // Only handle wheel when focus is on the spinbutton control
        if (target !== input && target !== display) return;

        e.preventDefault();

        if (e.deltaY < 0) {
          increment();
        } else if (e.deltaY > 0) {
          decrement();
        }
      },

      // Public API
      setValue(value: number): void {
        setValue(value);
      },

      getValue(): number {
        return el.value;
      },

      increment(): void {
        increment();
      },

      decrement(): void {
        decrement();
      },

      stepUp(steps = 1): void {
        increment(steps);
      },

      stepDown(steps = 1): void {
        decrement(steps);
      },
    });

    // Watch for attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const attr = mutation.attributeName ?? "";
        if (
          [
            "min",
            "max",
            "value",
            "step",
            "pageStep",
            "disabled",
            "label",
            "wrap",
          ].includes(attr)
        ) {
          updateAria();
          updateVisuals();
          if (attr === "value") {
            updateHiddenInput();
          }
        }
        if (attr === "name") {
          setupHiddenInput();
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });
    ctx.onCleanup(() => observer.disconnect());
  },
});

export {};
