import type { JSX } from "preact";

// Base attributes for all waria components
type WariaBaseAttributes = JSX.HTMLAttributes<HTMLElement>;

// Extend standard HTML elements to support slot and name attributes used by waria
declare module "preact" {
  namespace JSX {
    interface HTMLAttributes<RefType extends EventTarget = EventTarget> {
      slot?: string;
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
      };

      // Dialog
      "w-dialog": WariaBaseAttributes & {
        open?: boolean;
      };

      // Accordion
      "w-accordion": WariaBaseAttributes & {
        value?: string;
        multiple?: boolean;
      };

      // Collapsible
      "w-collapsible": WariaBaseAttributes & {
        open?: boolean;
      };

      // Switch
      "w-switch": WariaBaseAttributes & {
        checked?: boolean;
        disabled?: boolean;
      };

      // Choice (radio/checkbox group)
      "w-choice": WariaBaseAttributes & {
        value?: string;
        multiple?: boolean;
      };

      // Tree
      "w-tree": WariaBaseAttributes;

      // Menu
      "w-menu": WariaBaseAttributes & {
        open?: boolean;
      };

      // Tooltip
      "w-tooltip": WariaBaseAttributes & {
        open?: boolean;
      };

      // Popover
      "w-popover": WariaBaseAttributes & {
        open?: boolean;
      };

      // Hover Card
      "w-hover-card": WariaBaseAttributes & {
        open?: boolean;
      };

      // Context Menu
      "w-context-menu": WariaBaseAttributes;

      // Toast
      "w-toast": WariaBaseAttributes;

      // Feed
      "w-feed": WariaBaseAttributes;

      // Separator
      "w-separator": WariaBaseAttributes & {
        orientation?: "horizontal" | "vertical";
      };

      // Label
      "w-label": WariaBaseAttributes;

      // Progress Bar
      "w-progressbar": WariaBaseAttributes & {
        value?: number;
        max?: number;
      };

      // Breadcrumb
      "w-breadcrumb": WariaBaseAttributes;

      // Toggle Group
      "w-toggles": WariaBaseAttributes & {
        value?: string;
        multiple?: boolean;
      };

      // Aspect Ratio
      "w-aspect-ratio": WariaBaseAttributes & {
        ratio?: string;
      };

      // Navigation
      "w-navigation": WariaBaseAttributes;

      // Toolbar
      "w-toolbar": WariaBaseAttributes & {
        orientation?: "horizontal" | "vertical";
      };

      // Select
      "w-select": WariaBaseAttributes & {
        value?: string;
        open?: boolean;
      };

      // Range/Slider
      "w-range": WariaBaseAttributes & {
        value?: number;
        min?: number;
        max?: number;
        step?: number;
      };

      // Spin Button
      "w-spinbutton": WariaBaseAttributes & {
        value?: number;
        min?: number;
        max?: number;
        step?: number;
      };

      // Avatar
      "w-avatar": WariaBaseAttributes & {
        src?: string;
        alt?: string;
      };

      // Link
      "w-link": WariaBaseAttributes & {
        href?: string;
      };

      // Carousel
      "w-carousel": WariaBaseAttributes;

      // Scrollbar
      "w-scrollbar": WariaBaseAttributes & {
        orientation?: "horizontal" | "vertical";
      };

      // Grid
      "w-grid": WariaBaseAttributes;

      // Tree Grid
      "w-treegrid": WariaBaseAttributes;

      // View
      "w-view": WariaBaseAttributes;
    }
  }
}
