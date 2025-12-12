import { defineComponent } from "../factory";
import { onAttributeChange } from "../core/observe";
import { SLOT, ARIA, KEY } from "../constants";

interface TogglesElement extends HTMLElement {
  value: string;
  multiple: boolean;
  disabled: boolean;
  label: string;
  handleItemClick(e: Event, target: HTMLElement): void;
  handleKeyDown(e: KeyboardEvent): void;
}

defineComponent({
  tag: "w-toggles",

  props: [
    { name: "value", type: String, default: "" },
    { name: "multiple", type: Boolean, default: false },
    { name: "disabled", type: Boolean, default: false },
    { name: "label", type: String, default: "" },
  ],

  children: {
    items: { selector: SLOT.item, multiple: true },
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
    const el = ctx.element as unknown as TogglesElement;

    const getItems = (): NodeListOf<HTMLElement> =>
      el.querySelectorAll<HTMLElement>(SLOT.item);

    const getSelectedValues = (): string[] => {
      const value = el.getAttribute("value") || el.value || "";
      return value ? value.split(",").filter(Boolean) : [];
    };

    const setSelectedValues = (values: string[]): void => {
      const newValue = values.join(",");
      el.value = newValue;
      el.setAttribute("value", newValue);
    };

    const updateAria = (): void => {
      el.setAttribute("role", "group");
      if (el.label) {
        el.setAttribute(ARIA.label, el.label);
      } else if (!el.hasAttribute(ARIA.labelledby)) {
        el.setAttribute(ARIA.label, "Toggle group");
      }

      const items = getItems();
      const selectedValues = getSelectedValues();

      items.forEach((item, index) => {
        const itemName = item.getAttribute("name") || "";
        const isPressed = selectedValues.includes(itemName);

        item.setAttribute(ARIA.pressed, String(isPressed));
        item.setAttribute("tabindex", index === 0 ? "0" : "-1");

        if (el.disabled || item.hasAttribute("disabled")) {
          item.setAttribute(ARIA.disabled, "true");
        } else {
          item.removeAttribute(ARIA.disabled);
        }
      });
    };

    const toggleItem = (item: HTMLElement): void => {
      if (el.disabled || item.hasAttribute("disabled")) return;

      const itemName = item.getAttribute("name") || "";
      const selectedValues = getSelectedValues();

      if (!el.multiple) {
        if (!selectedValues.includes(itemName)) {
          setSelectedValues([itemName]);
        } else {
          return;
        }
      } else {
        if (selectedValues.includes(itemName)) {
          setSelectedValues(selectedValues.filter((v) => v !== itemName));
        } else {
          setSelectedValues([...selectedValues, itemName]);
        }
      }

      updateAria();
      ctx.emit("change", { value: getSelectedValues() });
    };

    const focusItem = (index: number): void => {
      const items = getItems();
      if (index >= 0 && index < items.length) {
        items.forEach((item, i) => {
          item.setAttribute("tabindex", i === index ? "0" : "-1");
        });
        items[index].focus();
      }
    };

    updateAria();

    Object.assign(ctx.element, {
      handleItemClick(_e: Event, target: HTMLElement): void {
        toggleItem(target);
      },

      handleKeyDown(e: KeyboardEvent): void {
        const target = e.target as HTMLElement;
        if (target.getAttribute("slot") !== "item") return;

        const items = Array.from(getItems());
        const currentIndex = items.indexOf(target);
        if (currentIndex === -1) return;

        switch (e.key) {
          case KEY.ArrowRight:
          case KEY.ArrowDown:
            e.preventDefault();
            focusItem((currentIndex + 1) % items.length);
            break;

          case KEY.ArrowLeft:
          case KEY.ArrowUp:
            e.preventDefault();
            focusItem((currentIndex - 1 + items.length) % items.length);
            break;

          case KEY.Home:
            e.preventDefault();
            focusItem(0);
            break;

          case KEY.End:
            e.preventDefault();
            focusItem(items.length - 1);
            break;

          case KEY.Enter:
          case KEY.Space:
            e.preventDefault();
            toggleItem(target);
            break;
        }
      },
    });

    ctx.onCleanup(
      onAttributeChange(ctx.element, ["value", "disabled", "label"], updateAria)
    );
  },
});

export {};
