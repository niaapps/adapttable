/** material owns the connection fields shown beside its assistant. */
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

import { ConnectionFieldModel } from "../connectionField";

@Component({
  selector: "adapt-connection-field",
  imports: [MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<mat-form-field
    appearance="outline"
    subscriptSizing="dynamic"
    style="width:100%"
    ><input
      matInput
      [type]="props().type"
      [attr.aria-label]="props().label"
      [value]="props().value"
      [disabled]="props().disabled"
      autocomplete="off"
      spellcheck="false"
      style="width:100%;min-width:0;box-sizing:border-box"
      (input)="changed($event)"
  /></mat-form-field>`,
})
export class ShowcaseConnectionField extends ConnectionFieldModel {}
