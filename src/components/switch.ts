import { defineComponent } from "../factory";
import { onAttributeChange } from "../core/observe";
import { SLOT, ARIA, KEY } from "../constants";

interface SwitchElement extends HTMLElement {
  pressed: boolean;
  disabled: boolean;
  label: string;
  handleClick(): void;
}

defineComponent({
  tag: "w-switch",

  props: [
    { name: "pressed", type: Boolean, default: false },
    { name: "disabled", type: Boolean, default: false },
    { name: "label", type: String, default: "" },
  ],

  children: {
    trigger: SLOT.trigger,
  },

  events: {
    click: {
      selector: SLOT.trigger,
      handler: "handleClick",
    },
    keydown: {
      selector: SLOT.trigger,
      handler: "handleKeyDown",
    },
  },

  aria: {
    role: "none",
  },

  setup(ctx) {
    const el = ctx.element as unknown as SwitchElement;
    const trigger = ctx.children.trigger as HTMLElement | null;

    const updateAria = (): void => {
      if (!trigger) return;

      trigger.setAttribute("role", "button");
      trigger.setAttribute(ARIA.pressed, String(el.pressed));

      if (el.label) {
        trigger.setAttribute(ARIA.label, el.label);
      }

      if (el.disabled) {
        trigger.setAttribute(ARIA.disabled, "true");
        trigger.setAttribute("tabindex", "-1");
      } else {
        trigger.removeAttribute(ARIA.disabled);
        trigger.setAttribute("tabindex", "0");
      }
    };

    updateAria();

    Object.assign(ctx.element, {
      handleClick(): void {
        if (el.disabled) return;

        el.pressed = !el.pressed;
        updateAria();

        ctx.emit("change", { pressed: el.pressed });
      },

      handleKeyDown(e: KeyboardEvent): void {
        if (el.disabled) return;

        if (e.key === KEY.Enter || e.key === KEY.Space) {
          e.preventDefault();
          el.handleClick();
        }
      },

      toggle(): void {
        el.handleClick();
      },
    });

    ctx.onCleanup(
      onAttributeChange(
        ctx.element,
        ["pressed", "disabled", "label"],
        updateAria
      )
    );
  },
});

export {};
