import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService, AuthUser } from '../../services/supabase.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  template: `
    <div class="container-fluid">
      <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">
            <img src="assets/capacity-chemical-logo.svg" alt="Logo" height="40" />
          </a>
          <div class="navbar-nav ms-auto">
            @if (currentUser()) {
              <div class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                  {{ currentUser()!.email }}
                </a>
                <ul class="dropdown-menu">
                  <li><a class="dropdown-item" href="#" (click)="logout()">Logout</a></li>
                </ul>
              </div>
            }
          </div>
        </div>
      </nav>

      <div class="row">
        <div class="col-md-12">
          <div class="card">
            <div class="card-body">
              <h2 class="card-title">Welcome to Your Dashboard</h2>
              @if (currentUser()) {
                <div class="mb-3">
                  <p><strong>Email:</strong> {{ currentUser()!.email }}</p>
                  <p><strong>Role:</strong> {{ currentUser()!.role }}</p>
                  <p><strong>User ID:</strong> {{ currentUser()!.id }}</p>
                </div>
              }
              <p class="card-text">
                Your Supabase authentication is working! This is a protected route that requires authentication.
              </p>
              <div class="mt-4">
                <h5>Next Steps:</h5>
                <ul>
                  <li>Configure your Supabase project URL and anon key in the environment files</li>
                  <li>Set up your database tables and policies</li>
                  <li>Add more protected routes using the auth guard</li>
                  <li>Implement user profile management</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .navbar-brand img {
      max-height: 40px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  currentUser = signal<AuthUser | null>(null);

  ngOnInit() {
    // Subscribe to current user changes
    this.supabaseService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
      
      // Redirect to login if not authenticated
      if (!user) {
        this.router.navigate(['/login']);
      }
    });
  }

  async logout() {
    const { error } = await this.supabaseService.signOut();
    
    if (!error) {
      this.router.navigate(['/login']);
    } else {
      console.error('Logout error:', error);
    }
  }
}
