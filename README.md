# Waria

<div align="center">

  <img height="140px" src="https://raw.githubusercontent.com/dufeut/waria/main/docs/static/img/logo.png" alt="logo"/>

**Framework-agnostic UI primitives via native Web Components (ESM).**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![ESM](https://img.shields.io/badge/ESM-Native-green.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
[![License](https://img.shields.io/badge/License-BSD--3--Clause-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@dufeut/waria)](https://www.npmjs.com/package/@dufeut/waria)

[Documentation](https://dufeut.github.io/waria/) |
[GitHub](https://github.com/dufeut/waria)

</div>

## Features

- **30+ Accessible Components** - WCAG 2.1 Level AA compliant UI primitives
- **Zero Dependencies** - Pure vanilla JavaScript
- **Unstyled & Composable** - Bring your own styles, complete design freedom
- **Framework Agnostic** - Works with Vue, Svelte, React, Preact, Alpine.js, or vanilla JS
- **Native ESM** - Modern JavaScript modules, no build tools required
- **Accessibility First** - Full ARIA support, keyboard navigation, focus management
- **Performance Optimized** - Lightweight, efficient, and fast
- **TypeScript** - Full type safety and excellent DX
- **Web Standards** - Built on Web Components and modern web APIs

## Installation

```bash
npm install @dufeut/waria
```

## Usage

### ES Modules

```ts
import { App } from "@dufeut/waria";

App.start({
  hash: true, // Use hash-based routing
});
```

### IIFE (Script Tag)

```html
<script src="https://unpkg.com/@dufeut/waria/dist/waria.iife.js"></script>
<script>
  waria.App.start({ hash: true });
</script>
```

### Example: Tabs Component

```html
<w-tabs value="tab1">
  <button slot="tab" name="tab1">Tab 1</button>
  <button slot="tab" name="tab2">Tab 2</button>
  <div slot="panel" name="tab1">Content 1</div>
  <div slot="panel" name="tab2">Content 2</div>
</w-tabs>
```

### Example: Dialog Component

**slots:**

- **`trigger`**
- **`content`**
- **`close`**

```html
<w-dialog id="dialog_one">
  <button slot="trigger" style="cursor: pointer">Open Dialog</button>
  <div
    slot="content"
    label="Example Dialog"
    style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        max-width: 400px;
      "
  >
    <h3>Dialog Title</h3>
    <p>
      This is a modal dialog. Press Escape or click the close button to close
      it.
    </p>
    <button slot="close" style="padding: 0.5rem 1rem; cursor: pointer">
      Close
    </button>
  </div>
</w-dialog>
<script>
  // Close Dialog: `dialog_one` every 2 seconds.
  const dialog = document.getElementById("dialog_one");
  setInterval(() => {
    dialog.close();
  }, 2000);
  // Listen to Open
  document.getElementById("dialog_one").addEventListener("open", () => {
    console.log("opened");
  });
</script>
```

## Event Handlers

Use `w-*` attributes for inline event handling:

```html
<w-dialog w-open="console.log('opened')" w-close="console.log('closed')">
  ...
</w-dialog>

<w-menu w-select="handleSelect(event.detail)">
  ...
</w-menu>
```

Or use `addEventListener`:

```js
dialog.addEventListener('open', (e) => console.log('opened'));
```

## Components

| Category | Components                                                                 |
| -------- | -------------------------------------------------------------------------- |
| Core     | Accordion, Collapsible, Tabs, Tree                                         |
| Form     | Choice (Radio/Checkbox), Label, Range, Select, Spinbutton, Switch, Toggles |
| Overlay  | Context Menu, Dialog, Hover Card, Menu, Popover, Toast, Tooltip            |
| Layout   | Aspect Ratio, Avatar, Carousel, Link, Scrollbar, Separator                 |
| Data     | Feed, Grid, Treegrid                                                       |
| Feedback | Progressbar                                                                |
| Utility  | Breadcrumb, Navigation, Toolbar, View                                      |

## License

[BSD-3-Clause](LICENSE)

## References

- [ARIA Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)
- [ARIA Specification](https://www.w3.org/TR/wai-aria-1.2/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
