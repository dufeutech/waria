import { defineComponent } from "../factory";
import { teleport } from "../infra/portal";
import { onAttributeChange } from "../core/observe";
import { SLOT, ARIA } from "../constants";

interface ToastElement extends HTMLElement {
  open: boolean;
  variant: "info" | "success" | "warning" | "error";
  dismissible: boolean;
  duration: number;
  portal: boolean;
  label: string;
  handleCloseClick(e: Event): void;
}

defineComponent({
  tag: "w-toast",

  props: [
    { name: "open", type: Boolean, default: false },
    { name: "variant", type: String, default: "info" },
    { name: "dismissible", type: Boolean, default: true },
    { name: "duration", type: Number, default: 0 }, // 0 = no auto-close
    { name: "portal", type: Boolean, default: true }, // Default to portal mode for z-index safety
    { name: "label", type: String, default: "" },
  ],

  children: {
    message: SLOT.message,
    close: SLOT.close,
  },

  setup(ctx) {
    const el = ctx.element as unknown as ToastElement;

    let autoCloseTimer: ReturnType<typeof setTimeout> | null = null;
    let portalCleanup: (() => void) | null = null;

    const updateAria = (): void => {
      // Use role="alert" for errors (assertive), role="status" for others (polite)
      const isError = el.variant === "error" || el.variant === "warning";
      el.setAttribute("role", isError ? "alert" : "status");
      el.setAttribute(ARIA.live, isError ? "assertive" : "polite");
      el.setAttribute(ARIA.atomic, "true");

      if (el.label) {
        el.setAttribute(ARIA.label, el.label);
      }

      // Handle visibility - use style.display to override any inline styles
      if (el.open) {
        el.style.display = "";
        el.hidden = false;
      } else {
        el.style.display = "none";
        el.hidden = true;
      }
    };

    const openToast = (): void => {
      if (el.hasAttribute("open") && !el.hidden) return;

      // Teleport toast to portal if enabled
      if (el.portal && !portalCleanup) {
        portalCleanup = teleport(el);
      }

      el.style.display = "";
      el.hidden = false;

      // Start auto-close timer if duration is set
      if (el.duration > 0 && !autoCloseTimer) {
        autoCloseTimer = setTimeout(() => {
          closeToast();
        }, el.duration);
      }

      ctx.emit("open");
    };

    const closeToast = (): void => {
      // Check via attribute to avoid getter/setter issues
      if (!el.hasAttribute("open")) return;

      // Remove attribute directly to ensure it's removed
      el.removeAttribute("open");
      el.style.display = "none";
      el.hidden = true;

      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        autoCloseTimer = null;
      }

      // Restore from portal
      if (portalCleanup) {
        portalCleanup();
        portalCleanup = null;
      }

      ctx.emit("close");
    };

    updateAria();

    // If initially open, handle portal and auto-close
    if (el.open) {
      openToast();
    }

    // Add direct click handler for close button using event delegation
    ctx.events.on("click", SLOT.close, (e: Event) => {
      e.preventDefault();
      closeToast();
    });

    ctx.onCleanup(
      onAttributeChange(ctx.element, ["open", "variant", "label"], () => {
        updateAria();
        if (el.open) {
          openToast();
        }
      })
    );

    ctx.onCleanup(() => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
      portalCleanup?.();
    });
  },
});

export {};
