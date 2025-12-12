import { defineComponent } from "../factory";
import { ensureId } from "../aria";
import { onDismiss } from "../infra/click-outside";
import { teleport } from "../infra/portal";
import { autoPosition, type Placement } from "../infra/position";
import { onAttributeChange } from "../core/observe";
import { SLOT, ARIA, KEY } from "../constants";

interface PopoverElement extends HTMLElement {
  open: boolean;
  placement: string;
  closeOnOutsideClick: boolean;
  closeOnEscape: boolean;
  returnFocus: boolean;
  portal: boolean;
  label: string;
  handleTriggerClick(e: Event): void;
  handleKeyDown(e: KeyboardEvent): void;
}

defineComponent({
  tag: "w-popover",

  props: [
    { name: "open", type: Boolean, default: false },
    { name: "placement", type: String, default: "bottom" },
    { name: "closeOnOutsideClick", type: Boolean, default: true },
    { name: "closeOnEscape", type: Boolean, default: true },
    { name: "returnFocus", type: Boolean, default: true },
    { name: "portal", type: Boolean, default: true }, // Default to portal mode for z-index safety
    { name: "label", type: String, default: "" },
  ],

  children: {
    trigger: SLOT.trigger,
    content: SLOT.content,
  },

  events: {
    click: {
      selector: SLOT.trigger,
      handler: "handleTriggerClick",
    },
    keydown: {
      handler: "handleKeyDown",
    },
  },

  setup(ctx) {
    const el = ctx.element as unknown as PopoverElement;

    let dismissCleanup: (() => void) | null = null;
    let previousFocus: HTMLElement | null = null;
    let portalCleanup: (() => void) | null = null;
    let positionCleanup: (() => void) | null = null;

    const getTrigger = (): HTMLElement | null =>
      ctx.query<HTMLElement>(SLOT.trigger);

    let contentRef: HTMLElement | null = null;

    const getContent = (): HTMLElement | null => {
      const localContent = ctx.query<HTMLElement>(SLOT.content);
      if (localContent) {
        contentRef = localContent;
        return localContent;
      }
      if (contentRef && document.body.contains(contentRef)) {
        return contentRef;
      }
      const portaledContent = document.querySelector<HTMLElement>(
        `${SLOT.content}[data-portal-owner="${ctx.element.id}"]`
      );
      if (portaledContent) {
        contentRef = portaledContent;
        return portaledContent;
      }
      return null;
    };

    const updateAria = (): void => {
      const trigger = getTrigger();
      const content = getContent();

      if (trigger) {
        trigger.setAttribute(ARIA.haspopup, "dialog");
        trigger.setAttribute(ARIA.expanded, String(el.open));

        if (content) {
          trigger.setAttribute(
            ARIA.controls,
            ensureId(content, "w-popover-content")
          );
        }
      }

      if (content) {
        content.setAttribute("role", "dialog");
        if (el.label) {
          content.setAttribute(ARIA.label, el.label);
        }
        content.hidden = !el.open;
      }
    };

    const openPopover = (): void => {
      if (el.open) return;

      if (el.returnFocus) {
        previousFocus = document.activeElement as HTMLElement;
      }

      el.open = true;
      updateAria();

      const content = getContent();

      // Teleport content to portal if enabled
      const trigger = getTrigger();
      if (el.portal && content) {
        // Add tracking attribute to link portaled content back to owner
        ensureId(ctx.element, "w-popover");
        content.setAttribute("data-portal-owner", ctx.element.id);

        portalCleanup = teleport(content);

        // Position content relative to trigger
        if (trigger) {
          positionCleanup = autoPosition({
            reference: trigger,
            floating: content,
            placement: el.placement as Placement,
            offset: 8,
          });
        }
      }

      // Setup dismiss handlers
      if (content && (el.closeOnOutsideClick || el.closeOnEscape)) {
        dismissCleanup = onDismiss(
          trigger ? [trigger, content] : [content],
          () => closePopover(),
          {
            escapeKey: el.closeOnEscape,
            delay: 10,
          }
        );
      }

      // Focus first focusable element in content
      const content2 = getContent();
      if (content2) {
        const focusable = content2.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) {
          focusable.focus();
        }
      }

      ctx.emit("open");
    };

    const closePopover = (): void => {
      if (!el.open) return;

      const content = getContent();

      el.open = false;
      updateAria();

      dismissCleanup?.();
      dismissCleanup = null;

      // Cleanup position
      positionCleanup?.();
      positionCleanup = null;

      // Restore content from portal
      if (portalCleanup) {
        portalCleanup();
        portalCleanup = null;
        // Remove tracking attribute
        content?.removeAttribute("data-portal-owner");
      }

      if (el.returnFocus && previousFocus) {
        previousFocus.focus();
        previousFocus = null;
      }

      ctx.emit("close");
    };

    updateAria();

    Object.assign(ctx.element, {
      handleTriggerClick(e: Event): void {
        e.preventDefault();
        if (el.open) {
          closePopover();
        } else {
          openPopover();
        }
      },

      handleKeyDown(e: KeyboardEvent): void {
        const trigger = getTrigger();

        if (document.activeElement === trigger && !el.open) {
          if (e.key === KEY.Enter || e.key === KEY.Space) {
            e.preventDefault();
            openPopover();
          }
        }
      },
    });

    ctx.onCleanup(
      onAttributeChange(ctx.element, ["open", "label"], updateAria)
    );

    ctx.onCleanup(() => {
      dismissCleanup?.();
      positionCleanup?.();
      portalCleanup?.();
    });
  },
});

export {};
