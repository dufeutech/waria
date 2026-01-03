# Waria

<div align="center">

  <img height="140px" src="https://raw.githubusercontent.com/dufeutech/waria/main/docs/static/img/logo.png" alt="logo"/>

**Framework-agnostic UI primitives via native Web Components (ESM).**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![ESM](https://img.shields.io/badge/ESM-Native-green.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
[![License](https://img.shields.io/badge/License-BSD--3--Clause-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@dufeutech/waria)](https://www.npmjs.com/package/@dufeutech/waria)

[Documentation](https://dufeutech.github.io/waria/) |
[GitHub](https://github.com/dufeutech/waria)

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
npm install @dufeutech/waria
```

## Usage

### ES Modules

```ts
import { App } from "@dufeutech/waria";

App.start({
  hash: true, // Use hash-based routing
});
```

### IIFE (Script Tag)

```html
<script src="https://unpkg.com/@dufeutech/waria/dist/waria.iife.js"></script>
<script>
  waria.App.start({ hash: true });
</script>
```

### Example: Tabs Component

```html
<w-tabs value="tab1">
  <w-slot list>
    <div>
      <w-slot tab name="tab1"><button>Tab 1</button></w-slot>
      <w-slot tab name="tab2"><button>Tab 2</button></w-slot>
    </div>
  </w-slot>
  <w-slot panels>
    <div>
      <w-slot panel name="tab1"><div>Content 1</div></w-slot>
      <w-slot panel name="tab2"><div>Content 2</div></w-slot>
    </div>
  </w-slot>
</w-tabs>
```

### Example: Dialog Component

**slots:**

- **`trigger`**
- **`body`**
- **`close`**

```html
<w-dialog id="dialog_one">
  <w-slot trigger><button>Open Dialog</button></w-slot>
  <w-slot body>
    <div>
      <h3>Dialog Title</h3>
      <p>This is a modal dialog. Press Escape or click the close button to close it.</p>
      <w-slot close><button>Close</button></w-slot>
    </div>
  </w-slot>
</w-dialog>
<script>
  const dialog = document.getElementById("dialog_one");
  dialog.addEventListener("open", () => console.log("opened"));
  dialog.addEventListener("close", () => console.log("closed"));
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
