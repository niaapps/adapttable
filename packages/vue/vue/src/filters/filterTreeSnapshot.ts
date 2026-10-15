import {
  isFilterGroup,
  type QueryCondition,
  type QueryFilterGroup,
} from "@adapttable/core";

type PrimitiveOperand =
  string | number | boolean | bigint | symbol | null | undefined;
type OperandSnapshot =
  | { readonly kind: "array"; readonly values: readonly PrimitiveOperand[] }
  | { readonly kind: "identity"; readonly value: unknown };
interface FilterGroupSnapshot {
  readonly combinator: QueryFilterGroup["combinator"];
  readonly conditions: readonly FilterNodeSnapshot[];
}
type FilterNodeSnapshot =
  | { readonly kind: "group"; readonly group: FilterGroupSnapshot }
  | {
      readonly kind: "condition";
      readonly key: string;
      readonly op: string;
      readonly operand: OperandSnapshot;
    };
function primitiveOperand(value: unknown): value is PrimitiveOperand {
  return (
    value === null || (typeof value !== "object" && typeof value !== "function")
  );
}
/** Snapshot flat primitive arrays without evaluating accessors or custom operands. */
function primitiveArray(
  value: unknown
): readonly PrimitiveOperand[] | undefined {
  try {
    if (
      !Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Array.prototype
    )
      return undefined;
    const length: unknown = Object.getOwnPropertyDescriptor(
      value,
      "length"
    )?.value;
    if (typeof length !== "number" || !Number.isInteger(length) || length < 0)
      return undefined;
    if (Reflect.ownKeys(value).length !== length + 1) return undefined;
    const values: PrimitiveOperand[] = [];
    for (let index = 0; index < length; index++) {
      const property = Object.getOwnPropertyDescriptor(value, index);
      const item: unknown = property?.value;
      if (!property || !("value" in property) || !primitiveOperand(item))
        return undefined;
      values.push(item);
    }
    return values;
  } catch {
    // A proxy may reject inspection. Its identity is still a valid opaque operand.
    return undefined;
  }
}
function operandSnapshot(value: unknown): OperandSnapshot {
  const values = primitiveArray(value);
  return values ? { kind: "array", values } : { kind: "identity", value };
}
function filterNodeSnapshot(
  node: QueryCondition | QueryFilterGroup
): FilterNodeSnapshot {
  return isFilterGroup(node)
    ? { kind: "group", group: filterTreeSnapshot(node) }
    : {
        kind: "condition",
        key: node.key,
        op: node.op,
        operand: operandSnapshot(node.value),
      };
}
export function filterTreeSnapshot(
  tree: QueryFilterGroup
): FilterGroupSnapshot {
  return {
    combinator: tree.combinator,
    conditions: tree.conditions.map(filterNodeSnapshot),
  };
}
function sameOperand(value: unknown, snapshot: OperandSnapshot): boolean {
  if (snapshot.kind === "identity") return Object.is(value, snapshot.value);
  const values = primitiveArray(value);
  return (
    values?.length === snapshot.values.length &&
    values.every((item, index) => Object.is(item, snapshot.values[index]))
  );
}
function sameFilterNode(
  node: QueryCondition | QueryFilterGroup,
  snapshot: FilterNodeSnapshot | undefined
): boolean {
  if (!snapshot) return false;
  if (snapshot.kind === "group")
    return isFilterGroup(node) && sameFilterTree(node, snapshot.group);
  return (
    !isFilterGroup(node) &&
    node.key === snapshot.key &&
    node.op === snapshot.op &&
    sameOperand(node.value, snapshot.operand)
  );
}
export function sameFilterTree(
  tree: QueryFilterGroup,
  snapshot: FilterGroupSnapshot | undefined
): boolean {
  return (
    tree.combinator === snapshot?.combinator &&
    tree.conditions.length === snapshot.conditions.length &&
    tree.conditions.every((node, index) =>
      sameFilterNode(node, snapshot.conditions[index])
    )
  );
}
