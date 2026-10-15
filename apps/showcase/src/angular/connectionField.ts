/** Connection settings state; the selected kit supplies the actual input. */
import { Directive, input } from "@angular/core";

export interface ConnectionFieldProps {
  readonly label: string;
  readonly value: string;
  readonly type: "url" | "password";
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
}

@Directive({})
export abstract class ConnectionFieldModel {
  readonly props = input.required<ConnectionFieldProps>();
  protected changed(event: Event): void {
    this.props().onChange((event.target as HTMLInputElement).value);
  }
}
