# @adapttable/vue

## 0.1.3

### Patch Changes

- c8d10ab: Align assistant headers, composers, conversation alignment and viewport placement with the Mantine reference while retaining each adapter's native controls. Correct native dialog offsets, mobile focus handoff and nested shortcuts dismissal.

## 0.1.2

### Patch Changes

- 7bedef1: Keep expanded assistant action details across the transcript width without squeezing reply text, and expose the composer input container for application layout styling. Remove presentation colors from the Angular structural composer.
- 54dd62a: Handle Escape inside modal approval content so every Vue kit settles cancellation as rejection. Preserve nested controls' consumed Escape events and input composition ownership.
- b267b30: Lay out assistant headers, messages and composers through structural chrome, keeping the title, transcript and native controls readable without relying on browser list defaults.
- eaac515: Anchor enabled column resize handles to their own header cells, preserving sticky positioning for pinned columns. Handles no longer overlap at the edge of the page or span the full viewport height.
- Updated dependencies [9213f9a]
  - @adapttable/core@3.9.1

## 0.1.1

### Patch Changes

- 00df62b: Dismiss Element Plus filter popovers on Escape while focus is still on the trigger. Constrain selection columns and provide scrollable filter and column-menu structure. Keep Vue Unstyled overlays adjacent to their triggers, within the viewport and within the table's theme and fullscreen ancestry. Bound filter content before each native vendor surface measures its popup, keeping dismissal visible while fields scroll. Supply shadcn-vue’s scoped border color baseline and size Quasar filter headings for their compact panels.

## 0.1.0

### Minor Changes

- 1946b61: Add Vue column management, header rename, command palettes, context menus,
  Saved Views and controlled side panels across all eight native kits. URL and
  browser-storage layout persistence support reactive destinations and SSR-safe
  hydration; saving or applying a view flushes pending layout and Find state.
  
  Menus preserve native keyboard/typeahead navigation, labels and nested Escape
  handling. Stable anchors and accepted focus survive ordinary rerenders; retired
  callbacks, superseded destinations and disposed owners reject late work. Side
  panels keep valid tab/body associations for opaque and Unicode keys.
- a06027e: Add focused Vue kit factories for grid navigation, Find, range and column
  selection, virtualization, row pinning/reordering, grouping, trees, row details,
  nested tables, summaries, footer renderers, pivoting, formulas, streams and
  sparklines. All eight adapters supply native controls through the shared Vue
  models, including dedicated grouping, movement, status and selection panels.
  
  Preserve controlled updates, authoritative row identity, mobile layouts and
  pinned-column geometry. Release removed row measurements, invalidate delayed
  moves and focus requests when their owner changes, and report grouping/stream
  updates through the current callback. Existing column-selection and nested-table
  aliases remain available alongside the canonical feature paths.
- 7ba801b: Add opt-in filtering, compact header filters, removable filter chips, cell and
  row editing, batch editing and edit history to the Vue binding and all eight
  native kits. Host-owned writes keep drafts, saving state and errors attached to
  the active edit session. Native editors preserve generic row/column inference.
  
  Filter drawers and popovers keep native dismissal, nested Select Escape handling,
  input labels and focus restoration. Retained controls stop acting after their
  field, feature, component or KeepAlive activity is replaced or retired.
- 78f6e38: Add Vue kit standard-feature presets, bulk actions, print and export factories.
  The canonical export entry retains the CSV alias; focused PDF and XLSX entries
  keep format writers out of plain-table, CSV and preset bundles.
  
  Exports follow the active source and ignore late outcomes after replacement or
  retirement. Native bulk confirmations cannot write through a retired owner.
  All data changes remain host-controlled.
- dedb4b1: Introduce the experimental Vue binding and eight native adapters: Unstyled,
  Element Plus, Naive UI, Nuxt UI, Quasar, Reka UI, shadcn-vue and Vuetify.
  Tables support controlled selection, sorting, search, pagination, responsive
  cards, column layout, loading states and host-rendered header actions. Each kit
  renders its own controls and exposes the shared semantic parts and class hooks.
  
  Include localized, keyboard-accessible density choices, RTL layouts, SSR-safe
  controls and native fullscreen ownership. Keep labels on native inputs, table
  headers aligned with selection controls, and checkbox/button colors readable
  without a host CSS reset. The packages require Vue 3.5.0 or newer; Nuxt UI
  requires Vue 3.5.18 or newer. The first release is 0.1.0.
- 2153f11: Add optional Vue agents, conversations and speech input with native assistant
  and approval surfaces in every kit. The binding adapts neutral execution stores,
  host-confirmed controlled updates, KeepAlive suspension and disposal; dedicated
  assistant UI entries remain free of AI runtime dependencies.
  
  Approval widgets can open a full review with Back/Escape focus return and
  controlled expansion. Reviews follow the approval's identity across snapshots;
  receipts expose scoped action/turn undo, blocked explanations, speaker/question
  structure and a dedicated live region. Examples are keyboard-accessible native
  menus. Retained actions retire with their displayed message or conversation.
- 1e47ceb: Expose generic table props, slots and class hooks through
  `@adapttable/vue/adapter`, with structural table Chrome and required native
  control contracts for custom adapters. Add managed panel renderers, shared
  compound presentations and scoped reactive element-ref handoff.
  
  Public types remain nameable from the entry that returns them, including
  focused feature entries. Generic controls and shallow-ref declarations support
  the declared Vue floor; type-only re-exports do not claim runtime values. Native
  Unstyled consumers forward the same contracts. Unused presentation components
  can be removed by consumer bundlers.

### Patch Changes

- 1946b61: Allow `measureLabel` and `pivotPanelZones` to receive aggregation captions so hosts
  can localize pivot measure labels without changing field/aggregation keys or
  configuration. Default captions and authored labels remain unchanged. Vue pivot
  chips and remove controls use the same localized captions as their selector.
- aebbd39: Add optional tree-shape readers to export contexts. React, Angular and Vue all
  and selected exports include loaded descendants across filtered roots/pages;
  page files follow visible expansion. File, hook and request data agree, while
  summary callbacks and page request metadata retain original source-shaped rows.
  
  Headless contexts without shape readers retain conservative membership filtering.
  Runtime tree inventories and server export routes keep their existing behavior.
- Updated dependencies [0120bd4]
- Updated dependencies [f3240c8]
- Updated dependencies [19da962]
- Updated dependencies [d32983f]
- Updated dependencies [da5d11b]
- Updated dependencies [1946b61]
- Updated dependencies [05b436c]
- Updated dependencies [88840eb]
- Updated dependencies [d32983f]
- Updated dependencies [aebbd39]
  - @adapttable/core@3.9.0
