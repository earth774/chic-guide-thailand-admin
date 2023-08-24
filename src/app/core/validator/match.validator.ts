import { AbstractControl } from "@angular/forms";

export function MatchValidator(control: AbstractControl) {
  const selection: any = control.value;
  if (typeof selection === 'string' && selection.length > 0) {
    return { mustMatch: true };
  }
  return null;
}