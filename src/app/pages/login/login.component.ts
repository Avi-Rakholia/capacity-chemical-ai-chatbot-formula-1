import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CreateAccountPath } from '../../shared/path-enums/create-account-path';
import { SupabaseAuthService } from '../../core/services/supabase-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(SupabaseAuthService);

  /* ---------------- FORMS ---------------- */
  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;

  /* ---------------- UI STATE ---------------- */
  showForgotPassword = false;
  passwordVisible = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  forgotSuccessMessage = signal<string | null>(null);

  constructor() {
    this.loginForm = this.fb.group({
      role: ['capacity', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  /* ================= LOGIN ================= */

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const { email, password } = this.loginForm.value;

      const result = await this.authService.signIn(email, password);

      if (result?.error) {
        this.errorMessage.set(result.error.message);
        return;
      }

      if (result?.user) {
        this.router.navigate(['/home/dashboard']);
      }
    } catch (error) {
      console.error('Login error:', error);
      this.errorMessage.set('An unexpected error occurred. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /* ================= FORGOT PASSWORD ================= */

  openForgotPassword(): void {
    this.showForgotPassword = true;
    this.forgotSuccessMessage.set(null);
    this.errorMessage.set(null);
  }

  closeForgotPassword(): void {
    this.showForgotPassword = false;
    this.forgotPasswordForm.reset();
    this.forgotSuccessMessage.set(null);
  }

  async submitForgotPassword(): Promise<void> {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    const email = this.forgotPasswordForm.value.email;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.forgotSuccessMessage.set(null);

    try {
      // 🔥 ACTUAL SUPABASE CALL (service method)
      const result = await this.authService.resetPassword(email);

      if (result?.error) {
  this.errorMessage.set(result.error);
  return;
}


      this.forgotSuccessMessage.set(
        'Password reset link sent. Please check your email.'
      );

      // Optional: auto close modal after success
      setTimeout(() => {
        this.closeForgotPassword();
      }, 2000);
    } catch (error) {
      console.error('Forgot password error:', error);
      this.errorMessage.set('Failed to send reset link. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /* ================= NAVIGATION ================= */

  navigateToCreateAccount(): void {
    this.router.navigate([`/${CreateAccountPath.createAccount}`]);
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update(v => !v);
  }

  /* ================= OAUTH (OPTIONAL) ================= */

  async signInWithMicrosoft(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const result = await this.authService.signInWithOAuth('azure');

      if (result?.error) {
        this.errorMessage.set(result.error.message);
      }
    } catch (error) {
      console.error('Microsoft OAuth error:', error);
      this.errorMessage.set('Microsoft sign-in failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
