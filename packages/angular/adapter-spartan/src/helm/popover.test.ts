import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  BrnPopover,
  BrnPopoverContent,
  BrnPopoverTrigger,
} from "@spartan-ng/brain/popover";
import { within } from "@testing-library/dom";
import { afterEach, describe, expect, it } from "vitest";

import { expectNamedPopover, focusAndClick } from "../../testUtils";
import { HlmButton } from "./controls";
import { HlmPopoverLabel } from "./popover";

@Component({
  imports: [
    BrnPopover,
    BrnPopoverContent,
    BrnPopoverTrigger,
    HlmButton,
    HlmPopoverLabel,
  ],
  template: `
    <div brnPopover [adaptHlmPopoverLabel]="label()">
      <button adaptHlmButton brnPopoverTrigger>{{ label() }}</button>
      <ng-template brnPopoverContent>
        <button adaptHlmButton data-test-popover-action>Choose</button>
      </ng-template>
    </div>
  `,
})
class Host {
  readonly label = signal("Row actions");
}

describe("native Brain popover names", () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    document.body.replaceChildren();
  });

  it("names the controlled native pane, updates its locale and names a reopened pane", async () => {
    const fixture = TestBed.createComponent(Host);
    document.body.append(fixture.nativeElement as HTMLElement);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const trigger = (fixture.nativeElement as HTMLElement).querySelector(
      "button"
    )!;
    expect(within(document.body).queryByRole("dialog")).toBeNull();
    focusAndClick(trigger);
    await fixture.whenStable();
    const action = document.querySelector<HTMLElement>(
      "[data-test-popover-action]"
    )!;
    const pane = document.getElementById(
      trigger.getAttribute("aria-controls")!
    );
    expectNamedPopover(action, "Row actions");
    expect(action.closest(".cdk-overlay-pane")).toBe(pane);
    const host = pane!.parentElement!;
    expect(host.style.inlineSize).toBe("");
    host.setAttribute("popover", "manual");
    host.style.width = "100%";
    // jsdom has no showPopover(); represent the already-open native host.
    host.style.display = "block";

    fixture.componentInstance.label.set("Actions de la ligne");
    await fixture.whenStable();
    expect(host.style.inlineSize).toBe(`${String(window.innerWidth)}px`);
    expect(host.style.getPropertyPriority("inline-size")).toBe("important");
    host.style.inlineSize = "400px";
    window.dispatchEvent(new Event("resize"));
    expect(host.style.inlineSize).toBe(`${String(window.innerWidth)}px`);
    expectNamedPopover(action, "Actions de la ligne");
    expect(
      within(document.body).queryByRole("dialog", { name: "Row actions" })
    ).toBeNull();
    expect(
      document.getElementById(trigger.getAttribute("aria-controls")!)
    ).toBe(pane);

    action.focus();
    const escape = new KeyboardEvent("keydown", {
      key: "Escape",
      keyCode: 27,
      bubbles: true,
      cancelable: true,
    });
    action.dispatchEvent(escape);
    await fixture.whenStable();
    expect(escape.defaultPrevented).toBe(true);
    expect(within(document.body).queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    trigger.dispatchEvent(
      new KeyboardEvent("keyup", { key: "Escape", keyCode: 27, bubbles: true })
    );
    focusAndClick(trigger);
    await fixture.whenStable();
    const reopened = document.querySelector<HTMLElement>(
      "[data-test-popover-action]"
    )!;
    expectNamedPopover(reopened, "Actions de la ligne");
    expect(reopened).not.toBe(action);
  });
});
