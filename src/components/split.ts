import { defineComponent } from "../factory";
import { SLOT, ARIA } from "../constants";
import { ensureId } from "../aria";

interface SplitElement extends HTMLElement {
  direction: "horizontal" | "vertical";
  min: number;
  step: number;
}

interface PaneState {
  element: HTMLElement;
  slot: HTMLElement;
  id: string;
  size: number;
  minSize: number;
  collapsed: boolean;
  prevSize: number;
}

const RESIZER_SIZE = 8;

defineComponent({
  tag: "w-split",

  props: [
    { name: "direction", type: String, default: "horizontal" },
    { name: "min", type: Number, default: 0 },
    { name: "step", type: Number, default: 10 },
  ],

  children: {
    panes: { selector: SLOT.item, multiple: true, observe: true },
  },

  aria: {
    role: "none",
  },

  setup(ctx) {
    const el = ctx.element as unknown as SplitElement;

    let paneStates: PaneState[] = [];
    let resizers: HTMLElement[] = [];
    let totalSize = 0;
    let initialized = false;
    let isUpdating = false; // Guard against infinite resize loops
    let isInitializing = false; // Guard against infinite mutation loops

    // Get w-slot containers (parents of pane content)
    const getSlots = (): HTMLElement[] => {
      return Array.from(el.querySelectorAll<HTMLElement>(":scope > w-slot[item]"));
    };

    // Parse size string to pixels (for initial setup)
    const parseSize = (sizeStr: string | null, availableSpace: number): number => {
      if (!sizeStr) return -1; // Will be calculated as flex

      if (sizeStr.endsWith("px")) {
        return parseInt(sizeStr, 10);
      }
      if (sizeStr.endsWith("%")) {
        return (parseFloat(sizeStr) / 100) * availableSpace;
      }
      if (sizeStr.endsWith("fr")) {
        return -parseFloat(sizeStr); // Negative indicates flex ratio
      }
      return parseInt(sizeStr, 10) || -1;
    };

    // Calculate ARIA value (0-100) for a pane
    const calculateAriaValue = (paneSize: number): number => {
      if (totalSize === 0) return 0;
      return Math.round((paneSize / totalSize) * 100);
    };

    // Update grid layout
    const updateLayout = (): void => {
      const isHorizontal = el.direction === "horizontal";
      const template = paneStates
        .map((pane, i) => {
          const size = pane.collapsed ? `${pane.minSize}px` : `${pane.size}px`;
          return i < paneStates.length - 1 ? `${size} ${RESIZER_SIZE}px` : size;
        })
        .join(" ");

      if (isHorizontal) {
        el.style.gridTemplateColumns = template;
        el.style.gridTemplateRows = "";
      } else {
        el.style.gridTemplateRows = template;
        el.style.gridTemplateColumns = "";
      }
    };

    // Update ARIA attributes on a resizer
    const updateResizerAria = (resizer: HTMLElement, index: number): void => {
      const pane = paneStates[index];
      if (!pane) return;

      const ariaValue = calculateAriaValue(pane.size);
      resizer.setAttribute(ARIA.valuenow, String(ariaValue));

      // Calculate min/max based on constraints
      const minValue = calculateAriaValue(pane.minSize);
      const nextPane = paneStates[index + 1];
      const maxAvailable = pane.size + (nextPane ? nextPane.size - nextPane.minSize : 0);
      const maxValue = calculateAriaValue(maxAvailable);

      resizer.setAttribute(ARIA.valuemin, String(minValue));
      resizer.setAttribute(ARIA.valuemax, String(maxValue));
    };

    // Update all resizer ARIA attributes
    const updateAllResizersAria = (): void => {
      resizers.forEach((resizer, i) => updateResizerAria(resizer, i));
    };

    // Adjust pane size by delta
    const adjustSize = (resizerIndex: number, delta: number): void => {
      const pane = paneStates[resizerIndex];
      const nextPane = paneStates[resizerIndex + 1];
      if (!pane || !nextPane) return;

      // Calculate new sizes respecting min constraints
      let newPaneSize = pane.size + delta;
      let newNextSize = nextPane.size - delta;

      // Enforce minimums
      if (newPaneSize < pane.minSize) {
        newNextSize -= pane.minSize - newPaneSize;
        newPaneSize = pane.minSize;
      }
      if (newNextSize < nextPane.minSize) {
        newPaneSize -= nextPane.minSize - newNextSize;
        newNextSize = nextPane.minSize;
      }

      // Final bounds check
      if (newPaneSize < pane.minSize || newNextSize < nextPane.minSize) return;

      pane.size = newPaneSize;
      pane.collapsed = false;
      nextPane.size = newNextSize;
      nextPane.collapsed = false;

      updateLayout();
      updateAllResizersAria();
    };

    // Collapse pane to minimum
    const collapsePane = (resizerIndex: number): void => {
      const pane = paneStates[resizerIndex];
      const nextPane = paneStates[resizerIndex + 1];
      if (!pane || !nextPane) return;

      const delta = pane.size - pane.minSize;
      pane.prevSize = pane.size;
      pane.size = pane.minSize;
      pane.collapsed = true;
      nextPane.size += delta;

      updateLayout();
      updateAllResizersAria();
    };

    // Expand pane to maximum
    const expandPane = (resizerIndex: number): void => {
      const pane = paneStates[resizerIndex];
      const nextPane = paneStates[resizerIndex + 1];
      if (!pane || !nextPane) return;

      const maxDelta = nextPane.size - nextPane.minSize;
      pane.size += maxDelta;
      pane.collapsed = false;
      nextPane.size = nextPane.minSize;

      updateLayout();
      updateAllResizersAria();
    };

    // Toggle collapse/restore
    const toggleCollapse = (resizerIndex: number): void => {
      const pane = paneStates[resizerIndex];
      if (!pane) return;

      if (pane.collapsed && pane.prevSize > pane.minSize) {
        // Restore
        const nextPane = paneStates[resizerIndex + 1];
        if (!nextPane) return;

        const restoreSize = Math.min(pane.prevSize, pane.size + nextPane.size - nextPane.minSize);
        const delta = restoreSize - pane.size;

        pane.size = restoreSize;
        pane.collapsed = false;
        nextPane.size -= delta;

        updateLayout();
        updateAllResizersAria();
      } else {
        collapsePane(resizerIndex);
      }
    };

    // Create resizer element with full ARIA
    const createResizer = (index: number, paneId: string): HTMLElement => {
      const resizer = document.createElement("div");
      resizer.className = "w-split-resizer";

      // WAI-ARIA Window Splitter requirements
      resizer.setAttribute("role", "separator");
      resizer.setAttribute("tabindex", "0");
      resizer.setAttribute(ARIA.valuemin, "0");
      resizer.setAttribute(ARIA.valuemax, "100");
      resizer.setAttribute(ARIA.valuenow, "50");
      resizer.setAttribute(ARIA.controls, paneId);

      // Orientation is opposite of split direction
      // Horizontal split = vertical separator (moves left/right)
      // Vertical split = horizontal separator (moves up/down)
      const separatorOrientation = el.direction === "horizontal" ? "vertical" : "horizontal";
      resizer.setAttribute(ARIA.orientation, separatorOrientation);

      // Accessible label
      const paneName = paneStates[index]?.slot.getAttribute("name") || `pane ${index + 1}`;
      resizer.setAttribute(ARIA.label, `Resize ${paneName}`);

      // Keyboard handling
      resizer.addEventListener("keydown", (e: KeyboardEvent) => {
        const isHorizontal = el.direction === "horizontal";

        switch (e.key) {
          case "ArrowLeft":
            if (isHorizontal) {
              e.preventDefault();
              adjustSize(index, -el.step);
            }
            break;
          case "ArrowRight":
            if (isHorizontal) {
              e.preventDefault();
              adjustSize(index, el.step);
            }
            break;
          case "ArrowUp":
            if (!isHorizontal) {
              e.preventDefault();
              adjustSize(index, -el.step);
            }
            break;
          case "ArrowDown":
            if (!isHorizontal) {
              e.preventDefault();
              adjustSize(index, el.step);
            }
            break;
          case "Home":
            e.preventDefault();
            collapsePane(index);
            break;
          case "End":
            e.preventDefault();
            expandPane(index);
            break;
          case "Enter":
            e.preventDefault();
            toggleCollapse(index);
            break;
        }
      });

      // Pointer drag handling
      resizer.addEventListener("pointerdown", (e: PointerEvent) => {
        e.preventDefault();
        resizer.setPointerCapture(e.pointerId);

        const isHorizontal = el.direction === "horizontal";
        const startPos = isHorizontal ? e.clientX : e.clientY;
        const startPaneSize = paneStates[index].size;
        const startNextSize = paneStates[index + 1]?.size ?? 0;

        const handleMove = (moveEvent: PointerEvent): void => {
          const currentPos = isHorizontal ? moveEvent.clientX : moveEvent.clientY;
          const delta = currentPos - startPos;

          const pane = paneStates[index];
          const nextPane = paneStates[index + 1];
          if (!pane || !nextPane) return;

          let newPaneSize = startPaneSize + delta;
          let newNextSize = startNextSize - delta;

          // Enforce minimums
          if (newPaneSize < pane.minSize) {
            newNextSize -= pane.minSize - newPaneSize;
            newPaneSize = pane.minSize;
          }
          if (newNextSize < nextPane.minSize) {
            newPaneSize -= nextPane.minSize - newNextSize;
            newNextSize = nextPane.minSize;
          }

          // Final bounds check
          if (newPaneSize >= pane.minSize && newNextSize >= nextPane.minSize) {
            pane.size = newPaneSize;
            pane.collapsed = newPaneSize <= pane.minSize;
            nextPane.size = newNextSize;
            nextPane.collapsed = newNextSize <= nextPane.minSize;

            ctx.scheduler.write(() => {
              updateLayout();
              updateResizerAria(resizer, index);
            });
          }
        };

        const handleUp = (): void => {
          resizer.releasePointerCapture(e.pointerId);
          document.removeEventListener("pointermove", handleMove);
          document.removeEventListener("pointerup", handleUp);

          // Emit resize event
          ctx.emit("resize", { sizes: getSizes() });
        };

        document.addEventListener("pointermove", handleMove);
        document.addEventListener("pointerup", handleUp);
      });

      return resizer;
    };

    // Get current sizes as object
    const getSizes = (): Record<string, string> => {
      const sizes: Record<string, string> = {};
      paneStates.forEach((pane, i) => {
        const name = pane.slot.getAttribute("name") || `pane-${i}`;
        sizes[name] = `${pane.size}px`;
      });
      return sizes;
    };

    // Initialize or rebuild the split layout
    const init = (): void => {
      if (isInitializing) return;
      isInitializing = true;

      const slots = getSlots();
      if (slots.length < 2) {
        isInitializing = false;
        return;
      }

      // Clean up existing resizers
      resizers.forEach((r) => r.remove());
      resizers = [];
      paneStates = [];

      // Set up container styles
      el.style.display = "grid";

      // Get available space
      const rect = el.getBoundingClientRect();
      const isHorizontal = el.direction === "horizontal";
      const availableSpace = isHorizontal ? rect.width : rect.height;
      const resizerSpace = (slots.length - 1) * RESIZER_SIZE;
      const paneSpace = availableSpace - resizerSpace;

      // Parse sizes and calculate flex distribution
      let fixedTotal = 0;
      let flexTotal = 0;
      const parsedSizes: number[] = [];

      slots.forEach((slot) => {
        const sizeAttr = slot.getAttribute("data-size");
        const parsed = parseSize(sizeAttr, paneSpace);

        if (parsed > 0) {
          fixedTotal += parsed;
          parsedSizes.push(parsed);
        } else {
          const flexRatio = parsed < 0 ? -parsed : 1;
          flexTotal += flexRatio;
          parsedSizes.push(parsed);
        }
      });

      // Calculate actual sizes
      const flexSpace = Math.max(0, paneSpace - fixedTotal);

      slots.forEach((slot, i) => {
        const parsed = parsedSizes[i];
        let size: number;

        if (parsed > 0) {
          size = parsed;
        } else {
          const flexRatio = parsed < 0 ? -parsed : 1;
          size = (flexRatio / flexTotal) * flexSpace;
        }

        const minAttr = slot.getAttribute("data-min");
        const minSize = minAttr ? parseInt(minAttr, 10) : el.min;

        // Get the actual pane content (first child of w-slot)
        const paneContent = slot.firstElementChild as HTMLElement;
        if (!paneContent) return;

        // Ensure pane has an ID for aria-controls
        ensureId(paneContent, "w-split-pane");

        paneStates.push({
          element: paneContent,
          slot,
          id: paneContent.id,
          size: Math.max(size, minSize),
          minSize,
          collapsed: false,
          prevSize: size,
        });
      });

      // Calculate total for ARIA values
      totalSize = paneStates.reduce((sum, p) => sum + p.size, 0);

      // Create resizers between panes
      for (let i = 0; i < paneStates.length - 1; i++) {
        const resizer = createResizer(i, paneStates[i].id);
        resizers.push(resizer);

        // Insert resizer after the slot
        paneStates[i].slot.after(resizer);
      }

      // Apply initial layout
      updateLayout();
      updateAllResizersAria();

      initialized = true;
      isInitializing = false;
    };

    // Watch for slot changes
    const observer = new MutationObserver((mutations) => {
      // Skip if we're already initializing (to prevent infinite loop)
      if (isInitializing) return;

      let shouldReinit = false;

      for (const mutation of mutations) {
        // Ignore mutations related to resizer elements
        if (mutation.type === "childList") {
          const addedNodes = Array.from(mutation.addedNodes);
          const removedNodes = Array.from(mutation.removedNodes);
          const isResizerChange = [...addedNodes, ...removedNodes].some(
            (node) => (node as HTMLElement).classList?.contains("w-split-resizer")
          );
          if (!isResizerChange) {
            shouldReinit = true;
            break;
          }
        }
        if (mutation.type === "attributes" && mutation.attributeName === "direction") {
          shouldReinit = true;
          break;
        }
      }

      if (shouldReinit) {
        init();
      }
    });

    observer.observe(el, {
      childList: true,
      attributes: true,
      attributeFilter: ["direction"],
    });

    // Handle resize - with guard to prevent infinite loops
    const resizeObserver = new ResizeObserver(() => {
      if (initialized && !isUpdating) {
        // Recalculate sizes proportionally on container resize
        const rect = el.getBoundingClientRect();
        const isHorizontal = el.direction === "horizontal";
        const newTotal = (isHorizontal ? rect.width : rect.height) - (resizers.length * RESIZER_SIZE);

        if (newTotal > 0 && totalSize > 0 && Math.abs(newTotal - totalSize) > 1) {
          isUpdating = true;
          const ratio = newTotal / totalSize;

          paneStates.forEach((pane) => {
            pane.size = Math.max(pane.size * ratio, pane.minSize);
          });

          totalSize = paneStates.reduce((sum, p) => sum + p.size, 0);
          updateLayout();
          updateAllResizersAria();

          // Reset guard after layout settles
          requestAnimationFrame(() => {
            isUpdating = false;
          });
        }
      }
    });

    resizeObserver.observe(el);

    // Initial setup - use microtask to ensure DOM is ready
    queueMicrotask(() => {
      init();
    });

    // Expose public API
    Object.assign(el, {
      getSizes,
    });

    // Cleanup
    ctx.onCleanup(() => {
      observer.disconnect();
      resizeObserver.disconnect();
      resizers.forEach((r) => r.remove());
    });
  },
});

export {};
