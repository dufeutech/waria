import { defineComponent } from "../factory";
import { onAttributeChange } from "../core/observe";
import { SLOT, ARIA } from "../constants";

interface ProgressbarElement extends HTMLElement {
  value: number;
  min: number;
  max: number;
  indeterminate: boolean;
  label: string;
}

defineComponent({
  tag: "w-progressbar",

  props: [
    { name: "value", type: Number, default: 0 },
    { name: "min", type: Number, default: 0 },
    { name: "max", type: Number, default: 100 },
    { name: "indeterminate", type: Boolean, default: false },
    { name: "label", type: String, default: "" },
  ],

  children: {
    indicator: SLOT.indicator,
  },

  aria: {
    role: "progressbar",
  },

  setup(ctx) {
    const el = ctx.element as unknown as ProgressbarElement;

    const getIndicator = (): HTMLElement | null =>
      ctx.query<HTMLElement>(SLOT.indicator);

    const updateAria = (): void => {
      ctx.element.setAttribute(ARIA.valuemin, String(el.min));
      ctx.element.setAttribute(ARIA.valuemax, String(el.max));

      if (el.label) {
        ctx.element.setAttribute(ARIA.label, el.label);
      }

      if (el.indeterminate) {
        // Indeterminate progress bars don't have a current value
        ctx.element.removeAttribute(ARIA.valuenow);
      } else {
        // Clamp value between min and max
        const clampedValue = Math.max(el.min, Math.min(el.max, el.value));
        ctx.element.setAttribute(ARIA.valuenow, String(clampedValue));
      }
    };

    const updateVisual = (): void => {
      // Calculate percentage for visual indicator
      const indicator = getIndicator();
      if (indicator && !el.indeterminate) {
        const range = el.max - el.min;
        const percentage = range > 0 ? ((el.value - el.min) / range) * 100 : 0;
        indicator.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
      }
    };

    updateAria();
    updateVisual();

    const update = (): void => {
      updateAria();
      updateVisual();
    };

    ctx.onCleanup(
      onAttributeChange(
        ctx.element,
        ["value", "min", "max", "indeterminate", "label"],
        update
      )
    );
  },
});

export {};
