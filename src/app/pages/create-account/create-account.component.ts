import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginPath } from '../../shared/path-enums/login-path';

@Component({
  selector: 'app-create-account',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-account.component.html',
  styleUrl: './create-account.component.scss',
})
export class CreateAccount {
  createAccountForm: FormGroup;
  passwordVisible = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.createAccountForm = this.fb.group({
      role: ['capacity', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit(): void {
    if (this.createAccountForm.invalid) {
      this.createAccountForm.markAllAsTouched();
      return;
    }

    // When Auth Service is ready, integrate here
    const payload = this.createAccountForm.value;
    console.log('Create account payload', payload);
  }

  navigateToLogin(): void {
    this.router.navigate([LoginPath.login]);
  }

}
