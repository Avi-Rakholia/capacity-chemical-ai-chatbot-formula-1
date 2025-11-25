import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class PasswordValidators {
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value: string = control.value || "";

      if (!value) return null;

      const errors: any = {};

      if (value.length < 8) {
        errors.minLength = true;
      }
      if (!/[A-Z]/.test(value)) {
        errors.uppercase = true;
      }
      if (!/[a-z]/.test(value)) {
        errors.lowercase = true;
      }
      if (!/[0-9]/.test(value)) {
        errors.number = true;
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        errors.specialChar = true;
      }

      return Object.keys(errors).length ? errors : null;
    };
  }

  static passwordsMatch(passwordField: string, confirmField: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get(passwordField)?.value;
      const confirmPassword = group.get(confirmField)?.value;

      if (password && confirmPassword && password !== confirmPassword) {
        return { passwordMismatch: true };
      }

      return null;
    };
  }
}
