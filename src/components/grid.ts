import { defineComponent } from "../factory";
import { setAriaLabel, ensureId } from "../aria";
import { SLOT, ARIA, KEY } from "../constants";

interface GridElement extends HTMLElement {
  label: string;
  selectionMode: "none" | "cell" | "row";
  multiSelect: boolean;
}

defineComponent({
  tag: "w-grid",

  props: [
    { name: "label", type: String, default: "Grid" },
    { name: "selectionMode", type: String, default: "cell" },
    { name: "multiSelect", type: Boolean, default: false },
  ],

  children: {
    rows: { selector: SLOT.row, multiple: true },
  },

  events: {
    keydown: {
      handler: "handleKeyDown",
    },
    click: {
      selector: `${SLOT.cell}, ${SLOT.row}`,
      handler: "handleClick",
    },
  },

  aria: {
    role: "grid",
  },

  setup(ctx) {
    const el = ctx.element as unknown as GridElement;

    let currentRowIndex = 0;
    let currentCellIndex = 0;

    const getRows = (): HTMLElement[] => {
      return Array.from(
        ctx.element.querySelectorAll<HTMLElement>(`:scope > ${SLOT.row}`)
      );
    };

    const getCells = (row: HTMLElement): HTMLElement[] => {
      return Array.from(row.querySelectorAll<HTMLElement>(SLOT.cell));
    };

    const updateAria = (): void => {
      setAriaLabel(ctx.element, el.label);
      ctx.element.setAttribute(ARIA.multiselectable, String(el.multiSelect));

      const rows = getRows();

      rows.forEach((row, rowIndex) => {
        row.setAttribute("role", "row");
        ensureId(row, "w-grid-row");

        const cells = getCells(row);
        const rowHeaders = Array.from(
          row.querySelectorAll<HTMLElement>(SLOT.head)
        );

        rowHeaders.forEach((header) => {
          header.setAttribute("role", "rowheader");
          header.setAttribute("scope", "row");
        });

        cells.forEach((cell, cellIndex) => {
          cell.setAttribute("role", "gridcell");
          ensureId(cell, "w-grid-cell");

          // Set tabindex - only the current cell is focusable
          const isCurrent =
            rowIndex === currentRowIndex && cellIndex === currentCellIndex;
          cell.setAttribute("tabindex", isCurrent ? "0" : "-1");
        });
      });
    };

    const focusCell = (rowIndex: number, cellIndex: number): void => {
      const rows = getRows();
      if (rowIndex < 0 || rowIndex >= rows.length) return;

      const cells = getCells(rows[rowIndex]);
      if (cellIndex < 0 || cellIndex >= cells.length) return;

      // Update tabindex
      rows.forEach((row, ri) => {
        getCells(row).forEach((cell, ci) => {
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

    const selectCell = (cell: HTMLElement, toggle = false): void => {
      if (el.selectionMode === "none") return;

      const isSelected = cell.getAttribute(ARIA.selected) === "true";

      if (!el.multiSelect) {
        // Deselect all other cells/rows
        const rows = getRows();
        rows.forEach((row) => {
          row.removeAttribute(ARIA.selected);
          getCells(row).forEach((c) => c.removeAttribute(ARIA.selected));
        });
      }

      if (toggle && isSelected) {
        cell.removeAttribute(ARIA.selected);
      } else {
        cell.setAttribute(ARIA.selected, "true");
      }

      // If row selection mode, also select the row
      if (el.selectionMode === "row") {
        const row = cell.closest(SLOT.row) as HTMLElement | null;
        if (row) {
          if (toggle && isSelected) {
            row.removeAttribute(ARIA.selected);
          } else {
            row.setAttribute(ARIA.selected, "true");
          }
        }
      }

      ctx.emit("select", {
        cell,
        row: cell.closest(SLOT.row),
        rowIndex: currentRowIndex,
        cellIndex: currentCellIndex,
      });
    };

    updateAria();

    Object.assign(ctx.element, {
      handleKeyDown(e: KeyboardEvent): void {
        const target = e.target as HTMLElement;
        if (!target.matches(SLOT.cell)) return;

        const rows = getRows();
        const cellsInCurrentRow = getCells(rows[currentRowIndex]);

        switch (e.key) {
          case KEY.ArrowRight:
            e.preventDefault();
            if (currentCellIndex < cellsInCurrentRow.length - 1) {
              focusCell(currentRowIndex, currentCellIndex + 1);
            }
            break;

          case KEY.ArrowLeft:
            e.preventDefault();
            if (currentCellIndex > 0) {
              focusCell(currentRowIndex, currentCellIndex - 1);
            }
            break;

          case KEY.ArrowDown:
            e.preventDefault();
            if (currentRowIndex < rows.length - 1) {
              const nextRowCells = getCells(rows[currentRowIndex + 1]);
              const nextCellIndex = Math.min(
                currentCellIndex,
                nextRowCells.length - 1
              );
              focusCell(currentRowIndex + 1, nextCellIndex);
            }
            break;

          case KEY.ArrowUp:
            e.preventDefault();
            if (currentRowIndex > 0) {
              const prevRowCells = getCells(rows[currentRowIndex - 1]);
              const prevCellIndex = Math.min(
                currentCellIndex,
                prevRowCells.length - 1
              );
              focusCell(currentRowIndex - 1, prevCellIndex);
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
              const lastRowIndex = rows.length - 1;
              const lastCellIndex = getCells(rows[lastRowIndex]).length - 1;
              focusCell(lastRowIndex, lastCellIndex);
            } else {
              focusCell(currentRowIndex, cellsInCurrentRow.length - 1);
            }
            break;

          case KEY.PageDown:
            e.preventDefault();
            focusCell(
              Math.min(currentRowIndex + 5, rows.length - 1),
              currentCellIndex
            );
            break;

          case KEY.PageUp:
            e.preventDefault();
            focusCell(Math.max(currentRowIndex - 5, 0), currentCellIndex);
            break;

          case KEY.Space:
          case KEY.Enter:
            e.preventDefault();
            selectCell(target, el.multiSelect);
            break;

          case "a":
            if (e.ctrlKey && el.multiSelect) {
              e.preventDefault();
              // Select all cells
              rows.forEach((row) => {
                getCells(row).forEach((cell) =>
                  cell.setAttribute(ARIA.selected, "true")
                );
              });
              ctx.emit("selectAll");
            }
            break;
        }
      },

      handleClick(_e: Event, target: HTMLElement): void {
        if (target.matches(SLOT.cell)) {
          const rows = getRows();
          const rowElement = target.closest(SLOT.row) as HTMLElement | null;
          if (!rowElement) return;

          const rowIndex = rows.indexOf(rowElement);
          const cellIndex = getCells(rowElement).indexOf(target);

          focusCell(rowIndex, cellIndex);
          selectCell(target, el.multiSelect);
        }
      },

      // Public API
      focusCell(rowIndex: number, cellIndex: number): void {
        focusCell(rowIndex, cellIndex);
      },

      selectCell(rowIndex: number, cellIndex: number): void {
        const rows = getRows();
        if (rowIndex >= 0 && rowIndex < rows.length) {
          const cells = getCells(rows[rowIndex]);
          if (cellIndex >= 0 && cellIndex < cells.length) {
            selectCell(cells[cellIndex]);
          }
        }
      },

      clearSelection(): void {
        const rows = getRows();
        rows.forEach((row) => {
          row.removeAttribute(ARIA.selected);
          getCells(row).forEach((cell) => cell.removeAttribute(ARIA.selected));
        });
        ctx.emit("selectionCleared");
      },

      getSelectedCells(): HTMLElement[] {
        const rows = getRows();
        const selected: HTMLElement[] = [];
        rows.forEach((row) => {
          getCells(row).forEach((cell) => {
            if (cell.getAttribute(ARIA.selected) === "true") {
              selected.push(cell);
            }
          });
        });
        return selected;
      },
    });

    // Watch for attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          ["label", "selectionMode", "multiSelect"].includes(
            mutation.attributeName ?? ""
          )
        ) {
          updateAria();
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });

    // Watch for child changes
    const childObserver = new MutationObserver(() => {
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
