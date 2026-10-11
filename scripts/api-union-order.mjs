/** TypeScript may emit equivalent literal unions in different insertion orders. */
import ts from "typescript";

export function canonicalLiteralUnions(report) {
  const opening = /```ts\r?\n/.exec(report);
  if (!opening) return report;
  const start = opening.index + opening[0].length;
  const end = report.indexOf("```", start);
  if (end < 0) return report;
  const code = report.slice(start, end);
  const source = ts.createSourceFile(
    "report.ts",
    code,
    ts.ScriptTarget.Latest,
    true
  );
  if (source.parseDiagnostics.length) return report;
  const edits = [];
  const visit = (node) => {
    // Sort only string literal members: no object, overload, tuple, conditional,
    // intersection or declaration order is changed, and no member is removed.
    if (
      ts.isUnionTypeNode(node) &&
      node.types.every(
        (member) =>
          ts.isLiteralTypeNode(member) && ts.isStringLiteral(member.literal)
      )
    ) {
      const text = node.getText(source);
      if (!text.includes("/*") && !text.includes("//")) {
        edits.push({
          start: node.getStart(source),
          end: node.end,
          text: node.types
            .map((member) => member.getText(source))
            .sort()
            .join(" | "),
        });
      }
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  let canonical = code;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    canonical =
      canonical.slice(0, edit.start) + edit.text + canonical.slice(edit.end);
  }
  return report.slice(0, start) + canonical + report.slice(end);
}
