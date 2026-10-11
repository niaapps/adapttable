import "@angular/compiler";

import { setupTestBed } from "@analogjs/vitest-angular/setup-testbed";

// Zoneless, as Angular runs by default: change detection follows signals.
setupTestBed();

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
);
