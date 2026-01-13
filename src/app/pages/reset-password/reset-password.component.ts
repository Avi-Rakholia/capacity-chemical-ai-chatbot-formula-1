import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;
  error: string | null = null;
  sessionReady = false;

  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  async ngOnInit(): Promise<void> {
    /**
     * 🔥 IMPORTANT FIX
     * Supabase DOES NOT auto-create session on invite link
     * We must manually set it using URL tokens
     */
    const accessToken =
      this.route.snapshot.queryParamMap.get('access_token');
    const refreshToken =
      this.route.snapshot.queryParamMap.get('refresh_token');

    if (accessToken && refreshToken) {
      const { error } = await this.supabaseService.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error('Supabase session error:', error.message);
        this.error =
          'Auth session missing or expired. Please reopen the reset link.';
        return;
      }
    }

    // ✅ Final session check
    const session = await this.supabaseService.getSession();

    if (!session) {
      this.error =
        'Auth session missing or expired. Please reopen the reset link.';
      return;
    }

    this.sessionReady = true;
  }

  async submit(): Promise<void> {
    if (!this.sessionReady) {
      this.error = 'Auth session missing!';
      return;
    }

    if (this.form.invalid) return;

    const { password, confirmPassword } = this.form.value;

    if (password !== confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.error = null;

    const { error } = await this.supabaseService.updatePassword(password!);

    if (error) {
      this.error = error.message;
      this.loading = false;
      return;
    }

    alert('Password updated successfully. Please login.');
    this.router.navigate(['/login']);
  }
}
