import { defineComponent } from "../factory";
import { ensureId } from "../aria";
import { onDismiss } from "../infra/click-outside";
import { teleport } from "../infra/portal";
import { autoPosition, type Placement } from "../infra/position";
import { onAttributeChange } from "../core/observe";
import { SLOT, ARIA, KEY } from "../constants";

interface SelectElement extends HTMLElement {
  value: string;
  open: boolean;
  disabled: boolean;
  persistent: boolean;
  placeholder: string;
  portal: boolean;
  label: string;
  handleTriggerClick(e: Event): void;
  handleOptionClick(e: Event, target: HTMLElement): void;
  handleKeyDown(e: KeyboardEvent): void;
}

defineComponent({
  tag: "w-select",

  props: [
    { name: "value", type: String, default: "" },
    { name: "open", type: Boolean, default: false },
    { name: "disabled", type: Boolean, default: false },
    { name: "persistent", type: Boolean, default: false },
    { name: "placeholder", type: String, default: "Select..." },
    { name: "portal", type: Boolean, default: true }, // Default to portal mode for z-index safety
    { name: "label", type: String, default: "" },
  ],

  children: {
    trigger: SLOT.trigger,
    listbox: SLOT.listbox,
    options: { selector: SLOT.option, multiple: true },
  },

  events: {
    click: [
      {
        selector: SLOT.trigger,
        handler: "handleTriggerClick",
      },
      {
        selector: SLOT.option,
        handler: "handleOptionClick",
      },
    ],
    keydown: {
      handler: "handleKeyDown",
    },
  },

  setup(ctx) {
    const el = ctx.element as unknown as SelectElement;

    let dismissCleanup: (() => void) | null = null;
    let highlightedIndex = -1;
    let portalCleanup: (() => void) | null = null;
    let positionCleanup: (() => void) | null = null;
    let listboxClickHandler: ((e: Event) => void) | null = null;
    let listboxKeydownHandler: ((e: KeyboardEvent) => void) | null = null;

    const getTrigger = (): HTMLElement | null =>
      ctx.query<HTMLElement>(SLOT.trigger);

    // Store reference to listbox element (needed when portaled)
    let listboxRef: HTMLElement | null = null;

    const getListbox = (): HTMLElement | null => {
      // First try local query (when not portaled)
      const localListbox = ctx.query<HTMLElement>(SLOT.listbox);
      if (localListbox) {
        listboxRef = localListbox;
        return localListbox;
      }
      // If not found locally, check portal using stored reference or data attribute
      if (listboxRef && document.body.contains(listboxRef)) {
        return listboxRef;
      }
      // Last resort: find by data-portal-owner attribute
      const portaledListbox = document.querySelector<HTMLElement>(
        `${SLOT.listbox}[data-portal-owner="${ctx.element.id}"]`
      );
      if (portaledListbox) {
        listboxRef = portaledListbox;
        return portaledListbox;
      }
      return null;
    };

    const getOptions = (): NodeListOf<HTMLElement> => {
      const listbox = getListbox();
      if (listbox) {
        return listbox.querySelectorAll<HTMLElement>(SLOT.option);
      }
      return el.querySelectorAll<HTMLElement>(SLOT.option);
    };

    const updateAria = (): void => {
      const trigger = getTrigger();
      const listbox = getListbox();
      const options = getOptions();

      if (trigger) {
        trigger.setAttribute("role", "combobox");
        trigger.setAttribute(ARIA.haspopup, "listbox");
        trigger.setAttribute(ARIA.expanded, String(el.open));
        trigger.setAttribute("tabindex", "0");

        // Apply accessible label to trigger
        if (el.label) {
          trigger.setAttribute(ARIA.label, el.label);
        } else if (el.hasAttribute(ARIA.labelledby)) {
          trigger.setAttribute(
            ARIA.labelledby,
            el.getAttribute(ARIA.labelledby)!
          );
        }

        if (listbox) {
          trigger.setAttribute(
            ARIA.controls,
            ensureId(listbox, "w-select-listbox")
          );
        }

        if (el.disabled) {
          trigger.setAttribute(ARIA.disabled, "true");
        } else {
          trigger.removeAttribute(ARIA.disabled);
        }
      }

      if (listbox) {
        listbox.setAttribute("role", "listbox");
        listbox.hidden = !el.open;
      }

      options.forEach((option, index) => {
        const optionValue = option.getAttribute("value") || "";
        option.setAttribute("role", "option");
        option.setAttribute(ARIA.selected, String(optionValue === el.value));
        option.setAttribute("tabindex", "-1");
        option.id = option.id || `w-select-option-${index}`;
      });
    };

    const openSelect = (): void => {
      if (el.disabled || el.open) return;

      el.open = true;
      highlightedIndex = -1;

      // Find currently selected option to highlight
      const options = Array.from(getOptions());
      const selectedIndex = options.findIndex(
        (opt) => opt.getAttribute("value") === el.value
      );
      if (selectedIndex >= 0) {
        highlightedIndex = selectedIndex;
      }

      updateAria();

      const listbox = getListbox();

      // Teleport listbox to portal if enabled
      if (el.portal && listbox) {
        // Add tracking attribute to link portaled listbox back to owner
        ensureId(ctx.element, "w-select");
        listbox.setAttribute("data-portal-owner", ctx.element.id);

        portalCleanup = teleport(listbox);

        // Attach direct event listeners to portaled content (event delegation doesn't work across portal)
        listboxClickHandler = (e: Event) => {
          const target = (e.target as HTMLElement).closest(
            SLOT.option
          ) as HTMLElement | null;
          if (target) {
            (ctx.element as any).handleOptionClick(e, target);
          }
        };
        listboxKeydownHandler = (e: KeyboardEvent) => {
          (ctx.element as any).handleKeyDown(e);
        };
        listbox.addEventListener("click", listboxClickHandler);
        listbox.addEventListener("keydown", listboxKeydownHandler);

        // Position listbox relative to trigger
        const trigger = getTrigger();
        if (trigger) {
          positionCleanup = autoPosition({
            reference: trigger,
            floating: listbox,
            placement: "bottom-start" as Placement,
            offset: 4,
          });
        }
      }

      updateHighlight();

      // Setup dismiss on outside click or escape (skip if persistent)
      const trigger = getTrigger();
      const listbox2 = getListbox();
      if (listbox2 && !el.persistent) {
        dismissCleanup = onDismiss(
          trigger ? [trigger, listbox2] : [listbox2],
          () => closeSelect(),
          { escapeKey: true, delay: 10 }
        );
      }

      ctx.emit("open");
    };

    const closeSelect = (): void => {
      if (!el.open) return;

      const listbox = getListbox();

      el.open = false;
      highlightedIndex = -1;
      updateAria();

      dismissCleanup?.();
      dismissCleanup = null;

      // Remove direct event listeners from portaled content
      if (listbox && listboxClickHandler) {
        listbox.removeEventListener("click", listboxClickHandler);
        listboxClickHandler = null;
      }
      if (listbox && listboxKeydownHandler) {
        listbox.removeEventListener(
          "keydown",
          listboxKeydownHandler as EventListener
        );
        listboxKeydownHandler = null;
      }

      // Cleanup position
      positionCleanup?.();
      positionCleanup = null;

      // Restore listbox from portal
      if (portalCleanup) {
        portalCleanup();
        portalCleanup = null;
        // Remove tracking attribute
        listbox?.removeAttribute("data-portal-owner");
      }

      // Return focus to trigger
      getTrigger()?.focus();

      ctx.emit("close");
    };

    const selectOption = (option: HTMLElement): void => {
      const value = option.getAttribute("value") || "";
      el.value = value;
      el.setAttribute("value", value);

      updateAria();
      closeSelect();

      ctx.emit("change", { value });
    };

    const updateHighlight = (): void => {
      const options = getOptions();
      options.forEach((option, index) => {
        if (index === highlightedIndex) {
          option.setAttribute("data-highlighted", "");
          option.focus();
        } else {
          option.removeAttribute("data-highlighted");
        }
      });
    };

    const highlightNext = (): void => {
      const options = getOptions();
      if (options.length === 0) return;

      highlightedIndex = (highlightedIndex + 1) % options.length;
      updateHighlight();
    };

    const highlightPrev = (): void => {
      const options = getOptions();
      if (options.length === 0) return;

      highlightedIndex =
        (highlightedIndex - 1 + options.length) % options.length;
      updateHighlight();
    };

    const highlightFirst = (): void => {
      highlightedIndex = 0;
      updateHighlight();
    };

    const highlightLast = (): void => {
      const options = getOptions();
      highlightedIndex = options.length - 1;
      updateHighlight();
    };

    updateAria();

    Object.assign(ctx.element, {
      handleTriggerClick(e: Event): void {
        e.preventDefault();
        if (el.open) {
          closeSelect();
        } else {
          openSelect();
        }
      },

      handleOptionClick(e: Event, target: HTMLElement): void {
        e.preventDefault();
        selectOption(target);
      },

      handleKeyDown(e: KeyboardEvent): void {
        const trigger = getTrigger();
        const isTriggerFocused = document.activeElement === trigger;

        if (isTriggerFocused && !el.open) {
          // Trigger is focused, listbox is closed
          switch (e.key) {
            case KEY.Enter:
            case KEY.Space:
            case KEY.ArrowDown:
            case KEY.ArrowUp:
              e.preventDefault();
              openSelect();
              if (e.key === KEY.ArrowDown || e.key === KEY.ArrowUp) {
                highlightFirst();
              }
              break;
          }
        } else if (el.open) {
          // Listbox is open
          switch (e.key) {
            case KEY.ArrowDown:
              e.preventDefault();
              highlightNext();
              break;

            case KEY.ArrowUp:
              e.preventDefault();
              highlightPrev();
              break;

            case KEY.Home:
              e.preventDefault();
              highlightFirst();
              break;

            case KEY.End:
              e.preventDefault();
              highlightLast();
              break;

            case KEY.Enter:
            case KEY.Space:
              e.preventDefault();
              const options = getOptions();
              if (highlightedIndex >= 0 && highlightedIndex < options.length) {
                selectOption(options[highlightedIndex]);
              }
              break;

            case KEY.Escape:
              e.preventDefault();
              if (!el.persistent) {
                closeSelect();
              }
              break;

            case KEY.Tab:
              closeSelect();
              break;
          }
        }
      },
    });

    ctx.onCleanup(
      onAttributeChange(
        ctx.element,
        ["value", "disabled", "open", "label"],
        updateAria
      )
    );

    ctx.onCleanup(() => {
      dismissCleanup?.();

      // Clean up portal and direct event listeners
      const listbox = getListbox();
      if (listbox && listboxClickHandler) {
        listbox.removeEventListener("click", listboxClickHandler);
      }
      if (listbox && listboxKeydownHandler) {
        listbox.removeEventListener(
          "keydown",
          listboxKeydownHandler as EventListener
        );
      }
      positionCleanup?.();
      portalCleanup?.();
    });
  },
});

export {};
