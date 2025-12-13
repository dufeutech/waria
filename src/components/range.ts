import { defineComponent } from "../factory";
import { setAriaOrientation, setAriaLabel } from "../aria";
import { SLOT, ARIA } from "../constants";

interface RangeElement extends HTMLElement {
  min: number;
  max: number;
  value: number;
  step: number;
  orientation: "horizontal" | "vertical";
  disabled: boolean;
  label: string;
  name: string;
}

defineComponent({
  tag: "w-range",

  props: [
    { name: "min", type: Number, default: 0 },
    { name: "max", type: Number, default: 100 },
    { name: "value", type: Number, default: 0 },
    { name: "step", type: Number, default: 1 },
    { name: "orientation", type: String, default: "horizontal" },
    { name: "disabled", type: Boolean, default: false },
    { name: "label", type: String, default: "" },
    { name: "name", type: String, default: "" },
  ],

  children: {
    track: SLOT.rail,
    fill: SLOT.fill,
    thumb: SLOT.knob,
  },

  events: {
    keydown: {
      selector: SLOT.knob,
      handler: "handleKeyDown",
    },
    pointerdown: {
      selector: SLOT.knob,
      handler: "handlePointerDown",
    },
    wheel: {
      handler: "handleWheel",
    },
  },

  aria: {
    role: "none",
  },

  setup(ctx) {
    const el = ctx.element as unknown as RangeElement;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startValue = 0;
    let hiddenInput: HTMLInputElement | null = null;

    const getThumb = (): HTMLElement | null =>
      ctx.query<HTMLElement>(SLOT.knob);
    const getTrack = (): HTMLElement | null =>
      ctx.query<HTMLElement>(SLOT.rail);
    const getFill = (): HTMLElement | null => ctx.query<HTMLElement>(SLOT.fill);

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

    // Handle click on component to focus thumb (for label association)
    const handleClick = (e: MouseEvent): void => {
      // If click is not on thumb, focus the thumb
      const thumb = getThumb();
      if (thumb && e.target !== thumb && !thumb.contains(e.target as Node)) {
        thumb.focus();
      }
    };

    ctx.element.addEventListener("click", handleClick);

    const updateHiddenInput = (): void => {
      if (hiddenInput) {
        hiddenInput.value = String(el.value);
      }
    };

    const clamp = (value: number): number => {
      return Math.min(Math.max(value, el.min), el.max);
    };

    const roundToStep = (value: number): number => {
      const steps = Math.round((value - el.min) / el.step);
      return el.min + steps * el.step;
    };

    const getPercentage = (): number => {
      const range = el.max - el.min;
      if (range === 0) return 0;
      return ((el.value - el.min) / range) * 100;
    };

    const updateAria = (): void => {
      const thumb = getThumb();
      if (!thumb) return;

      thumb.setAttribute("role", "slider");
      thumb.setAttribute(ARIA.valuemin, String(el.min));
      thumb.setAttribute(ARIA.valuemax, String(el.max));
      thumb.setAttribute(ARIA.valuenow, String(el.value));

      // Calculate value text
      const percentage = getPercentage();
      thumb.setAttribute(
        ARIA.valuetext,
        `${el.value} (${Math.round(percentage)}%)`
      );

      if (el.label) {
        setAriaLabel(thumb, el.label);
      }

      setAriaOrientation(thumb, el.orientation);

      if (el.disabled) {
        thumb.setAttribute(ARIA.disabled, "true");
        thumb.setAttribute("tabindex", "-1");
      } else {
        thumb.removeAttribute(ARIA.disabled);
        thumb.setAttribute("tabindex", "0");
      }
    };

    const updateVisuals = (): void => {
      const thumb = getThumb();
      const fill = getFill();
      const percentage = getPercentage();

      if (thumb) {
        if (el.orientation === "horizontal") {
          thumb.style.left = `${percentage}%`;
          thumb.style.top = "";
          thumb.style.transform = "translateX(-50%)";
        } else {
          thumb.style.bottom = `${percentage}%`;
          thumb.style.left = "";
          thumb.style.transform = "translateY(50%)";
        }
      }

      if (fill) {
        if (el.orientation === "horizontal") {
          fill.style.width = `${percentage}%`;
          fill.style.height = "100%";
          fill.style.bottom = "";
          fill.style.top = "";
        } else {
          fill.style.height = `${percentage}%`;
          fill.style.width = "100%";
          fill.style.position = "absolute";
          fill.style.bottom = "0";
          fill.style.top = "";
        }
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

        const isHorizontal = el.orientation === "horizontal";
        const pageMultiplier = 10;

        switch (e.key) {
          case "ArrowRight":
            if (isHorizontal) {
              e.preventDefault();
              increment();
            }
            break;
          case "ArrowLeft":
            if (isHorizontal) {
              e.preventDefault();
              decrement();
            }
            break;
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
            increment(pageMultiplier);
            break;
          case "PageDown":
            e.preventDefault();
            decrement(pageMultiplier);
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

      handlePointerDown(e: PointerEvent): void {
        if (el.disabled) return;

        const thumb = getThumb();
        if (!thumb) return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startValue = el.value;

        thumb.setPointerCapture(e.pointerId);

        const handlePointerMove = (moveEvent: PointerEvent): void => {
          if (!isDragging) return;

          const track = getTrack();
          if (!track) return;

          const trackRect = track.getBoundingClientRect();
          const isHorizontal = el.orientation === "horizontal";

          let delta: number;
          let trackSize: number;

          if (isHorizontal) {
            delta = moveEvent.clientX - startX;
            trackSize = trackRect.width;
          } else {
            delta = -(moveEvent.clientY - startY);
            trackSize = trackRect.height;
          }

          const range = el.max - el.min;
          const deltaValue = (delta / trackSize) * range;
          setValue(startValue + deltaValue);
        };

        const handlePointerUp = (): void => {
          isDragging = false;
          thumb.releasePointerCapture(e.pointerId);
          document.removeEventListener("pointermove", handlePointerMove);
          document.removeEventListener("pointerup", handlePointerUp);
        };

        document.addEventListener("pointermove", handlePointerMove);
        document.addEventListener("pointerup", handlePointerUp);
      },

      handleWheel(e: WheelEvent): void {
        if (el.disabled) return;

        // Prevent page scroll
        e.preventDefault();

        // Use deltaY for both horizontal and vertical ranges
        // Scrolling up/left = increment, down/right = decrement
        const delta = e.deltaY || e.deltaX;
        if (delta < 0) {
          increment();
        } else if (delta > 0) {
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
            "orientation",
            "disabled",
            "label",
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
    ctx.onCleanup(() => {
      observer.disconnect();
      ctx.element.removeEventListener("click", handleClick);
    });
  },
});

export {};
