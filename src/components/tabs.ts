import { defineComponent } from "../factory";
import { ensureId } from "../aria";
import { createRovingTabindex } from "../infra/focus";
import { SLOT, ARIA } from "../constants";

interface TabsElement extends HTMLElement {
  value: string;
  orientation: string;
  activation: string;
}

defineComponent({
  tag: "w-tabs",

  props: [
    { name: "value", type: String, default: "" },
    { name: "orientation", type: String, default: "horizontal" },
    { name: "activation", type: String, default: "automatic" },
  ],

  children: {
    tabs: SLOT.list,
    views: SLOT.panels,
  },

  events: {
    click: {
      selector: SLOT.tab,
      handler: "handleTabClick",
    },
    keydown: {
      selector: SLOT.tab,
      handler: "handleKeyDown",
    },
  },

  setup(ctx) {
    const el = ctx.element as unknown as TabsElement;

    // Get the direct slot="list" container (not nested ones)
    const getTabsContainer = (): HTMLElement | null => {
      return ctx.query<HTMLElement>(SLOT.list);
    };

    // Get the direct slot="panels" container (not nested ones)
    const getViewsContainer = (): HTMLElement | null => {
      return ctx.query<HTMLElement>(SLOT.panels);
    };

    const getTabs = (): HTMLElement[] => {
      const container = getTabsContainer();
      if (!container) return [];
      // Get tab buttons inside the tabs container
      return Array.from(container.querySelectorAll<HTMLElement>(SLOT.tab));
    };

    const getPanels = (): HTMLElement[] => {
      const container = getViewsContainer();
      if (!container) return [];
      // Get panels inside the panels container
      return Array.from(container.querySelectorAll<HTMLElement>(SLOT.panel));
    };

    let rovingTabindex: ReturnType<typeof createRovingTabindex> | null = null;

    const updateAria = (): void => {
      const tabs = getTabs();
      const panels = getPanels();
      const tabsContainer = getTabsContainer();
      const value = el.value || tabs[0]?.getAttribute("name") || "";

      if (tabsContainer) {
        tabsContainer.setAttribute("role", "tablist");
        tabsContainer.setAttribute(ARIA.orientation, el.orientation);
      }

      tabs.forEach((tab) => {
        const tabName = tab.getAttribute("name") ?? "";
        const isSelected = tabName === value;
        const tabId = ensureId(tab, "w-tab");

        const panel = panels.find((p) => p.getAttribute("name") === tabName);
        const panelId = panel ? ensureId(panel, "w-tabpanel") : "";

        tab.setAttribute("role", "tab");
        tab.setAttribute(ARIA.selected, String(isSelected));
        tab.setAttribute(ARIA.controls, panelId);

        if (panel) {
          panel.setAttribute("role", "tabpanel");
          panel.setAttribute(ARIA.labelledby, tabId);
          panel.hidden = !isSelected;
        }
      });
    };

    const setupRovingTabindex = (): void => {
      const tabs = getTabs();

      if (rovingTabindex) {
        rovingTabindex.destroy();
      }

      rovingTabindex = createRovingTabindex(tabs, {
        orientation: el.orientation === "vertical" ? "vertical" : "horizontal",
        wrap: true,
        onFocus: (index) => {
          if (el.activation === "automatic") {
            const tab = tabs[index];
            const tabName = tab?.getAttribute("name");
            if (tabName && tabName !== el.value) {
              el.value = tabName;
              updateAria();
              ctx.emit("change", { value: tabName });
            }
          }
        },
      });

      const selectedIndex = tabs.findIndex(
        (t) => t.getAttribute("name") === el.value
      );
      if (selectedIndex >= 0) {
        rovingTabindex.focus(selectedIndex);
      }

      ctx.onCleanup(() => rovingTabindex?.destroy());
    };

    updateAria();
    setupRovingTabindex();

    Object.assign(ctx.element, {
      handleTabClick(_e: Event, target: HTMLElement): void {
        // Only handle if this tab belongs to our tabs container
        const tabsContainer = getTabsContainer();
        if (!tabsContainer || !tabsContainer.contains(target)) return;

        const tabName = target.getAttribute("name");

        if (tabName && tabName !== el.value) {
          el.value = tabName;
          updateAria();
          ctx.emit("change", { value: tabName });
        }
      },

      handleKeyDown(e: KeyboardEvent): void {
        const target = e.target as HTMLElement;
        const tabsContainer = getTabsContainer();
        if (!tabsContainer || !tabsContainer.contains(target)) return;

        if (e.key === "Enter" || e.key === " ") {
          if (el.activation === "manual") {
            const tabName = target.getAttribute("name");
            if (tabName && tabName !== el.value) {
              e.preventDefault();
              el.value = tabName;
              updateAria();
              ctx.emit("change", { value: tabName });
            }
          }
        }

        if (e.key === "Home") {
          e.preventDefault();
          rovingTabindex?.first();
        }
        if (e.key === "End") {
          e.preventDefault();
          rovingTabindex?.last();
        }
      },

      selectTab(name: string): void {
        if (name !== el.value) {
          el.value = name;
          updateAria();
          setupRovingTabindex();
          ctx.emit("change", { value: name });
        }
      },

      getSelectedTab(): string {
        return el.value;
      },
    });

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.attributeName === "value" ||
          mutation.attributeName === "orientation"
        ) {
          updateAria();
          setupRovingTabindex();
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });
    ctx.onCleanup(() => observer.disconnect());
  },
});

export {};
