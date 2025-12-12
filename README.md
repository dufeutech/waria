# Waria

<div align="center">

**A modern, framework-agnostic UI primitive library built with vanilla JavaScript, Web Components, and native ESM modules**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![ESM](https://img.shields.io/badge/ESM-Native-green.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
[![License](https://img.shields.io/badge/License-BSD--3--Clause-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@dufeut/waria)](https://www.npmjs.com/package/@dufeut/waria)

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

```bash
pnpm add @dufeut/waria
```

```bash
yarn add @dufeut/waria
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
<w-tabs>
  <button slot="tab">Tab 1</button>
  <button slot="tab">Tab 2</button>
  <div slot="panel">Content 1</div>
  <div slot="panel">Content 2</div>
</w-tabs>
```

### Example: Dialog Component

```html
<button id="open-dialog">Open Dialog</button>

<w-dialog trigger="#open-dialog">
  <div slot="content">
    <h2>Dialog Title</h2>
    <p>Dialog content goes here.</p>
    <button data-close>Close</button>
  </div>
</w-dialog>
```

## Documentation

Visit the [documentation site](https://dufeut.github.io/waria/) for full API reference and examples.

## Components

| Category | Components |
|----------|------------|
| Core | Accordion, Collapsible, Tabs, Tree |
| Form | Choice (Radio/Checkbox), Label, Range, Select, Spinbutton, Switch, Toggles |
| Overlay | Context Menu, Dialog, Hover Card, Menu, Popover, Toast, Tooltip |
| Layout | Aspect Ratio, Avatar, Carousel, Link, Scrollbar, Separator |
| Data | Feed, Grid, Treegrid |
| Feedback | Progressbar |
| Utility | Breadcrumb, Navigation, Toolbar, View |

## License

[BSD-3-Clause](LICENSE)

## References

- [ARIA Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)
- [ARIA Specification](https://www.w3.org/TR/wai-aria-1.2/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
