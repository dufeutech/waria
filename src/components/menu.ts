import { defineComponent } from "../factory";
import { ensureId } from "../aria";
import { autoPosition } from "../infra/position";
import { onDismiss } from "../infra/click-outside";
import { createRovingTabindex } from "../infra/focus";
import { teleport } from "../infra/portal";
import { SLOT, ARIA, KEY } from "../constants";

defineComponent({
  tag: "w-menu",

  props: [
    { name: "open", type: Boolean, default: false },
    { name: "placement", type: String, default: "bottom-start" },
    { name: "closeOnSelect", type: Boolean, default: true },
    { name: "portal", type: Boolean, default: true }, // Default to portal mode for z-index safety
  ],

  children: {
    trigger: SLOT.trigger,
    content: SLOT.content,
    items: { selector: SLOT.item, multiple: true },
  },

  events: {
    click: [
      {
        selector: SLOT.trigger,
        handler: "handleTriggerClick",
      },
      {
        selector: SLOT.item,
        handler: "handleItemClick",
      },
    ],
    keydown: [
      {
        selector: SLOT.trigger,
        handler: "handleTriggerKeyDown",
      },
      {
        selector: SLOT.content,
        handler: "handleContentKeyDown",
      },
    ],
  },

  transitions: {
    content: {
      target: SLOT.content,
      enterClass: "menu-enter",
      enterFromClass: "menu-enter-from",
      enterToClass: "menu-enter-to",
      leaveClass: "menu-leave",
      leaveFromClass: "menu-leave-from",
      leaveToClass: "menu-leave-to",
    },
  },

  setup(ctx) {
    type MenuElement = HTMLElement & {
      open: boolean;
      placement: string;
      closeOnSelect: boolean;
      portal: boolean;
    };

    const getTrigger = (): HTMLElement | null =>
      ctx.query<HTMLElement>(SLOT.trigger);

    // Store reference to content element (needed when portaled)
    let contentRef: HTMLElement | null = null;

    const getContent = (): HTMLElement | null => {
      // First try local query (when not portaled)
      const localContent = ctx.query<HTMLElement>(SLOT.content);
      if (localContent) {
        contentRef = localContent;
        return localContent;
      }
      // If not found locally, check portal using stored reference or data attribute
      if (contentRef && document.body.contains(contentRef)) {
        return contentRef;
      }
      // Last resort: find by data-portal-owner attribute
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
    let contentClickHandler: ((e: Event) => void) | null = null;
    let contentKeydownHandler: ((e: KeyboardEvent) => void) | null = null;
    // Get only direct menu items (not items inside submenus)
    const getItems = (): HTMLElement[] => {
      const content = getContent();
      if (!content) return [];
      return Array.from(
        content.querySelectorAll<HTMLElement>(`:scope > ${SLOT.item}`)
      );
    };

    // Check if an item has a submenu
    const hasSubmenu = (item: HTMLElement): boolean => {
      return item.querySelector(SLOT.submenu) !== null;
    };

    // Get the submenu element for an item
    const getSubmenu = (item: HTMLElement): HTMLElement | null => {
      return item.querySelector<HTMLElement>(SLOT.submenu);
    };

    // Get items inside a submenu
    const getSubmenuItems = (submenu: HTMLElement): HTMLElement[] => {
      return Array.from(
        submenu.querySelectorAll<HTMLElement>(`:scope > ${SLOT.item}`)
      );
    };

    let positionCleanup: (() => void) | null = null;
    let dismissCleanup: (() => void) | null = null;
    let rovingTabindex: ReturnType<typeof createRovingTabindex> | null = null;

    // Track open submenus and their cleanups
    const openSubmenus = new Map<
      HTMLElement,
      {
        position: (() => void) | null;
        roving: ReturnType<typeof createRovingTabindex> | null;
      }
    >();

    // Track consistent submenu direction (null = not yet determined, 'left' or 'right')
    let submenuDirection: "left" | "right" | null = null;

    // Calculate available space and determine submenu direction
    const calculateSubmenuDirection = (
      referenceItem: HTMLElement
    ): "left" | "right" => {
      const rect = referenceItem.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const spaceOnRight = viewportWidth - rect.right;
      const spaceOnLeft = rect.left;
      // Assume submenu is ~200px wide; prefer right but flip if not enough space
      const submenuWidth = 200;
      return spaceOnRight >= submenuWidth
        ? "right"
        : spaceOnLeft >= submenuWidth
        ? "left"
        : "right";
    };

    const updateAria = (): void => {
      const trigger = getTrigger();
      const content = getContent();
      const items = getItems();
      const el = ctx.element as unknown as MenuElement;

      if (trigger) {
        trigger.setAttribute(ARIA.haspopup, "menu");
        trigger.setAttribute(ARIA.expanded, String(el.open));
        if (content) {
          trigger.setAttribute(ARIA.controls, ensureId(content, "w-menu"));
        }
      }

      if (content) {
        content.setAttribute("role", "menu");
        content.hidden = !el.open;
      }

      // Setup ARIA for all items recursively
      const setupItemsAria = (
        itemList: HTMLElement[],
        isFirstLevel: boolean
      ): void => {
        itemList.forEach((item, index) => {
          item.setAttribute("role", "menuitem");
          if (isFirstLevel) {
            item.setAttribute("tabindex", index === 0 ? "0" : "-1");
          } else {
            item.setAttribute("tabindex", "-1");
          }

          const submenu = getSubmenu(item);
          if (submenu) {
            item.setAttribute(ARIA.haspopup, "menu");
            item.setAttribute(ARIA.expanded, String(!submenu.hidden));
            submenu.setAttribute("role", "menu");
            ensureId(submenu, "w-submenu");
            item.setAttribute(ARIA.controls, submenu.id);

            // Recursively setup submenu items
            const submenuItems = getSubmenuItems(submenu);
            setupItemsAria(submenuItems, false);
          }
        });
      };

      setupItemsAria(items, true);
    };

    // Close all sibling submenus at a given level
    const closeSiblingSubmenus = (item: HTMLElement): void => {
      // Find the parent menu (either main content or a submenu)
      const parentMenu = item.parentElement;
      if (!parentMenu) return;

      // Get all sibling items in this menu level
      const siblingItems = Array.from(
        parentMenu.querySelectorAll<HTMLElement>(`:scope > ${SLOT.item}`)
      );

      // Close any open submenus from siblings
      siblingItems.forEach((sibling) => {
        if (sibling !== item && hasSubmenu(sibling)) {
          const siblingSubmenu = getSubmenu(sibling);
          if (siblingSubmenu && !siblingSubmenu.hidden) {
            closeSubmenu(sibling, false);
          }
        }
      });
    };

    const openSubmenu = (item: HTMLElement): void => {
      const submenu = getSubmenu(item);
      if (!submenu) return;

      // If already open, just focus first item
      if (!submenu.hidden) {
        const submenuItems = getSubmenuItems(submenu);
        if (submenuItems.length > 0) {
          submenuItems[0].setAttribute("tabindex", "0");
          requestAnimationFrame(() => {
            submenuItems[0].focus();
          });
        }
        return;
      }

      // Close sibling submenus first (only one submenu open per level)
      closeSiblingSubmenus(item);

      submenu.hidden = false;
      item.setAttribute(ARIA.expanded, "true");

      // Determine submenu direction (calculate once, reuse for all submenus)
      if (submenuDirection === null) {
        submenuDirection = calculateSubmenuDirection(item);
      }

      // Position submenu based on consistent direction
      const placement =
        submenuDirection === "left" ? "left-start" : "right-start";
      const posCleanup = autoPosition({
        reference: item,
        floating: submenu,
        placement: placement,
        offset: 0,
        flip: false, // Disable auto-flip to maintain consistency
      });

      // Get submenu items and set up tabindex
      const submenuItems = getSubmenuItems(submenu);

      // Set all items to tabindex -1 first, then first to 0
      submenuItems.forEach((subItem, idx) => {
        subItem.setAttribute("tabindex", idx === 0 ? "0" : "-1");
      });

      // Setup roving tabindex for submenu items
      const rovingCleanup = createRovingTabindex(submenuItems, {
        orientation: "vertical",
        wrap: true,
      });

      openSubmenus.set(submenu, {
        position: posCleanup,
        roving: rovingCleanup,
      });

      // Focus first item in submenu after DOM update
      if (submenuItems.length > 0) {
        requestAnimationFrame(() => {
          submenuItems[0].focus();
        });
      }
    };

    const closeSubmenu = (item: HTMLElement, returnFocus = true): void => {
      const submenu = getSubmenu(item);
      if (!submenu || submenu.hidden) return;

      // First, close any nested submenus
      const submenuItems = getSubmenuItems(submenu);
      submenuItems.forEach((subItem) => {
        if (hasSubmenu(subItem)) {
          closeSubmenu(subItem, false);
        }
      });

      submenu.hidden = true;
      item.setAttribute(ARIA.expanded, "false");

      // Cleanup
      const cleanup = openSubmenus.get(submenu);
      if (cleanup) {
        cleanup.position?.();
        cleanup.roving?.destroy();
        openSubmenus.delete(submenu);
      }

      if (returnFocus) {
        // Make sure the item is focusable before focusing
        item.setAttribute("tabindex", "0");
        requestAnimationFrame(() => {
          item.focus();
        });
      }
    };

    const closeAllSubmenus = (): void => {
      const items = getItems();
      items.forEach((item) => {
        if (hasSubmenu(item)) {
          closeSubmenu(item, false);
        }
      });
    };

    const openMenu = (): void => {
      const trigger = getTrigger();
      const content = getContent();
      const el = ctx.element as unknown as MenuElement;

      if (!trigger || !content || el.open) return;

      el.open = true;
      updateAria();

      // Teleport content to portal if enabled
      if (el.portal) {
        // Add tracking attribute to link portaled content back to owner
        ensureId(ctx.element, "w-menu");
        content.setAttribute("data-portal-owner", ctx.element.id);

        portalCleanup = teleport(content);

        // Attach event listeners directly to portaled content
        // (since event delegation from parent won't work)
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

      // Position content (works whether portaled or not since we use fixed positioning)
      positionCleanup = autoPosition({
        reference: trigger,
        floating: content,
        placement: el.placement as "bottom-start",
        offset: 4,
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
      dismissCleanup = onDismiss([trigger, content], () => closeMenu(), {
        escapeKey: true,
        delay: 10,
      });

      // Transition
      ctx.transitions.content?.enter();

      ctx.emit("open");
    };

    const closeMenu = (): void => {
      const trigger = getTrigger();
      const content = getContent();
      const el = ctx.element as unknown as MenuElement;

      if (!el.open) return;

      // Close all submenus first
      closeAllSubmenus();

      // Reset submenu direction for next open
      submenuDirection = null;

      // Cleanup
      positionCleanup?.();
      positionCleanup = null;

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

      // Restore content from portal (must be after transition to avoid visual jump)
      if (portalCleanup) {
        portalCleanup();
        portalCleanup = null;
        // Remove tracking attribute
        content?.removeAttribute("data-portal-owner");
      }

      el.open = false;
      updateAria();

      // Return focus to trigger
      trigger?.focus();

      ctx.emit("close");
    };

    // Initial state
    updateAria();

    Object.assign(ctx.element, {
      handleTriggerClick(): void {
        const el = ctx.element as unknown as MenuElement;
        if (el.open) {
          closeMenu();
        } else {
          openMenu();
        }
      },

      handleTriggerKeyDown(e: KeyboardEvent): void {
        const el = ctx.element as unknown as MenuElement;

        if (
          e.key === KEY.Enter ||
          e.key === KEY.Space ||
          e.key === KEY.ArrowDown
        ) {
          e.preventDefault();
          if (!el.open) {
            openMenu();
          }
        }

        if (e.key === KEY.ArrowUp) {
          e.preventDefault();
          if (!el.open) {
            openMenu();
            // Focus last item
            const items = getItems();
            if (items.length > 0) {
              rovingTabindex?.last();
            }
          }
        }
      },

      handleContentKeyDown(e: KeyboardEvent): void {
        const target = e.target as HTMLElement;
        const isMenuItem = target.matches(SLOT.item);

        if (e.key === KEY.Tab) {
          e.preventDefault();
          closeMenu();
          return;
        }

        if (!isMenuItem) return;

        // ArrowRight opens submenu if item has one
        if (e.key === KEY.ArrowRight) {
          if (hasSubmenu(target)) {
            e.preventDefault();
            e.stopPropagation();
            openSubmenu(target);
          }
          return;
        }

        // ArrowLeft closes current submenu and returns to parent
        if (e.key === KEY.ArrowLeft) {
          // Find if we're inside a submenu
          const parentSubmenu = target.closest(SLOT.submenu);
          if (parentSubmenu) {
            e.preventDefault();
            e.stopPropagation();
            // Find the parent item that owns this submenu
            const parentItem = parentSubmenu.parentElement;
            if (parentItem && parentItem.matches(SLOT.item)) {
              closeSubmenu(parentItem, true);
            }
          }
          return;
        }

        // Escape closes submenus first, then main menu
        if (e.key === KEY.Escape) {
          const parentSubmenu = target.closest(SLOT.submenu);
          if (parentSubmenu) {
            e.preventDefault();
            e.stopPropagation();
            const parentItem = parentSubmenu.parentElement;
            if (parentItem && parentItem.matches(SLOT.item)) {
              closeSubmenu(parentItem, true);
            }
            return;
          }
          // Let the dismiss handler close the main menu
        }
      },

      handleItemClick(_e: Event, target: HTMLElement): void {
        const el = ctx.element as unknown as MenuElement;
        const itemName = target.getAttribute("name");

        // If item has submenu, toggle it instead of selecting
        if (hasSubmenu(target)) {
          const submenu = getSubmenu(target);
          if (submenu?.hidden) {
            openSubmenu(target);
          } else {
            closeSubmenu(target, true);
          }
          return;
        }

        ctx.emit("select", { item: itemName, element: target });

        if (el.closeOnSelect) {
          closeMenu();
        }
      },

      show(): void {
        openMenu();
      },

      hide(): void {
        closeMenu();
      },

      toggle(force?: boolean): void {
        const shouldOpen =
          force ?? !(ctx.element as unknown as MenuElement).open;
        if (shouldOpen) {
          openMenu();
        } else {
          closeMenu();
        }
      },
    });

    // Watch for attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "open") {
          const el = ctx.element as unknown as MenuElement;
          const content = getContent();
          if (content) {
            if (el.open && content.hidden) {
              openMenu();
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
      positionCleanup?.();
      dismissCleanup?.();
      rovingTabindex?.destroy();

      // Clean up portal and direct event listeners
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
