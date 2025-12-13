import { defineComponent } from "../factory";

/**
 * w-slot - A slot container component for waria
 *
 * Usage:
 *   <w-slot trigger><button>Click me</button></w-slot>
 *   <w-slot body><div>Content here</div></w-slot>
 *
 * Benefits:
 * - Type safety: Only valid slot names are accepted as attributes
 * - Performance: w-slot[trigger] is faster than [slot="trigger"]
 * - Self-documenting: Clear visual indication of slot purpose
 * - Default behavior: Can apply default ARIA, styles, event handlers
 */
defineComponent({
  tag: "w-slot",

  props: [
    // Universal slots (12)
    { name: "trigger", type: Boolean, default: false },
    { name: "body", type: Boolean, default: false },
    { name: "close", type: Boolean, default: false },
    { name: "item", type: Boolean, default: false },
    { name: "label", type: Boolean, default: false },
    { name: "docs", type: Boolean, default: false },
    { name: "icon", type: Boolean, default: false },
    { name: "head", type: Boolean, default: false },
    { name: "foot", type: Boolean, default: false },
    { name: "opt", type: Boolean, default: false },
    { name: "sep", type: Boolean, default: false },
    { name: "msg", type: Boolean, default: false },
    // Tabs slots (4)
    { name: "list", type: Boolean, default: false },
    { name: "tab", type: Boolean, default: false },
    { name: "panels", type: Boolean, default: false },
    { name: "panel", type: Boolean, default: false },
    // Carousel slots (4)
    { name: "prev", type: Boolean, default: false },
    { name: "next", type: Boolean, default: false },
    { name: "dots", type: Boolean, default: false },
    { name: "dot", type: Boolean, default: false },
    // Grid slots (2)
    { name: "cell", type: Boolean, default: false },
    { name: "row", type: Boolean, default: false },
    // Range slots (3)
    { name: "knob", type: Boolean, default: false },
    { name: "fill", type: Boolean, default: false },
    { name: "rail", type: Boolean, default: false },
    // Spinbutton slots (4)
    { name: "input", type: Boolean, default: false },
    { name: "value", type: Boolean, default: false },
    { name: "up", type: Boolean, default: false },
    { name: "down", type: Boolean, default: false },
    // Other slots (4)
    { name: "menu", type: Boolean, default: false },
    { name: "img", type: Boolean, default: false },
    { name: "alt", type: Boolean, default: false },
    { name: "sub", type: Boolean, default: false },
  ],

  setup(ctx) {
    const el = ctx.element;

    // Make the slot transparent (display: contents)
    // This ensures the w-slot element doesn't affect layout
    el.style.display = "contents";
  },
});

export {};
