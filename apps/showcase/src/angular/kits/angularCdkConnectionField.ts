/** angularCdk owns the connection fields shown beside its assistant. */
import { A11yModule } from "@angular/cdk/a11y";
import { ChangeDetectionStrategy, Component } from "@angular/core";

import { ConnectionFieldModel } from "../connectionField";

@Component({
  selector: "adapt-connection-field",
  imports: [A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input
    cdkMonitorElementFocus
    data-adapttable-cdk-control
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
