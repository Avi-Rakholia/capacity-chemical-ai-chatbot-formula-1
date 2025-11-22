import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { LoginPath } from 'src/app/shared/path-enums/login-path';

@Component({
  selector: 'app-create-account',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-account.component.html',
  styleUrl: './create-account.component.scss',
})
export class CreateAccount {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);

  createAccountForm: FormGroup;
  passwordVisible = signal(false);
  confirmPasswordVisible = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor() {
    this.createAccountForm = this.fb.group({
      role: ['capacity', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  async onSubmit(): Promise<void> {
    if (this.createAccountForm.invalid) {
      this.createAccountForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const formValue = this.createAccountForm.value;
      
      // Sign up with Supabase
      const { user, error } = await this.supabaseService.signUp({
        email: formValue.email,
        password: formValue.password,
        username: formValue.username,
        role: formValue.role
      });

      if (error) {
        this.errorMessage.set(error.message);
      } else if (user) {
        this.successMessage.set(
          'Account created successfully! Please check your email to verify your account.'
        );
        
        // Optionally redirect to login page after a delay
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      }
    } catch (error) {
      this.errorMessage.set('An unexpected error occurred. Please try again.');
      console.error('Sign up error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async signUpWithMicrosoft(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const { error } = await this.supabaseService.signInWithOAuth('azure');
      
      if (error) {
        this.errorMessage.set(error.message);
        this.isLoading.set(false);
      }
      // If successful, the OAuth flow will handle the redirect
    } catch (error) {
      this.errorMessage.set('Microsoft sign-up failed. Please try again.');
      console.error('Microsoft OAuth error:', error);
      this.isLoading.set(false);
    }
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update(visible => !visible);
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update(visible => !visible);
  }

  navigateToLogin(): void {
    this.router.navigate([LoginPath.login]);
  }
}
