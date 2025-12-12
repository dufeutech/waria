import { defineComponent } from "../factory";
import { ensureId } from "../aria";
import { autoPosition, type Placement } from "../infra/position";
import { teleport } from "../infra/portal";
import { SLOT, ARIA, KEY } from "../constants";

defineComponent({
  tag: "w-tooltip",

  props: [
    { name: "open", type: Boolean, default: false },
    { name: "placement", type: String, default: "top" },
    { name: "delay", type: Number, default: 300 },
    { name: "closeDelay", type: Number, default: 100 },
    { name: "portal", type: Boolean, default: true },
  ],

  children: {
    trigger: SLOT.trigger,
    content: SLOT.content,
  },

  events: {
    focusin: {
      selector: SLOT.trigger,
      handler: "handleFocusIn",
    },
    focusout: {
      selector: SLOT.trigger,
      handler: "handleFocusOut",
    },
    keydown: {
      handler: "handleKeyDown",
    },
  },

  transitions: {
    content: {
      target: SLOT.content,
      enterClass: "tooltip-enter",
      enterFromClass: "tooltip-enter-from",
      enterToClass: "tooltip-enter-to",
      leaveClass: "tooltip-leave",
      leaveFromClass: "tooltip-leave-from",
      leaveToClass: "tooltip-leave-to",
    },
  },

  setup(ctx) {
    type TooltipElement = HTMLElement & {
      open: boolean;
      placement: string;
      delay: number;
      closeDelay: number;
      portal: boolean;
    };

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

    // Portal cleanup function
    let portalCleanup: (() => void) | null = null;
    // Direct event listeners for portaled content
    let contentMouseEnterHandler: (() => void) | null = null;
    let contentMouseLeaveHandler: (() => void) | null = null;

    let openTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let closeTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let positionCleanup: (() => void) | null = null;

    const clearTimers = (): void => {
      if (openTimeoutId !== null) {
        clearTimeout(openTimeoutId);
        openTimeoutId = null;
      }
      if (closeTimeoutId !== null) {
        clearTimeout(closeTimeoutId);
        closeTimeoutId = null;
      }
    };

    const updateAria = (): void => {
      const trigger = getTrigger();
      const content = getContent();
      const el = ctx.element as unknown as TooltipElement;

      if (trigger && content) {
        const contentId = ensureId(content, "w-tooltip");
        trigger.setAttribute(ARIA.describedby, el.open ? contentId : "");
      }

      if (content) {
        content.setAttribute("role", "tooltip");
        content.hidden = !el.open;
      }
    };

    const show = (): void => {
      const trigger = getTrigger();
      const content = getContent();
      const el = ctx.element as unknown as TooltipElement;

      if (!trigger || !content || el.open) return;

      clearTimers();

      el.open = true;
      updateAria();

      // Teleport content to portal if enabled
      if (el.portal) {
        // Add tracking attribute to link portaled content back to owner
        ensureId(ctx.element, "w-tooltip");
        content.setAttribute("data-portal-owner", ctx.element.id);

        portalCleanup = teleport(content);

        // Attach mouse event listeners directly to portaled content
        // (since we need to keep tooltip open on content hover)
        contentMouseEnterHandler = () => {
          clearTimers();
        };
        contentMouseLeaveHandler = () => {
          scheduleHide();
        };
        content.addEventListener("mouseenter", contentMouseEnterHandler);
        content.addEventListener("mouseleave", contentMouseLeaveHandler);
      }

      // Position content
      positionCleanup = autoPosition({
        reference: trigger,
        floating: content,
        placement: el.placement as Placement,
        offset: 8,
      });

      // Transition
      ctx.transitions.content?.enter();

      ctx.emit("show");
    };

    const hide = (): void => {
      const content = getContent();
      const el = ctx.element as unknown as TooltipElement;

      if (!el.open) return;

      clearTimers();

      // Cleanup position
      positionCleanup?.();
      positionCleanup = null;

      // Remove direct event listeners from portaled content
      if (content && contentMouseEnterHandler) {
        content.removeEventListener("mouseenter", contentMouseEnterHandler);
        contentMouseEnterHandler = null;
      }
      if (content && contentMouseLeaveHandler) {
        content.removeEventListener("mouseleave", contentMouseLeaveHandler);
        contentMouseLeaveHandler = null;
      }

      // Transition
      ctx.transitions.content?.leave();

      // Restore content from portal
      if (portalCleanup) {
        portalCleanup();
        portalCleanup = null;
        // Remove tracking attribute
        content?.removeAttribute("data-portal-owner");
      }

      el.open = false;
      updateAria();

      ctx.emit("hide");
    };

    const scheduleShow = (): void => {
      const el = ctx.element as unknown as TooltipElement;

      clearTimers();

      if (el.delay > 0) {
        openTimeoutId = setTimeout(show, el.delay);
      } else {
        show();
      }
    };

    const scheduleHide = (): void => {
      const el = ctx.element as unknown as TooltipElement;

      clearTimers();

      if (el.closeDelay > 0) {
        closeTimeoutId = setTimeout(hide, el.closeDelay);
      } else {
        hide();
      }
    };

    // Initial setup
    updateAria();

    Object.assign(ctx.element, {
      handleMouseEnter(): void {
        scheduleShow();
      },

      handleMouseLeave(): void {
        scheduleHide();
      },

      handleFocusIn(): void {
        show();
      },

      handleFocusOut(): void {
        hide();
      },

      handleKeyDown(e: KeyboardEvent): void {
        if (e.key === KEY.Escape) {
          const el = ctx.element as unknown as TooltipElement;
          if (el.open) {
            e.preventDefault();
            hide();
          }
        }
      },

      show(): void {
        show();
      },

      hide(): void {
        hide();
      },
    });

    // Add direct mouse event listeners (mouseenter/mouseleave don't bubble)
    const trigger = getTrigger();
    const content = getContent();

    if (trigger) {
      const handleTriggerMouseEnter = (): void => {
        scheduleShow();
      };
      const handleTriggerMouseLeave = (): void => {
        scheduleHide();
      };

      trigger.addEventListener("mouseenter", handleTriggerMouseEnter);
      trigger.addEventListener("mouseleave", handleTriggerMouseLeave);

      ctx.onCleanup(() => {
        trigger.removeEventListener("mouseenter", handleTriggerMouseEnter);
        trigger.removeEventListener("mouseleave", handleTriggerMouseLeave);
      });
    }

    // Mouse enter/leave on content to keep tooltip open (only for non-portal mode)
    // In portal mode, these are added/removed in show/hide
    const el = ctx.element as unknown as TooltipElement;
    if (content && !el.portal) {
      const handleContentMouseEnter = (): void => {
        clearTimers();
      };
      const handleContentMouseLeave = (): void => {
        scheduleHide();
      };

      content.addEventListener("mouseenter", handleContentMouseEnter);
      content.addEventListener("mouseleave", handleContentMouseLeave);

      ctx.onCleanup(() => {
        content.removeEventListener("mouseenter", handleContentMouseEnter);
        content.removeEventListener("mouseleave", handleContentMouseLeave);
      });
    }

    ctx.onCleanup(() => {
      clearTimers();
      positionCleanup?.();

      // Clean up portal and direct event listeners
      const contentEl = getContent();
      if (contentEl && contentMouseEnterHandler) {
        contentEl.removeEventListener("mouseenter", contentMouseEnterHandler);
      }
      if (contentEl && contentMouseLeaveHandler) {
        contentEl.removeEventListener("mouseleave", contentMouseLeaveHandler);
      }
      portalCleanup?.();
    });
  },
});

export {};
