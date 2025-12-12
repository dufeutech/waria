import type { JSX } from "preact";
import type { App } from "@dufeut/waria";

// Declare waria as a global variable
declare global {
  const waria: typeof App;
}

// Base attributes for all waria components (permissive to allow unknown attributes)
type WariaBaseAttributes = JSX.HTMLAttributes<HTMLElement> & {
  [key: string]: unknown;
};

// Available slot names in waria components
type WariaSlotName =
  | "trigger"
  | "content"
  | "close"
  | "item"
  | "panel"
  | "label"
  | "description"
  | "icon"
  | "header"
  | "footer"
  | "option"
  | "list"
  | "tabs"
  | "views"
  | "view"
  | "cell"
  | "row"
  | "rowheader"
  | "image"
  | "tab"
  | "prev"
  | "next"
  | "indicators"
  | "indicator"
  | "fallback"
  | "submenu"
  | "thumb"
  | "fill"
  | "track"
  | "listbox"
  | "input"
  | "display"
  | "increment"
  | "decrement"
  | "separator"
  | "message";

// Extend standard HTML elements to support slot and name attributes used by waria
declare module "preact" {
  namespace JSX {
    interface HTMLAttributes<RefType extends EventTarget = EventTarget> {
      slot?: WariaSlotName | (string & {});
      name?: string;
    }
  }
}

declare module "preact" {
  namespace JSX {
    interface IntrinsicElements {
      // Tabs
      "w-tabs": WariaBaseAttributes & {
        value?: string;
        orientation?: "horizontal" | "vertical";
        activation?: "automatic" | "manual";
      };

      // Dialog
      "w-dialog": WariaBaseAttributes & {
        open?: boolean;
        modal?: boolean;
        persistent?: boolean;
        closeOnEscape?: boolean;
        closeOnOutsideClick?: boolean;
        returnFocus?: boolean;
        label?: string;
      };

      // Accordion
      "w-accordion": WariaBaseAttributes & {
        value?: string;
        multiple?: boolean;
        collapsible?: boolean;
      };

      // Collapsible
      "w-collapsible": WariaBaseAttributes & {
        open?: boolean;
        disabled?: boolean;
      };

      // Switch
      "w-switch": WariaBaseAttributes & {
        pressed?: boolean;
        disabled?: boolean;
        label?: string;
      };

      // Choice (radio/checkbox group)
      "w-choice": WariaBaseAttributes & {
        value?: string;
        mode?: "radio" | "checkbox";
        required?: boolean;
        disabled?: boolean;
        orientation?: "horizontal" | "vertical";
      };

      // Tree
      "w-tree": WariaBaseAttributes & {
        value?: string;
        expanded?: string;
        multiselect?: boolean;
      };

      // Menu
      "w-menu": WariaBaseAttributes & {
        open?: boolean;
        placement?: string;
        persistent?: boolean;
        closeOnSelect?: boolean;
        portal?: boolean;
      };

      // Tooltip
      "w-tooltip": WariaBaseAttributes & {
        open?: boolean;
        placement?: string;
        delay?: number;
        closeDelay?: number;
        portal?: boolean;
      };

      // Popover
      "w-popover": WariaBaseAttributes & {
        open?: boolean;
        placement?: string;
        persistent?: boolean;
        closeOnOutsideClick?: boolean;
        closeOnEscape?: boolean;
        returnFocus?: boolean;
        portal?: boolean;
        label?: string;
      };

      // Hover Card
      "w-hover-card": WariaBaseAttributes & {
        open?: boolean;
        placement?: string;
        openDelay?: number;
        closeDelay?: number;
        portal?: boolean;
      };

      // Context Menu
      "w-context-menu": WariaBaseAttributes & {
        open?: boolean;
        closeOnSelect?: boolean;
        portal?: boolean;
      };

      // Toast
      "w-toast": WariaBaseAttributes & {
        open?: boolean;
        duration?: number;
        variant?: "default" | "success" | "error" | "warning" | "info";
        dismissible?: boolean;
        portal?: boolean;
        label?: string;
      };

      // Feed
      "w-feed": WariaBaseAttributes & {
        label?: string;
        busy?: boolean;
        loading?: boolean;
      };

      // Separator
      "w-separator": WariaBaseAttributes & {
        orientation?: "horizontal" | "vertical";
        decorative?: boolean;
      };

      // Label
      "w-label": WariaBaseAttributes & {
        for?: string;
        required?: boolean;
        disabled?: boolean;
      };

      // Progress Bar
      "w-progressbar": WariaBaseAttributes & {
        value?: number;
        min?: number;
        max?: number;
        indeterminate?: boolean;
        label?: string;
      };

      // Breadcrumb
      "w-breadcrumb": WariaBaseAttributes & {
        separator?: string;
        label?: string;
      };

      // Toggle Group
      "w-toggles": WariaBaseAttributes & {
        value?: string;
        multiple?: boolean;
        disabled?: boolean;
        label?: string;
      };

      // Aspect Ratio
      "w-aspect-ratio": WariaBaseAttributes & {
        ratio?: string;
      };

      // Navigation (actual tag is w-nav)
      "w-nav": WariaBaseAttributes & {
        label?: string;
        orientation?: "horizontal" | "vertical";
        value?: string;
      };

      // Toolbar
      "w-toolbar": WariaBaseAttributes & {
        orientation?: "horizontal" | "vertical";
        label?: string;
      };

      // Select
      "w-select": WariaBaseAttributes & {
        value?: string;
        open?: boolean;
        placement?: string;
        portal?: boolean;
        disabled?: boolean;
        persistent?: boolean;
        placeholder?: string;
        label?: string;
      };

      // Range/Slider
      "w-range": WariaBaseAttributes & {
        value?: number;
        min?: number;
        max?: number;
        step?: number;
        orientation?: "horizontal" | "vertical";
        disabled?: boolean;
        label?: string;
        name?: string;
      };

      // Spin Button
      "w-spinbutton": WariaBaseAttributes & {
        value?: number;
        min?: number;
        max?: number;
        step?: number;
        pageStep?: number;
        disabled?: boolean;
        label?: string;
        name?: string;
        wrap?: boolean;
      };

      // Avatar
      "w-avatar": WariaBaseAttributes & {
        src?: string;
        fallback?: string;
        size?: "small" | "medium" | "large" | string;
        shape?: "circle" | "square" | "rounded";
        decorative?: boolean;
        label?: string;
      };

      // Link
      "w-link": WariaBaseAttributes & {
        href?: string;
        external?: boolean;
        disabled?: boolean;
        variant?: string;
      };

      // Carousel
      "w-carousel": WariaBaseAttributes & {
        label?: string;
        current?: number;
        autoplay?: boolean;
        interval?: number;
        loop?: boolean;
      };

      // Scrollbar
      "w-scrollbar": WariaBaseAttributes & {
        orientation?: "horizontal" | "vertical" | "both";
      };

      // Grid
      "w-grid": WariaBaseAttributes & {
        label?: string;
        selectionMode?: "none" | "cell" | "row";
        multiSelect?: boolean;
      };

      // Tree Grid
      "w-treegrid": WariaBaseAttributes & {
        label?: string;
        selectionMode?: "none" | "single" | "multiple";
      };

      // View
      "w-view": WariaBaseAttributes & {
        path?: string;
        label?: string;
        active?: boolean;
      };
    }
  }
}
