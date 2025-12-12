import { defineComponent } from "../factory";
import { onAttributeChange } from "../core/observe";
import { SLOT, ARIA } from "../constants";

interface BreadcrumbElement extends HTMLElement {
  separator: string;
  label: string;
}

defineComponent({
  tag: "w-breadcrumb",

  props: [
    { name: "separator", type: String, default: "/" },
    { name: "label", type: String, default: "" },
  ],

  children: {
    list: SLOT.list,
    items: { selector: SLOT.item, multiple: true },
  },

  setup(ctx) {
    const el = ctx.element as unknown as BreadcrumbElement;

    const getList = (): HTMLElement | null => ctx.query<HTMLElement>(SLOT.list);
    const getItems = (): NodeListOf<HTMLElement> =>
      el.querySelectorAll<HTMLElement>(SLOT.item);

    const updateAria = (): void => {
      // Set navigation role and label
      el.setAttribute("role", "navigation");
      if (el.label) {
        el.setAttribute(ARIA.label, el.label);
      } else if (!el.hasAttribute(ARIA.labelledby)) {
        el.setAttribute(ARIA.label, "Breadcrumb");
      }

      // Set list role on the list container
      const list = getList();
      if (list) {
        list.setAttribute("role", "list");
      }

      // Set listitem role and aria-current on items
      const items = getItems();
      items.forEach((item) => {
        item.setAttribute("role", "listitem");

        if (item.hasAttribute("current")) {
          item.setAttribute(ARIA.current, "page");
        } else {
          item.removeAttribute(ARIA.current);
        }
      });
    };

    updateAria();

    // Observe changes to items
    const observer = new MutationObserver(() => {
      updateAria();
    });

    observer.observe(ctx.element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["current"],
    });

    ctx.onCleanup(() => {
      observer.disconnect();
    });

    ctx.onCleanup(onAttributeChange(ctx.element, ["label"], updateAria));
  },
});

export {};
