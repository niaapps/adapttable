/** taigaUi owns the connection fields shown beside its assistant. */
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { TuiInput, TuiTextfield } from "@taiga-ui/core";

import { ConnectionFieldModel } from "../connectionField";

@Component({
  selector: "adapt-connection-field",
  imports: [TuiInput, TuiTextfield],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tui-textfield tuiTextfieldSize="s"
    ><input
      tuiInput
      [type]="props().type"
      [attr.aria-label]="props().label"
      [value]="props().value"
      [disabled]="props().disabled"
      autocomplete="off"
      spellcheck="false"
      style="width:100%;min-width:0;box-sizing:border-box"
      (input)="changed($event)"
  /></tui-textfield>`,
})
export class ShowcaseConnectionField extends ConnectionFieldModel {}
