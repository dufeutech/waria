import { defineComponent } from "../factory";
import { ensureId, setAriaExpanded } from "../aria";
import { autoPosition, type Placement } from "../infra/position";
import { teleport } from "../infra/portal";
import { onDismiss } from "../infra/click-outside";
import { SLOT, ARIA, KEY } from "../constants";

defineComponent({
  tag: "w-hover-card",

  props: [
    { name: "open", type: Boolean, default: false },
    { name: "placement", type: String, default: "bottom" },
    { name: "openDelay", type: Number, default: 500 },
    { name: "closeDelay", type: Number, default: 300 },
    { name: "portal", type: Boolean, default: true },
  ],

  children: {
    trigger: SLOT.trigger,
    content: SLOT.content,
  },

  events: {
    mouseover: {
      selector: SLOT.trigger,
      handler: "handleMouseEnter",
    },
    mouseout: {
      selector: SLOT.trigger,
      handler: "handleMouseOut",
    },
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
      enterClass: "hover-card-enter",
      enterFromClass: "hover-card-enter-from",
      enterToClass: "hover-card-enter-to",
      leaveClass: "hover-card-leave",
      leaveFromClass: "hover-card-leave-from",
      leaveToClass: "hover-card-leave-to",
    },
  },

  setup(ctx) {
    type HoverCardElement = HTMLElement & {
      open: boolean;
      placement: string;
      openDelay: number;
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

    let portalCleanup: (() => void) | null = null;
    let contentMouseEnterHandler: (() => void) | null = null;
    let contentMouseLeaveHandler: (() => void) | null = null;
    let openTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let closeTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let positionCleanup: (() => void) | null = null;
    let dismissCleanup: (() => void) | null = null;

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
      const el = ctx.element as unknown as HoverCardElement;

      if (trigger) {
        setAriaExpanded(trigger, el.open);
        if (content) {
          trigger.setAttribute(
            ARIA.controls,
            ensureId(content, "w-hover-card")
          );
        }
      }

      if (content) {
        content.hidden = !el.open;
      }
    };

    const show = (): void => {
      const trigger = getTrigger();
      const content = getContent();
      const el = ctx.element as unknown as HoverCardElement;

      if (!trigger || !content || el.open) return;

      clearTimers();

      el.open = true;
      updateAria();

      // Teleport content to portal if enabled
      if (el.portal) {
        ensureId(ctx.element, "w-hover-card");
        content.setAttribute("data-portal-owner", ctx.element.id);

        portalCleanup = teleport(content);

        // Attach mouse event listeners directly to portaled content
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

      // Setup dismiss on escape
      dismissCleanup = onDismiss([trigger, content], () => hide(), {
        escapeKey: true,
      });

      // Transition
      ctx.transitions.content?.enter();

      ctx.emit("show");
    };

    const hide = (): void => {
      const content = getContent();
      const el = ctx.element as unknown as HoverCardElement;

      if (!el.open) return;

      clearTimers();

      // Cleanup position
      positionCleanup?.();
      positionCleanup = null;

      // Cleanup dismiss
      dismissCleanup?.();
      dismissCleanup = null;

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
        content?.removeAttribute("data-portal-owner");
      }

      el.open = false;
      updateAria();

      ctx.emit("hide");
    };

    const scheduleShow = (): void => {
      const el = ctx.element as unknown as HoverCardElement;

      clearTimers();

      if (el.openDelay > 0) {
        openTimeoutId = setTimeout(show, el.openDelay);
      } else {
        show();
      }
    };

    const scheduleHide = (): void => {
      const el = ctx.element as unknown as HoverCardElement;

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

      handleMouseOut(e: MouseEvent): void {
        const trigger = getTrigger();
        const relatedTarget = e.relatedTarget as HTMLElement | null;

        // Don't hide if mouse is moving to a child of trigger or to content
        if (trigger && relatedTarget && trigger.contains(relatedTarget)) {
          return;
        }
        const content = getContent();
        if (content && relatedTarget && content.contains(relatedTarget)) {
          return;
        }
        scheduleHide();
      },

      handleFocusIn(): void {
        show();
      },

      handleFocusOut(e: FocusEvent): void {
        const content = getContent();
        const relatedTarget = e.relatedTarget as HTMLElement | null;

        // Don't hide if focus is moving to content
        if (content && relatedTarget && content.contains(relatedTarget)) {
          return;
        }
        hide();
      },

      handleKeyDown(e: KeyboardEvent): void {
        if (e.key === KEY.Escape) {
          const el = ctx.element as unknown as HoverCardElement;
          if (el.open) {
            e.preventDefault();
            hide();
            getTrigger()?.focus();
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

    // Mouse enter/leave on content (only for non-portal mode)
    const content = getContent();
    const el = ctx.element as unknown as HoverCardElement;
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
      dismissCleanup?.();

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
