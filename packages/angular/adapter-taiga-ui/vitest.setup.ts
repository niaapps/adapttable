import "@angular/compiler";

import { setupTestBed } from "@analogjs/vitest-angular/setup-testbed";
import { signal } from "@angular/core";
import { TUI_DARK_MODE } from "@taiga-ui/core";
import { beforeEach, vi } from "vitest";

import { provideAdaptTaiga } from "./src/taigaRoot";

// Zoneless, as Angular runs by default: change detection follows signals.
setupTestBed({
  providers: [
    ...provideAdaptTaiga(),
    {
      // jsdom has no system media queries. Use Taiga's supported theme token
      // instead of replacing its native overlays or browser event handling.
      provide: TUI_DARK_MODE,
      useFactory: () => {
        const darkMode = signal(false);
        return Object.assign(darkMode, {
          reset: () => darkMode.set(false),
        });
      },
    },
  ],
});

// jsdom gives even connected triggers zero client rects. Taiga's JavaScript
// positioner uses that list to close detached anchors. Supply visible-anchor
// geometry while retaining native positioning, portals and event handling.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(
    function (this: HTMLElement) {
      const rects =
        this.isConnected &&
        !this.closest("[hidden]") &&
        getComputedStyle(this).display !== "none"
          ? [this.getBoundingClientRect()]
          : [];
      return Object.assign(rects, {
        item: (index: number) => rects[index] ?? null,
      });
    }
  );
});
