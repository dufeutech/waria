import { defineComponent } from "../factory";
import { ensureId } from "../aria";
import { onAttributeChange } from "../core/observe";
import { SLOT, ARIA, KEY } from "../constants";

interface CollapsibleElement extends HTMLElement {
  open: boolean;
  disabled: boolean;
  handleClick(): void;
  toggle(force?: boolean): void;
}

defineComponent({
  tag: "w-collapsible",

  props: [
    { name: "open", type: Boolean, default: false },
    { name: "disabled", type: Boolean, default: false },
  ],

  children: {
    trigger: SLOT.trigger,
    content: SLOT.body,
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

  transitions: {
    content: {
      target: SLOT.body,
      enterClass: "collapsible-enter",
      enterFromClass: "collapsible-enter-from",
      enterToClass: "collapsible-enter-to",
      leaveClass: "collapsible-leave",
      leaveFromClass: "collapsible-leave-from",
      leaveToClass: "collapsible-leave-to",
    },
  },

  setup(ctx) {
    const el = ctx.element as unknown as CollapsibleElement;
    const trigger = ctx.children.trigger as HTMLElement | null;
    const content = ctx.children.content as HTMLElement | null;

    if (!trigger || !content) return;

    const contentId = ensureId(content, "w-collapsible-content");

    const updateAria = (): void => {
      trigger.setAttribute(ARIA.expanded, String(el.open));
      trigger.setAttribute(ARIA.controls, contentId);

      if (el.disabled) {
        trigger.setAttribute(ARIA.disabled, "true");
      } else {
        trigger.removeAttribute(ARIA.disabled);
      }

      content.setAttribute(ARIA.hidden, String(!el.open));
      content.setAttribute("role", "region");
      content.setAttribute(
        ARIA.labelledby,
        ensureId(trigger, "w-collapsible-trigger")
      );

      content.style.display = el.open ? "" : "none";
    };

    updateAria();

    Object.assign(ctx.element, {
      handleClick(): void {
        if (el.disabled) return;

        el.open = !el.open;
        updateAria();

        ctx.emit("toggle", { open: el.open });
      },

      handleKeyDown(e: KeyboardEvent): void {
        if (el.disabled) return;

        if (e.key === KEY.Enter || e.key === KEY.Space) {
          e.preventDefault();
          el.handleClick();
        }
      },

      toggle(force?: boolean): void {
        if (el.disabled) return;

        el.open = force ?? !el.open;
        updateAria();

        ctx.emit("toggle", { open: el.open });
      },

      expand(): void {
        el.toggle(true);
      },

      collapse(): void {
        el.toggle(false);
      },
    });

    ctx.onCleanup(
      onAttributeChange(ctx.element, ["open", "disabled"], updateAria)
    );
  },
});

export {};
