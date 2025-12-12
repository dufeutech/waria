import { defineComponent } from "../factory";
import { setAriaLabel, ensureId, announcePolite } from "../aria";
import { SLOT, ARIA, KEY } from "../constants";

interface TreegridElement extends HTMLElement {
  label: string;
  selectionMode: "none" | "single" | "multiple";
}

defineComponent({
  tag: "w-treegrid",

  props: [
    { name: "label", type: String, default: "Tree Grid" },
    { name: "selectionMode", type: String, default: "single" },
  ],

  children: {
    rows: { selector: SLOT.row, multiple: true },
  },

  events: {
    keydown: {
      handler: "handleKeyDown",
    },
    click: {
      selector: `${SLOT.row}, ${SLOT.cell}`,
      handler: "handleClick",
    },
  },

  aria: {
    role: "treegrid",
  },

  setup(ctx) {
    const el = ctx.element as unknown as TreegridElement;

    let currentRowIndex = 0;
    let currentCellIndex = 0;

    const getRows = (): HTMLElement[] => {
      return Array.from(
        ctx.element.querySelectorAll<HTMLElement>(`:scope > ${SLOT.row}`)
      );
    };

    const getVisibleRows = (): HTMLElement[] => {
      return getRows().filter((row) => !row.hidden);
    };

    const getCells = (row: HTMLElement): HTMLElement[] => {
      return Array.from(row.querySelectorAll<HTMLElement>(SLOT.cell));
    };

    const getLevel = (row: HTMLElement): number => {
      return parseInt(row.getAttribute("data-level") ?? "1", 10);
    };

    const isExpanded = (row: HTMLElement): boolean => {
      return row.getAttribute("data-expanded") === "true";
    };

    const hasChildren = (row: HTMLElement): boolean => {
      const currentLevel = getLevel(row);
      const rows = getRows();
      const currentIndex = rows.indexOf(row);

      // Check if next row is a child (higher level)
      if (currentIndex < rows.length - 1) {
        const nextRow = rows[currentIndex + 1];
        return getLevel(nextRow) > currentLevel;
      }
      return false;
    };

    const getChildren = (parentRow: HTMLElement): HTMLElement[] => {
      const currentLevel = getLevel(parentRow);
      const rows = getRows();
      const currentIndex = rows.indexOf(parentRow);
      const children: HTMLElement[] = [];

      for (let i = currentIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        const rowLevel = getLevel(row);

        if (rowLevel <= currentLevel) break; // No longer a descendant
        if (rowLevel === currentLevel + 1) {
          children.push(row);
        }
      }

      return children;
    };

    const getDescendants = (parentRow: HTMLElement): HTMLElement[] => {
      const currentLevel = getLevel(parentRow);
      const rows = getRows();
      const currentIndex = rows.indexOf(parentRow);
      const descendants: HTMLElement[] = [];

      for (let i = currentIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        const rowLevel = getLevel(row);

        if (rowLevel <= currentLevel) break; // No longer a descendant
        descendants.push(row);
      }

      return descendants;
    };

    const updateAria = (): void => {
      setAriaLabel(ctx.element, el.label);
      ctx.element.setAttribute(
        ARIA.multiselectable,
        String(el.selectionMode === "multiple")
      );

      const rows = getRows();
      const visibleRows = getVisibleRows();

      rows.forEach((row) => {
        row.setAttribute("role", "row");
        ensureId(row, "w-treegrid-row");

        const level = getLevel(row);
        row.setAttribute(ARIA.level, String(level));

        if (hasChildren(row)) {
          row.setAttribute(ARIA.expanded, String(isExpanded(row)));
        } else {
          row.removeAttribute(ARIA.expanded);
        }

        // Set position in set (among siblings at same level)
        const siblings = rows.filter((r) => getLevel(r) === level);
        const posInSet = siblings.indexOf(row) + 1;
        row.setAttribute(ARIA.setsize, String(siblings.length));
        row.setAttribute(ARIA.posinset, String(posInSet));

        const cells = getCells(row);
        cells.forEach((cell, cellIndex) => {
          cell.setAttribute("role", "gridcell");
          ensureId(cell, "w-treegrid-cell");

          // Only first cell should be focusable for tree navigation
          const visibleRowIndex = visibleRows.indexOf(row);
          const isCurrent =
            visibleRowIndex === currentRowIndex &&
            cellIndex === currentCellIndex;
          cell.setAttribute("tabindex", isCurrent ? "0" : "-1");
        });
      });
    };

    const expandRow = (row: HTMLElement): void => {
      if (!hasChildren(row) || isExpanded(row)) return;

      row.setAttribute("data-expanded", "true");

      // Show immediate children
      const children = getChildren(row);
      children.forEach((child) => {
        child.hidden = false;
      });

      updateAria();
      announcePolite("Expanded");
      ctx.emit("expand", { row });
    };

    const collapseRow = (row: HTMLElement): void => {
      if (!hasChildren(row) || !isExpanded(row)) return;

      row.setAttribute("data-expanded", "false");

      // Hide all descendants
      const descendants = getDescendants(row);
      descendants.forEach((descendant) => {
        descendant.hidden = true;
        // Also collapse any expanded descendants
        if (isExpanded(descendant)) {
          descendant.setAttribute("data-expanded", "false");
        }
      });

      updateAria();
      announcePolite("Collapsed");
      ctx.emit("collapse", { row });
    };

    const toggleRow = (row: HTMLElement): void => {
      if (isExpanded(row)) {
        collapseRow(row);
      } else {
        expandRow(row);
      }
    };

    const focusCell = (rowIndex: number, cellIndex: number): void => {
      const visibleRows = getVisibleRows();
      if (rowIndex < 0 || rowIndex >= visibleRows.length) return;

      const row = visibleRows[rowIndex];
      const cells = getCells(row);
      cellIndex = Math.max(0, Math.min(cellIndex, cells.length - 1));

      // Update tabindex
      visibleRows.forEach((r, ri) => {
        getCells(r).forEach((cell, ci) => {
          cell.setAttribute(
            "tabindex",
            ri === rowIndex && ci === cellIndex ? "0" : "-1"
          );
        });
      });

      currentRowIndex = rowIndex;
      currentCellIndex = cellIndex;
      cells[cellIndex].focus();
    };

    const selectRow = (row: HTMLElement, toggle = false): void => {
      if (el.selectionMode === "none") return;

      const isSelected = row.getAttribute(ARIA.selected) === "true";

      if (el.selectionMode === "single") {
        // Deselect all other rows
        getRows().forEach((r) => r.removeAttribute(ARIA.selected));
      }

      if (toggle && isSelected) {
        row.removeAttribute(ARIA.selected);
      } else {
        row.setAttribute(ARIA.selected, "true");
      }

      ctx.emit("select", {
        row,
        selected: row.getAttribute(ARIA.selected) === "true",
      });
    };

    // Initialize - hide children of collapsed rows
    const initializeVisibility = (): void => {
      const rows = getRows();

      rows.forEach((row) => {
        if (hasChildren(row) && !isExpanded(row)) {
          const descendants = getDescendants(row);
          descendants.forEach((d) => {
            d.hidden = true;
          });
        }
      });
    };

    // Initial setup
    initializeVisibility();
    updateAria();

    Object.assign(ctx.element, {
      handleKeyDown(e: KeyboardEvent): void {
        const visibleRows = getVisibleRows();
        if (visibleRows.length === 0) return;

        const currentRow = visibleRows[currentRowIndex];
        const cells = getCells(currentRow);

        switch (e.key) {
          case KEY.ArrowRight:
            e.preventDefault();
            if (currentCellIndex === 0 && hasChildren(currentRow)) {
              if (!isExpanded(currentRow)) {
                expandRow(currentRow);
              } else {
                // Move to first child
                const children = getChildren(currentRow);
                if (children.length > 0) {
                  const childIndex = getVisibleRows().indexOf(children[0]);
                  focusCell(childIndex, 0);
                }
              }
            } else if (currentCellIndex < cells.length - 1) {
              focusCell(currentRowIndex, currentCellIndex + 1);
            }
            break;

          case KEY.ArrowLeft:
            e.preventDefault();
            if (currentCellIndex === 0) {
              if (hasChildren(currentRow) && isExpanded(currentRow)) {
                collapseRow(currentRow);
              } else {
                // Move to parent
                const level = getLevel(currentRow);
                if (level > 1) {
                  const rows = getRows();
                  const rowIndex = rows.indexOf(currentRow);
                  for (let i = rowIndex - 1; i >= 0; i--) {
                    if (getLevel(rows[i]) < level) {
                      const parentIndex = getVisibleRows().indexOf(rows[i]);
                      if (parentIndex >= 0) {
                        focusCell(parentIndex, 0);
                      }
                      break;
                    }
                  }
                }
              }
            } else if (currentCellIndex > 0) {
              focusCell(currentRowIndex, currentCellIndex - 1);
            }
            break;

          case KEY.ArrowDown:
            e.preventDefault();
            if (currentRowIndex < visibleRows.length - 1) {
              focusCell(currentRowIndex + 1, currentCellIndex);
            }
            break;

          case KEY.ArrowUp:
            e.preventDefault();
            if (currentRowIndex > 0) {
              focusCell(currentRowIndex - 1, currentCellIndex);
            }
            break;

          case KEY.Home:
            e.preventDefault();
            if (e.ctrlKey) {
              focusCell(0, 0);
            } else {
              focusCell(currentRowIndex, 0);
            }
            break;

          case KEY.End:
            e.preventDefault();
            if (e.ctrlKey) {
              const lastRowIndex = visibleRows.length - 1;
              const lastCells = getCells(visibleRows[lastRowIndex]);
              focusCell(lastRowIndex, lastCells.length - 1);
            } else {
              focusCell(currentRowIndex, cells.length - 1);
            }
            break;

          case KEY.Enter:
          case KEY.Space:
            e.preventDefault();
            if (currentCellIndex === 0 && hasChildren(currentRow)) {
              toggleRow(currentRow);
            } else {
              selectRow(currentRow, el.selectionMode === "multiple");
            }
            break;

          case "*":
            // Expand all siblings
            e.preventDefault();
            const level = getLevel(currentRow);
            getRows()
              .filter((r) => getLevel(r) === level && hasChildren(r))
              .forEach((r) => expandRow(r));
            break;
        }
      },

      handleClick(_e: Event, target: HTMLElement): void {
        const row = target.closest(SLOT.row) as HTMLElement | null;
        if (!row) return;

        const visibleRows = getVisibleRows();
        const rowIndex = visibleRows.indexOf(row);

        if (rowIndex < 0) return;

        const cell = target.closest(SLOT.cell) as HTMLElement | null;
        const cellIndex = cell ? getCells(row).indexOf(cell) : 0;

        focusCell(rowIndex, cellIndex);

        // If clicking the first cell, toggle expansion
        if (cellIndex === 0 && hasChildren(row)) {
          toggleRow(row);
        } else {
          selectRow(row, el.selectionMode === "multiple");
        }
      },

      // Public API
      expand(row: HTMLElement): void {
        expandRow(row);
      },

      collapse(row: HTMLElement): void {
        collapseRow(row);
      },

      toggle(row: HTMLElement): void {
        toggleRow(row);
      },

      expandAll(): void {
        getRows()
          .filter((r) => hasChildren(r))
          .forEach((r) => expandRow(r));
      },

      collapseAll(): void {
        getRows()
          .filter((r) => hasChildren(r) && isExpanded(r))
          .forEach((r) => collapseRow(r));
      },

      focusRow(index: number): void {
        focusCell(index, 0);
      },

      getSelectedRows(): HTMLElement[] {
        return getRows().filter(
          (r) => r.getAttribute(ARIA.selected) === "true"
        );
      },

      clearSelection(): void {
        getRows().forEach((r) => r.removeAttribute(ARIA.selected));
        ctx.emit("selectionCleared");
      },
    });

    // Watch for attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (["label", "selectionMode"].includes(mutation.attributeName ?? "")) {
          updateAria();
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });

    // Watch for child changes
    const childObserver = new MutationObserver(() => {
      initializeVisibility();
      updateAria();
    });

    childObserver.observe(ctx.element, { childList: true, subtree: true });

    ctx.onCleanup(() => {
      observer.disconnect();
      childObserver.disconnect();
    });
  },
});

export {};
