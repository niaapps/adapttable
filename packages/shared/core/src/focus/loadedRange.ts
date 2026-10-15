import {
  type CellRange,
  type CellRangeBounds,
  cellRangeBounds,
} from "./cellRange";

/** Intersect absolute selection bounds with loaded rows and visible columns. */
export function loadedRangeBounds(
  range: CellRange,
  rowCount: number,
  columnCount: number,
  firstRowIndex: number
): CellRangeBounds {
  const bounds = cellRangeBounds(range);
  return {
    fromRow: Math.max(0, bounds.fromRow - firstRowIndex),
    toRow: Math.min(rowCount - 1, bounds.toRow - firstRowIndex),
    fromCol: Math.max(0, bounds.fromCol),
    toCol: Math.min(columnCount - 1, bounds.toCol),
  };
}
