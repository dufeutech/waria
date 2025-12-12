import { defineComponent } from "../factory";
import { ensureId } from "../aria";
import { createFocusTrap } from "../infra/focus";
import { onDismiss } from "../infra/click-outside";
import { teleport } from "../infra/portal";
import { observeAttributes } from "../core/observe";
import { SLOT, ARIA, KEY } from "../constants";

interface DialogElement extends HTMLElement {
  open: boolean;
  modal: boolean;
  closeOnEscape: boolean;
  closeOnOutsideClick: boolean;
  returnFocus: boolean;
  label: string;
  handleTriggerClick(): void;
}

defineComponent({
  tag: "w-dialog",

  props: [
    { name: "open", type: Boolean, default: false },
    { name: "modal", type: Boolean, default: true },
    { name: "closeOnEscape", type: Boolean, default: true },
    { name: "closeOnOutsideClick", type: Boolean, default: true },
    { name: "returnFocus", type: Boolean, default: true },
    { name: "label", type: String, default: "" },
  ],

  children: {
    trigger: SLOT.trigger,
    content: SLOT.content,
    close: SLOT.close,
  },

  events: {
    click: [
      {
        selector: SLOT.trigger,
        handler: "handleTriggerClick",
      },
      {
        selector: SLOT.close,
        handler: "handleCloseClick",
      },
    ],
    keydown: {
      selector: SLOT.trigger,
      handler: "handleTriggerKeyDown",
    },
  },

  transitions: {
    content: {
      target: SLOT.content,
      enterClass: "dialog-enter",
      enterFromClass: "dialog-enter-from",
      enterToClass: "dialog-enter-to",
      leaveClass: "dialog-leave",
      leaveFromClass: "dialog-leave-from",
      leaveToClass: "dialog-leave-to",
    },
  },

  setup(ctx) {
    const el = ctx.element as unknown as DialogElement;

    const getContent = (): HTMLElement | null =>
      ctx.query<HTMLElement>(SLOT.content);
    const getTrigger = (): HTMLElement | null =>
      ctx.query<HTMLElement>(SLOT.trigger);

    let focusTrap: ReturnType<typeof createFocusTrap> | null = null;
    let dismissCleanup: (() => void) | null = null;
    let portalCleanup: (() => void) | null = null;
    let closeButtonCleanup: (() => void) | null = null;
    let previousFocus: HTMLElement | null = null;
    let teleportedContent: HTMLElement | null = null;

    const updateAria = (): void => {
      // Use teleportedContent reference since content may be in portal
      const content = teleportedContent || getContent();
      const trigger = getTrigger();

      if (trigger) {
        trigger.setAttribute(ARIA.haspopup, "dialog");
        trigger.setAttribute(ARIA.expanded, String(el.open));
        if (content) {
          trigger.setAttribute(ARIA.controls, ensureId(content, "w-dialog"));
        }
      }

      if (content) {
        content.setAttribute("role", "dialog");
        content.setAttribute(ARIA.modal, String(el.modal));
        if (el.label) {
          content.setAttribute(ARIA.label, el.label);
        }
        content.hidden = !el.open;
      }
    };

    const openDialog = (): void => {
      const content = getContent();

      if (!content || el.open) return;

      // Store reference before teleportation so we can access it in closeDialog
      teleportedContent = content;

      if (el.returnFocus) {
        previousFocus = document.activeElement as HTMLElement;
      }

      if (el.modal) {
        portalCleanup = teleport(content);
      }

      el.open = true;
      updateAria();

      if (el.modal) {
        focusTrap = createFocusTrap(content, {
          returnFocus: false,
          escapeDeactivates: el.closeOnEscape,
          onEscape: () => closeDialog(),
        });
        focusTrap.activate();
      }

      if (el.closeOnOutsideClick || el.closeOnEscape) {
        dismissCleanup = onDismiss(content, () => closeDialog(), {
          escapeKey: el.closeOnEscape && !el.modal,
          delay: 10,
        });
      }

      // Add direct click listener on close button (needed after teleportation)
      const closeBtn = content.querySelector(SLOT.close);
      if (closeBtn) {
        const handleCloseClick = (): void => closeDialog();
        closeBtn.addEventListener("click", handleCloseClick);
        closeButtonCleanup = () =>
          closeBtn.removeEventListener("click", handleCloseClick);
      }

      ctx.transitions.content?.enter();

      ctx.emit("open");
    };

    const closeDialog = (): void => {
      // Use stored reference since content may be teleported to portal
      const content = teleportedContent || getContent();

      if (!content || !el.open) return;

      focusTrap?.deactivate();
      focusTrap = null;

      dismissCleanup?.();
      dismissCleanup = null;

      closeButtonCleanup?.();
      closeButtonCleanup = null;

      ctx.transitions.content?.leave().then(() => {
        portalCleanup?.();
        portalCleanup = null;
        teleportedContent = null;
      });

      el.open = false;
      updateAria();

      if (el.returnFocus && previousFocus) {
        previousFocus.focus();
        previousFocus = null;
      }

      ctx.emit("close");
    };

    updateAria();

    Object.assign(ctx.element, {
      handleTriggerClick(): void {
        if (el.open) {
          closeDialog();
        } else {
          openDialog();
        }
      },

      handleTriggerKeyDown(e: KeyboardEvent): void {
        if (e.key === KEY.Enter || e.key === KEY.Space) {
          e.preventDefault();
          el.handleTriggerClick();
        }
      },

      handleCloseClick(): void {
        closeDialog();
      },

      showModal(): void {
        openDialog();
      },

      close(): void {
        closeDialog();
      },

      toggle(force?: boolean): void {
        const shouldOpen = force ?? !el.open;
        if (shouldOpen) {
          openDialog();
        } else {
          closeDialog();
        }
      },
    });

    ctx.onCleanup(
      observeAttributes({
        element: ctx.element,
        attributes: ["open", "label"],
        handler: (attr) => {
          if (attr === "label") {
            updateAria();
            return;
          }
          const content = getContent();
          if (content) {
            if (el.open && content.hidden) {
              openDialog();
            } else if (!el.open && !content.hidden) {
              closeDialog();
            }
          }
        },
      })
    );

    ctx.onCleanup(() => {
      focusTrap?.deactivate();
      dismissCleanup?.();
      portalCleanup?.();
    });
  },
});

export {};
