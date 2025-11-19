import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-auth-callback',
  template: `
    <div class="d-flex justify-content-center align-items-center min-vh-100">
      <div class="text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Completing authentication...</p>
      </div>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  async ngOnInit() {
    try {
      // The session should be automatically handled by Supabase auth state change
      const session = await this.supabaseService.getSession();
      
      if (session) {
        // Redirect to dashboard or home page
        this.router.navigate(['/dashboard']);
      } else {
        // If no session, redirect to login
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      this.router.navigate(['/login']);
    }
  }
}
