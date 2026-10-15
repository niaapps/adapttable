---
"@adapttable/core": patch
"@adapttable/i18n": patch
"@adapttable/ai": patch
"@adapttable/react": patch
"@adapttable/ai-react": patch
"@adapttable/angular": patch
"@adapttable/vue": patch
"@adapttable/base-ui": patch
"@adapttable/mui": patch
"@adapttable/element-plus": patch
"@adapttable/naive-ui": patch
"@adapttable/mantine": patch
"@adapttable/antd": patch
"@adapttable/ng-zorro": patch
"@adapttable/nuxt-ui": patch
"@adapttable/quasar": patch
---

Keep table state and editing history consistent across async work and framework lifecycles.

- Restore AI query state before pagination during undo, include pagination side effects in single-action undo, and retire undo/resume state when chat is cleared.
- Ignore obsolete lazy tree requests after disconnect and allow pending rows to reload on reconnect.
- Serialize saved-view storage writes, wait for pending writes before reload, retain replacement metadata, and remove renamed views only after their replacement saves successfully.
- Keep disabled or disconnected editing history inert. Capture undo values before host writes, but record inline and batch saves only after success, preserving redo when saves fail.
- Keep React assistants alive through Strict Mode replay, preserve WebSocket connections across equivalent protocol arrays, and scroll virtual rows into view during keyboard navigation. Batch virtual row measurements safely during React commits.
- Synchronize mounted range filters after persisted state changes in React, Angular and Vue, while retaining local previews across unrelated changes.
- Report absolute virtualized column positions and total column counts to assistive technology in Angular.
- Stabilize Angular virtual keyboard navigation by measuring rows after rendering, revealing unmounted destinations, and suppressing the page-level sentinel below bounded virtual tables.
- Await asynchronous paste/fill saves, preserve history until they succeed, and announce rejected saves or invalid pasted values without unhandled promise failures. Add localized fill failure messages in every locale.
- Compute selection statistics without argument-count overflow or intermediate value matrices, count only loaded cells, and bound copy/statistics work to the loaded selection. Keep clipboard and export value resolution aligned while reducing optional feature bundle size.
- Retire obsolete validation and save results across clear/retry transitions, release completed request identities, clear stale errors after synchronous retries, and preserve the original save error if a host formatter throws.
- Honor zero/sub-unit edit-history depth and snapshot redo descriptors before a host reuses its batch array.
- Detect a fill series once per source lane instead of recomputing it for every destination cell, keeping large drag-fill gestures responsive.
- Handle copy/cut/paste/fill/find shortcuts with Caps Lock and report rejected fill parsing without throwing or extending the selected range.
- Compute pivot min/max without spreading large groups into function arguments, avoiding stack-limit failures on large datasets.
- Replace obsolete field errors from row validation when the row is checked again, preserving independent cell-validator errors and clearing both sources on reset.
- Share one Reka runtime across showcase kits so Nuxt UI shortcut menus can receive focus inside the mobile assistant sheet and Escape closes the menu alone.
- Keep assistant receipts readable without compounded opacity, improve neutral status and secondary control contrast, and use Naive UI's text token for the composer placeholder. Verify all supported assistants in light and dark themes with browser contrast checks.
- Ignore server export progress callbacks after the run succeeds, fails or is dismissed, keeping terminal outcomes stable.
- Retire React's all-matching selection on query reset even without explicit selected IDs, and when across-page selection becomes unavailable.
- Retire pending clipboard reads and cuts when the grid detaches, preventing delayed host writes after unmount or remount.
- Reset Vue row selection when search, filters or grouping change, retain it across paging and sorting, and respect controlled host refusal. Include compound filters in React's selection reset key.
- Improve warning status and approval button contrast with native kit colors, including light and dark approval/rejection states.
- Announce copy value-conversion failures without throwing, writing an incomplete clipboard or clearing cut cells.
