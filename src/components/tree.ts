import { defineComponent } from "../factory";
import { ensureId } from "../aria";
import { SLOT, ARIA, KEY, getSlotName } from "../constants";

const TOGGLE_ATTR: string = "toggle";

defineComponent({
  tag: "w-tree",

  props: [
    { name: "value", type: String, default: "" },
    { name: "expanded", type: String, default: "" }, // Comma-separated expanded item names
    { name: "multiselect", type: Boolean, default: false },
  ],

  children: {
    items: { selector: SLOT.item, multiple: true, observe: true },
  },

  events: {
    click: {
      selector: SLOT.item,
      handler: "handleItemClick",
    },
    keydown: {
      handler: "handleKeyDown",
    },
  },

  setup(ctx) {
    type TreeElement = HTMLElement & {
      value: string;
      expanded: string;
      multiselect: boolean;
    };

    const getAllItems = (): HTMLElement[] => {
      return Array.from(ctx.element.querySelectorAll<HTMLElement>(SLOT.item));
    };

    const getExpandedItems = (): Set<string> => {
      const el = ctx.element as unknown as TreeElement;
      return new Set(el.expanded ? el.expanded.split(",").filter(Boolean) : []);
    };

    const getSelectedItems = (): Set<string> => {
      const el = ctx.element as unknown as TreeElement;
      return new Set(el.value ? el.value.split(",").filter(Boolean) : []);
    };

    const hasChildren = (item: HTMLElement): boolean => {
      return item.querySelector(SLOT.item) !== null;
    };

    const getItemLevel = (item: HTMLElement): number => {
      let level = 1;
      let parent = item.parentElement;
      while (parent && parent !== ctx.element) {
        if (parent.matches(SLOT.item)) {
          level++;
        }
        parent = parent.parentElement;
      }
      return level;
    };

    const isVisible = (item: HTMLElement): boolean => {
      const expandedItems = getExpandedItems();
      let parent = item.parentElement;

      while (parent && parent !== ctx.element) {
        if (parent.matches(SLOT.item)) {
          const parentName = getSlotName(parent as HTMLElement);
          if (parentName && !expandedItems.has(parentName)) {
            return false;
          }
        }
        parent = parent.parentElement;
      }
      return true;
    };

    const getVisibleItems = (): HTMLElement[] => {
      return getAllItems().filter(isVisible);
    };

    const updateAria = (): void => {
      const allItems = getAllItems();
      const expandedItems = getExpandedItems();
      const selectedItems = getSelectedItems();

      // Set tree role
      ctx.element.setAttribute("role", "tree");

      allItems.forEach((item) => {
        const itemName = getSlotName(item) ?? "";
        const itemHasChildren = hasChildren(item);
        const isExpanded = expandedItems.has(itemName);
        const isSelected = selectedItems.has(itemName);
        const level = getItemLevel(item);
        const visible = isVisible(item);

        ensureId(item, "w-treeitem");

        item.setAttribute("role", "treeitem");
        item.setAttribute(ARIA.level, String(level));
        item.setAttribute(ARIA.selected, String(isSelected));

        if (itemHasChildren) {
          item.setAttribute(ARIA.expanded, String(isExpanded));

          // Find and hide/show child group container
          const childGroup = item.querySelector(':scope > [role="group"]');
          if (childGroup) {
            (childGroup as HTMLElement).hidden = !isExpanded;
          }
        } else {
          item.removeAttribute(ARIA.expanded);
        }

        // Set tabindex for visible items
        if (visible) {
          const visibleItems = getVisibleItems();
          const isFirst = visibleItems[0] === item;
          item.setAttribute("tabindex", isFirst ? "0" : "-1");
        } else {
          item.setAttribute("tabindex", "-1");
        }

        // Group children
        const childContainer = item.querySelector(
          `:scope > ${SLOT.item}`
        )?.parentElement;
        if (
          childContainer &&
          childContainer !== item &&
          childContainer.closest(SLOT.item) === item
        ) {
          childContainer.setAttribute("role", "group");
        }
      });
    };

    const toggleExpanded = (itemName: string): void => {
      const el = ctx.element as unknown as TreeElement;
      const expandedItems = getExpandedItems();

      if (expandedItems.has(itemName)) {
        expandedItems.delete(itemName);
      } else {
        expandedItems.add(itemName);
      }

      el.expanded = Array.from(expandedItems).join(",");
      updateAria();

      ctx.emit("toggle", {
        item: itemName,
        expanded: expandedItems.has(itemName),
      });
    };

    const selectItem = (itemName: string): void => {
      const el = ctx.element as unknown as TreeElement;
      const selectedItems = getSelectedItems();

      if (el.multiselect) {
        if (selectedItems.has(itemName)) {
          selectedItems.delete(itemName);
        } else {
          selectedItems.add(itemName);
        }
        el.value = Array.from(selectedItems).join(",");
      } else {
        el.value = itemName;
      }

      updateAria();
      ctx.emit("select", { value: el.value });
    };

    // Initial setup
    updateAria();

    Object.assign(ctx.element, {
      handleItemClick(e: Event, target: HTMLElement): void {
        e.stopPropagation();

        const itemName = getSlotName(target);
        if (!itemName) return;

        // Check if click was on the expand/collapse indicator
        const clickTarget = e.target as HTMLElement;
        const isToggleClick =
          clickTarget.hasAttribute(TOGGLE_ATTR) ||
          clickTarget.closest(`[${TOGGLE_ATTR}]`);

        if (isToggleClick && hasChildren(target)) {
          toggleExpanded(itemName);
        } else {
          selectItem(itemName);
        }

        // Update tabindex
        const visibleItems = getVisibleItems();
        visibleItems.forEach((item) => {
          item.setAttribute("tabindex", item === target ? "0" : "-1");
        });
        target.focus();
      },

      handleKeyDown(e: KeyboardEvent): void {
        const target = e.target as HTMLElement;
        if (!target.matches(SLOT.item)) return;

        const visibleItems = getVisibleItems();
        const currentIndex = visibleItems.indexOf(target);
        if (currentIndex === -1) return;

        const itemName = getSlotName(target) ?? "";
        const expandedItems = getExpandedItems();
        const itemHasChildren = hasChildren(target);
        const isExpanded = expandedItems.has(itemName);

        let newIndex = currentIndex;

        switch (e.key) {
          case KEY.ArrowDown:
            e.preventDefault();
            newIndex = Math.min(currentIndex + 1, visibleItems.length - 1);
            break;

          case KEY.ArrowUp:
            e.preventDefault();
            newIndex = Math.max(currentIndex - 1, 0);
            break;

          case KEY.ArrowRight:
            e.preventDefault();
            if (itemHasChildren) {
              if (!isExpanded) {
                toggleExpanded(itemName);
              } else {
                // Move to first child
                const newVisible = getVisibleItems();
                const firstChild = newVisible[currentIndex + 1];
                if (
                  firstChild &&
                  getItemLevel(firstChild) > getItemLevel(target)
                ) {
                  newIndex = currentIndex + 1;
                }
              }
            }
            break;

          case KEY.ArrowLeft:
            e.preventDefault();
            if (itemHasChildren && isExpanded) {
              toggleExpanded(itemName);
            } else {
              // Move to parent
              let parent = target.parentElement;
              while (parent && parent !== ctx.element) {
                if (parent.matches(SLOT.item)) {
                  const parentIndex = visibleItems.indexOf(
                    parent as HTMLElement
                  );
                  if (parentIndex !== -1) {
                    newIndex = parentIndex;
                  }
                  break;
                }
                parent = parent.parentElement;
              }
            }
            break;

          case KEY.Home:
            e.preventDefault();
            newIndex = 0;
            break;

          case KEY.End:
            e.preventDefault();
            newIndex = visibleItems.length - 1;
            break;

          case KEY.Enter:
          case KEY.Space:
            e.preventDefault();
            if (itemHasChildren) {
              toggleExpanded(itemName);
            }
            selectItem(itemName);
            return;

          case "*":
            e.preventDefault();
            // Expand all siblings at current level
            const currentLevel = getItemLevel(target);
            visibleItems.forEach((item) => {
              if (getItemLevel(item) === currentLevel && hasChildren(item)) {
                const name = getSlotName(item);
                if (name && !expandedItems.has(name)) {
                  expandedItems.add(name);
                }
              }
            });
            (ctx.element as unknown as TreeElement).expanded =
              Array.from(expandedItems).join(",");
            updateAria();
            return;
        }

        if (newIndex !== currentIndex) {
          const newItem = getVisibleItems()[newIndex];
          if (newItem) {
            visibleItems.forEach((item) => {
              item.setAttribute("tabindex", item === newItem ? "0" : "-1");
            });
            newItem.focus();
          }
        }
      },

      expandItem(name: string): void {
        const el = ctx.element as unknown as TreeElement;
        const expandedItems = getExpandedItems();
        if (!expandedItems.has(name)) {
          expandedItems.add(name);
          el.expanded = Array.from(expandedItems).join(",");
          updateAria();
        }
      },

      collapseItem(name: string): void {
        const el = ctx.element as unknown as TreeElement;
        const expandedItems = getExpandedItems();
        if (expandedItems.has(name)) {
          expandedItems.delete(name);
          el.expanded = Array.from(expandedItems).join(",");
          updateAria();
        }
      },

      expandAll(): void {
        const el = ctx.element as unknown as TreeElement;
        const allItems = getAllItems()
          .filter(hasChildren)
          .map((item) => getSlotName(item))
          .filter(Boolean);
        el.expanded = allItems.join(",");
        updateAria();
      },

      collapseAll(): void {
        (ctx.element as unknown as TreeElement).expanded = "";
        updateAria();
      },
    });

    // Watch for attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.attributeName === "value" ||
          mutation.attributeName === "expanded"
        ) {
          updateAria();
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });
    ctx.onCleanup(() => observer.disconnect());
  },
});

export {};
