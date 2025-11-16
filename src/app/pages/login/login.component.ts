import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CreateAccountPath } from '../../shared/path-enums/create-account-path';

@Component({
  selector: 'app-login',  
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  passwordVisible = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      role: ['capacity', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // When Auth Service is ready, integrate here
    const payload = this.loginForm.value;
    console.log('Login payload', payload);
  }

  navigateToCreateAccount(): void {
    this.router.navigate([CreateAccountPath.createAccount]);
  }
}
