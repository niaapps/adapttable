/** unstyled owns the connection fields shown beside its assistant. */
import { ChangeDetectionStrategy, Component } from "@angular/core";

import { ConnectionFieldModel } from "../connectionField";

@Component({
  selector: "adapt-connection-field",
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input
    [type]="props().type"
    [attr.aria-label]="props().label"
    [value]="props().value"
    [disabled]="props().disabled"
    autocomplete="off"
    spellcheck="false"
    style="width:100%;min-width:0;box-sizing:border-box"
    (input)="changed($event)"
  />`,
})
export class ShowcaseConnectionField extends ConnectionFieldModel {}
