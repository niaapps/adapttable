---
"@adapttable/vue": patch
---

Narrow select-all-matching scope when the host replaces controlled selected IDs, including when restoring a query and selection together. Preserve the supplied IDs without emitting a selection-change callback, so bulk actions target only those rows.
