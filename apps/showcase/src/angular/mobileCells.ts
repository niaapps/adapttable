/** Shared data only; each selected kit owns its avatar and progress markup. */
import { computed, Directive, input } from "@angular/core";

import { type Person, personName, personRole, utilization } from "../people";
import { SHOWCASE_PRESENTATION } from "./data";

@Directive()
export abstract class ShowcaseMobileCellModel {
  readonly row = input.required<Person>();
  readonly value = input.required<unknown>();
  readonly name = computed(() =>
    personName(
      this.row(),
      SHOWCASE_PRESENTATION.locale.startsWith("ar") ? "ar" : "en"
    )
  );
  readonly initials = computed(() =>
    this.name()
      .split(/\s+/u)
      .slice(0, 2)
      .map((part) => [...part][0] ?? "")
      .join("")
  );
  readonly role = computed(() =>
    personRole(
      this.row(),
      SHOWCASE_PRESENTATION.locale.startsWith("ar") ? "ar" : "en"
    )
  );
  readonly load = computed(() => utilization(this.row()));
}
