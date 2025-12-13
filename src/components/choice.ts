import { defineComponent } from "../factory";
import { createRovingTabindex } from "../infra/focus";
import { SLOT, ARIA } from "../constants";

interface ChoiceElement extends HTMLElement {
  value: string;
  mode: string;
  disabled: boolean;
  orientation: string;
  handleOptionClick(e: Event, target: HTMLElement): void;
}

defineComponent({
  tag: "w-choice",

  props: [
    { name: "value", type: String, default: "" },
    { name: "mode", type: String, default: "radio" },
    { name: "required", type: Boolean, default: false },
    { name: "disabled", type: Boolean, default: false },
    { name: "orientation", type: String, default: "vertical" },
  ],

  children: {
    options: { selector: SLOT.opt, multiple: true },
  },

  events: {
    click: {
      selector: SLOT.opt,
      handler: "handleOptionClick",
    },
    keydown: {
      handler: "handleKeyDown",
    },
  },

  setup(ctx) {
    const el = ctx.element as unknown as ChoiceElement;

    const getOptions = (): HTMLElement[] => {
      return ctx.querySlot<HTMLElement>("opt");
    };

    let rovingTabindex: ReturnType<typeof createRovingTabindex> | null = null;

    const updateAria = (): void => {
      const options = getOptions();
      const values = el.value ? el.value.split(",").filter(Boolean) : [];

      ctx.element.setAttribute(
        "role",
        el.mode === "radio" ? "radiogroup" : "group"
      );
      ctx.element.setAttribute(ARIA.orientation, el.orientation);

      if (el.disabled) {
        ctx.element.setAttribute(ARIA.disabled, "true");
      } else {
        ctx.element.removeAttribute(ARIA.disabled);
      }

      options.forEach((opt) => {
        const optValue = opt.getAttribute("name") ?? "";
        const isSelected =
          el.mode === "checkbox"
            ? values.includes(optValue)
            : el.value === optValue;

        opt.setAttribute("role", el.mode === "radio" ? "radio" : "checkbox");
        opt.setAttribute(ARIA.checked, String(isSelected));

        if (el.disabled) {
          opt.setAttribute(ARIA.disabled, "true");
        } else {
          opt.removeAttribute(ARIA.disabled);
        }
      });
    };

    const setupRovingTabindex = (): void => {
      const options = getOptions();

      if (rovingTabindex) {
        rovingTabindex.destroy();
      }

      rovingTabindex = createRovingTabindex(options, {
        orientation:
          el.orientation === "horizontal" ? "horizontal" : "vertical",
        wrap: true,
      });

      ctx.onCleanup(() => rovingTabindex?.destroy());
    };

    updateAria();
    setupRovingTabindex();

    Object.assign(ctx.element, {
      handleOptionClick(_e: Event, target: HTMLElement): void {
        if (el.disabled) return;

        const optValue = target.getAttribute("name");
        if (!optValue) return;

        let newValue: string;

        if (el.mode === "checkbox") {
          const values = el.value ? el.value.split(",").filter(Boolean) : [];
          const index = values.indexOf(optValue);
          if (index >= 0) {
            values.splice(index, 1);
          } else {
            values.push(optValue);
          }
          newValue = values.join(",");
        } else {
          newValue = optValue;
        }

        el.value = newValue;
        updateAria();

        ctx.emit("change", { value: newValue });
      },

      handleKeyDown(e: KeyboardEvent): void {
        if (el.disabled) return;

        if (e.key === " " || e.key === "Enter") {
          const target = e.target as HTMLElement;
          // Check if target is a w-slot[opt] element
          if (target.matches(SLOT.opt)) {
            e.preventDefault();
            el.handleOptionClick(e, target);
          }
        }
      },

      getValue(): string {
        return el.value;
      },

      setValue(value: string): void {
        el.value = value;
        updateAria();
      },

      getSelectedOptions(): HTMLElement[] {
        const values = el.value ? el.value.split(",").filter(Boolean) : [];
        return getOptions().filter((opt) =>
          values.includes(opt.getAttribute("name") ?? "")
        );
      },
    });

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.attributeName === "value" ||
          mutation.attributeName === "mode" ||
          mutation.attributeName === "disabled"
        ) {
          updateAria();
        }
        if (mutation.attributeName === "orientation") {
          setupRovingTabindex();
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });
    ctx.onCleanup(() => observer.disconnect());
  },
});

export {};
