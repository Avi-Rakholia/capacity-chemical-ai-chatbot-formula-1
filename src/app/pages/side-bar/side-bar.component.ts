import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { SupabaseService, AuthUser } from '../../core/services/supabase.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  currentUser = signal<AuthUser | null>(null);
  activeRoute = signal<string>('dashboard');
  profileMenuOpen = signal<boolean>(false);

  ngOnInit() {
    // Subscribe to current user changes
    this.supabaseService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
      
      // Redirect to login if not authenticated
      if (!user) {
        this.router.navigate(['/login']);
      }
    });

    // Track current route
    this.updateActiveRoute();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.updateActiveRoute();
    this.profileMenuOpen.set(false);
  }

  private updateActiveRoute(): void {
    const currentUrl = this.router.url;
    if (currentUrl.includes('chatbot')) {
      this.activeRoute.set('chatbot');
    } else if (currentUrl.includes('resources')) {
      this.activeRoute.set('resources');
    } else if (currentUrl.includes('approvals')) {
      this.activeRoute.set('approvals');
    } else if (currentUrl.includes('users')) {
      this.activeRoute.set('users');
    } else if (currentUrl.includes('analytics')) {
      this.activeRoute.set('analytics');
    } else if (currentUrl.includes('settings')) {
      this.activeRoute.set('settings');
    } else {
      this.activeRoute.set('dashboard');
    }
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen.update(open => !open);
  }

  getUserDisplayName(): string {
    const user = this.currentUser();
    if (!user) return 'User';
    
    // Try to get username from metadata, fallback to email prefix
    const username = user.metadata?.username || user.metadata?.display_name;
    if (username) return username;
    
    return user.email?.split('@')[0] || 'User';
  }

  getUserAvatar(): string {
    const user = this.currentUser();
    if (user?.metadata?.avatar) {
      return user.metadata.avatar;
    }
    
    // Generate a placeholder avatar with user initials
    const displayName = this.getUserDisplayName();
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    
    // You can use a service like Gravatar or generate a colored avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3498db&color=fff&size=40`;
  }

  getRoleDisplayName(): string {
    const user = this.currentUser();
    if (!user?.role) return 'User';
    
    const roleMap: { [key: string]: string } = {
      'nsight': 'Nsight Admin',
      'capacity': 'Capacity Admin',
      'user': 'User'
    };
    
    return roleMap[user.role] || user.role;
  }

  isAdmin(): boolean {
    const user = this.currentUser();
    return user?.role === 'nsight' || user?.role === 'capacity';
  }

  async logout(): Promise<void> {
    this.profileMenuOpen.set(false);
    
    const { error } = await this.supabaseService.signOut();
    
    if (!error) {
      this.router.navigate(['/login']);
    } else {
      console.error('Logout error:', error);
    }
  }
}
