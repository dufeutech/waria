import { defineComponent } from "../factory";
import { ensureId } from "../aria";
import { SLOT, ARIA } from "../constants";

defineComponent({
  tag: "w-accordion",

  props: [
    { name: "value", type: String, default: "" }, // Comma-separated for multiple
    { name: "multiple", type: Boolean, default: false },
    { name: "collapsible", type: Boolean, default: true },
  ],

  children: {
    items: { selector: SLOT.item, multiple: true },
  },

  events: {
    click: {
      selector: SLOT.trigger,
      handler: "handleTriggerClick",
    },
    keydown: {
      selector: SLOT.trigger,
      handler: "handleKeyDown",
    },
  },

  setup(ctx) {
    type AccordionElement = HTMLElement & {
      value: string;
      multiple: boolean;
      collapsible: boolean;
    };

    const getItems = (): HTMLElement[] => ctx.querySlot<HTMLElement>("item");

    const getExpandedItems = (): string[] => {
      const el = ctx.element as unknown as AccordionElement;
      return el.value ? el.value.split(",").filter(Boolean) : [];
    };

    const updateAria = (): void => {
      const items = getItems();
      const expandedItems = getExpandedItems();

      items.forEach((item) => {
        const itemName = item.getAttribute("name") ?? "";
        const isExpanded = expandedItems.includes(itemName);

        const trigger = item.querySelector(SLOT.trigger) as HTMLElement | null;
        const content = item.querySelector(SLOT.content) as HTMLElement | null;

        if (trigger && content) {
          const triggerId = ensureId(trigger, "w-accordion-trigger");
          const contentId = ensureId(content, "w-accordion-content");

          trigger.setAttribute(ARIA.expanded, String(isExpanded));
          trigger.setAttribute(ARIA.controls, contentId);
          trigger.setAttribute("id", triggerId);

          content.setAttribute("role", "region");
          content.setAttribute(ARIA.labelledby, triggerId);
          content.hidden = !isExpanded;
        }
      });
    };

    const toggleItem = (itemName: string): void => {
      const el = ctx.element as unknown as AccordionElement;
      const expandedItems = getExpandedItems();
      const isExpanded = expandedItems.includes(itemName);

      let newExpandedItems: string[];

      if (isExpanded) {
        // Collapse
        if (!el.collapsible && expandedItems.length === 1) {
          return; // Can't collapse the only open item if not collapsible
        }
        newExpandedItems = expandedItems.filter((name) => name !== itemName);
      } else {
        // Expand
        if (el.multiple) {
          newExpandedItems = [...expandedItems, itemName];
        } else {
          newExpandedItems = [itemName];
        }
      }

      el.value = newExpandedItems.join(",");
      updateAria();

      ctx.emit("change", {
        value: el.value,
        expanded: newExpandedItems,
        toggled: itemName,
        isExpanded: !isExpanded,
      });
    };

    // Initial setup
    updateAria();

    Object.assign(ctx.element, {
      handleTriggerClick(e: Event): void {
        const trigger = e.target as HTMLElement;
        const item = trigger.closest(SLOT.item) as HTMLElement | null;
        const itemName = item?.getAttribute("name");

        if (itemName) {
          toggleItem(itemName);
        }
      },

      handleKeyDown(e: KeyboardEvent): void {
        const triggers = getItems()
          .map((item) => item.querySelector(SLOT.trigger) as HTMLElement)
          .filter(Boolean);

        const currentIndex = triggers.indexOf(e.target as HTMLElement);
        if (currentIndex === -1) return;

        let newIndex = currentIndex;

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            newIndex = (currentIndex + 1) % triggers.length;
            break;
          case "ArrowUp":
            e.preventDefault();
            newIndex = (currentIndex - 1 + triggers.length) % triggers.length;
            break;
          case "Home":
            e.preventDefault();
            newIndex = 0;
            break;
          case "End":
            e.preventDefault();
            newIndex = triggers.length - 1;
            break;
          case "Enter":
          case " ":
            e.preventDefault();
            (
              ctx.element as unknown as AccordionElement & {
                handleTriggerClick: (e: Event) => void;
              }
            ).handleTriggerClick(e);
            return;
        }

        if (newIndex !== currentIndex) {
          triggers[newIndex]?.focus();
        }
      },

      expand(itemName: string): void {
        const el = ctx.element as unknown as AccordionElement;
        const expandedItems = getExpandedItems();

        if (!expandedItems.includes(itemName)) {
          if (el.multiple) {
            el.value = [...expandedItems, itemName].join(",");
          } else {
            el.value = itemName;
          }
          updateAria();
        }
      },

      collapse(itemName: string): void {
        const el = ctx.element as unknown as AccordionElement;
        const expandedItems = getExpandedItems();

        if (el.collapsible || expandedItems.length > 1) {
          el.value = expandedItems
            .filter((name) => name !== itemName)
            .join(",");
          updateAria();
        }
      },

      expandAll(): void {
        const el = ctx.element as unknown as AccordionElement;
        if (!el.multiple) return;

        const items = getItems();
        el.value = items
          .map((item) => item.getAttribute("name"))
          .filter(Boolean)
          .join(",");
        updateAria();
      },

      collapseAll(): void {
        const el = ctx.element as unknown as AccordionElement;
        if (!el.collapsible) return;

        el.value = "";
        updateAria();
      },
    });

    // Watch for attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "value") {
          updateAria();
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });
    ctx.onCleanup(() => observer.disconnect());
  },
});

export {};
