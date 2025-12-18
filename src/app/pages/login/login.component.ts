import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CreateAccountPath } from '../../shared/path-enums/create-account-path';
import { SupabaseAuthService } from '../../core/services/supabase-auth.service';

@Component({
  selector: 'app-login',  
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(SupabaseAuthService);

  loginForm: FormGroup;
  passwordVisible = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.loginForm = this.fb.group({
      role: ['capacity', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      // username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const formValue = this.loginForm.value;
      
      // Sign in with Supabase
      const result = await this.authService.signIn(
        formValue.email,
        formValue.password
      );

      if (result.error) {
        this.errorMessage.set(result.error.message);
      } else if (result.user) {
        // Redirect to dashboard or appropriate page
        this.router.navigate(['/home/dashboard']);
      }
    } catch (error) {
      this.errorMessage.set('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async signInWithMicrosoft(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const result = await this.authService.signInWithOAuth('azure');
      
      if (result.error) {
        this.errorMessage.set(result.error.message);
        this.isLoading.set(false);
      }
      // If successful, the OAuth flow will handle the redirect
    } catch (error) {
      this.errorMessage.set('Microsoft sign-in failed. Please try again.');
      console.error('Microsoft OAuth error:', error);
      this.isLoading.set(false);
    }
  }

  navigateToCreateAccount(): void {
    this.router.navigate([`/${CreateAccountPath.createAccount}`]);
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update(visible => !visible);
  }
}
