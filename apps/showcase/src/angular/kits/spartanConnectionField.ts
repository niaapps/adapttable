/** spartan owns the connection fields shown beside its assistant. */
import { ɵHlmInput as HlmInput } from "@adapttable/spartan";
import { ChangeDetectionStrategy, Component } from "@angular/core";

import { ConnectionFieldModel } from "../connectionField";

@Component({
  selector: "adapt-connection-field",
  imports: [HlmInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input
    adaptHlmInput
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
