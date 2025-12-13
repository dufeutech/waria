import { defineComponent } from "../factory";
import { ensureId } from "../aria";
import { onDismiss } from "../infra/click-outside";
import { createRovingTabindex } from "../infra/focus";
import { teleport } from "../infra/portal";
import { SLOT, ARIA, KEY, getSlotName } from "../constants";

defineComponent({
  tag: "w-context-menu",

  props: [
    { name: "open", type: Boolean, default: false },
    { name: "closeOnSelect", type: Boolean, default: true },
    { name: "portal", type: Boolean, default: true },
  ],

  children: {
    trigger: SLOT.trigger,
    content: SLOT.body,
    items: { selector: SLOT.item, multiple: true },
  },

  events: {
    contextmenu: {
      selector: SLOT.trigger,
      handler: "handleContextMenu",
    },
    click: {
      selector: SLOT.item,
      handler: "handleItemClick",
    },
    keydown: {
      selector: SLOT.body,
      handler: "handleContentKeyDown",
    },
  },

  transitions: {
    content: {
      target: SLOT.body,
      enterClass: "context-menu-enter",
      enterFromClass: "context-menu-enter-from",
      enterToClass: "context-menu-enter-to",
      leaveClass: "context-menu-leave",
      leaveFromClass: "context-menu-leave-from",
      leaveToClass: "context-menu-leave-to",
    },
  },

  setup(ctx) {
    type ContextMenuElement = HTMLElement & {
      open: boolean;
      closeOnSelect: boolean;
      portal: boolean;
    };

    const getTrigger = (): HTMLElement | null =>
      ctx.query<HTMLElement>(SLOT.trigger);

    let contentRef: HTMLElement | null = null;

    const getContent = (): HTMLElement | null => {
      const localContent = ctx.query<HTMLElement>(SLOT.body);
      if (localContent) {
        contentRef = localContent;
        return localContent;
      }
      if (contentRef && document.body.contains(contentRef)) {
        return contentRef;
      }
      const portaledContent = document.querySelector<HTMLElement>(
        `${SLOT.body}[data-portal-owner="${ctx.element.id}"]`
      );
      if (portaledContent) {
        contentRef = portaledContent;
        return portaledContent;
      }
      return null;
    };

    const getItems = (): HTMLElement[] => {
      const content = getContent();
      if (!content) return [];
      return Array.from(content.querySelectorAll<HTMLElement>(SLOT.item));
    };

    let portalCleanup: (() => void) | null = null;
    let contentClickHandler: ((e: Event) => void) | null = null;
    let contentKeydownHandler: ((e: KeyboardEvent) => void) | null = null;
    let dismissCleanup: (() => void) | null = null;
    let rovingTabindex: ReturnType<typeof createRovingTabindex> | null = null;

    // Store mouse position for positioning
    let mouseX = 0;
    let mouseY = 0;

    const updateAria = (): void => {
      const trigger = getTrigger();
      const content = getContent();
      const items = getItems();
      const el = ctx.element as unknown as ContextMenuElement;

      if (trigger) {
        trigger.setAttribute(ARIA.haspopup, "menu");
      }

      if (content) {
        content.setAttribute("role", "menu");
        content.hidden = !el.open;
        ensureId(content, "w-context-menu");
      }

      items.forEach((item, index) => {
        item.setAttribute("role", "menuitem");
        item.setAttribute("tabindex", index === 0 ? "0" : "-1");
      });
    };

    const openMenu = (x: number, y: number): void => {
      const content = getContent();
      const el = ctx.element as unknown as ContextMenuElement;

      if (!content || el.open) return;

      el.open = true;
      updateAria();

      // Teleport content to portal if enabled
      if (el.portal) {
        ensureId(ctx.element, "w-context-menu");
        content.setAttribute("data-portal-owner", ctx.element.id);

        portalCleanup = teleport(content);

        // Attach event listeners directly to portaled content
        contentClickHandler = (e: Event) => {
          const target = (e.target as HTMLElement).closest(
            SLOT.item
          ) as HTMLElement | null;
          if (target) {
            (ctx.element as any).handleItemClick(e, target);
          }
        };
        contentKeydownHandler = (e: KeyboardEvent) => {
          (ctx.element as any).handleContentKeyDown(e);
        };
        content.addEventListener("click", contentClickHandler);
        content.addEventListener("keydown", contentKeydownHandler);
      }

      // Position at mouse cursor
      content.style.position = "fixed";
      content.style.left = `${x}px`;
      content.style.top = `${y}px`;

      // Check if menu fits in viewport, adjust if needed
      requestAnimationFrame(() => {
        const rect = content.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (rect.right > viewportWidth) {
          content.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > viewportHeight) {
          content.style.top = `${y - rect.height}px`;
        }
      });

      // Get items after potential teleport
      const items = getItems();

      // Setup roving tabindex
      rovingTabindex = createRovingTabindex(items, {
        orientation: "vertical",
        wrap: true,
      });

      // Focus first item
      if (items.length > 0) {
        items[0].focus();
      }

      // Setup dismiss
      dismissCleanup = onDismiss([content], () => closeMenu(), {
        escapeKey: true,
        delay: 0,
      });

      // Transition
      ctx.transitions.content?.enter();

      ctx.emit("open", { x, y });
    };

    const closeMenu = (): void => {
      const content = getContent();
      const el = ctx.element as unknown as ContextMenuElement;

      if (!el.open) return;

      // Cleanup
      dismissCleanup?.();
      dismissCleanup = null;

      rovingTabindex?.destroy();
      rovingTabindex = null;

      // Remove direct event listeners from portaled content
      if (content && contentClickHandler) {
        content.removeEventListener("click", contentClickHandler);
        contentClickHandler = null;
      }
      if (content && contentKeydownHandler) {
        content.removeEventListener("keydown", contentKeydownHandler);
        contentKeydownHandler = null;
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

      ctx.emit("close");
    };

    // Initial state
    updateAria();

    Object.assign(ctx.element, {
      handleContextMenu(e: MouseEvent): void {
        e.preventDefault();

        const el = ctx.element as unknown as ContextMenuElement;
        if (el.open) {
          closeMenu();
        }

        mouseX = e.clientX;
        mouseY = e.clientY;
        openMenu(mouseX, mouseY);
      },

      handleContentKeyDown(e: KeyboardEvent): void {
        if (e.key === KEY.Tab) {
          e.preventDefault();
          closeMenu();
        }
      },

      handleItemClick(_e: Event, target: HTMLElement): void {
        const el = ctx.element as unknown as ContextMenuElement;
        const itemName = getSlotName(target);

        ctx.emit("select", { item: itemName, element: target });

        if (el.closeOnSelect) {
          closeMenu();
        }
      },

      show(x?: number, y?: number): void {
        openMenu(x ?? mouseX, y ?? mouseY);
      },

      hide(): void {
        closeMenu();
      },
    });

    // Watch for attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "open") {
          const el = ctx.element as unknown as ContextMenuElement;
          const content = getContent();
          if (content) {
            if (el.open && content.hidden) {
              openMenu(mouseX, mouseY);
            } else if (!el.open && !content.hidden) {
              closeMenu();
            }
          }
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });

    ctx.onCleanup(() => {
      observer.disconnect();
      dismissCleanup?.();
      rovingTabindex?.destroy();

      const content = getContent();
      if (content && contentClickHandler) {
        content.removeEventListener("click", contentClickHandler);
      }
      if (content && contentKeydownHandler) {
        content.removeEventListener("keydown", contentKeydownHandler);
      }
      portalCleanup?.();
    });
  },
});

export {};
