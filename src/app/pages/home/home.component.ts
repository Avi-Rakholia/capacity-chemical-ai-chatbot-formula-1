import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { SupabaseService, AuthUser } from '../../services/supabase.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="home-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <img src="assets/capacity-chemical-logo.svg" alt="Capacity Chemical" class="logo-img">
          </div>
        </div>

        <nav class="sidebar-nav">
          <button 
            class="nav-item"
            [class.active]="activeRoute() === 'dashboard'"
            (click)="navigateTo('/home/dashboard')"
          >
            <i class="material-icons">home</i>
            <span>Dashboard</span>
          </button>

          <button 
            class="nav-item"
            [class.active]="activeRoute() === 'chatbot'"
            (click)="navigateTo('/home/chatbot')"
          >
            <i class="material-icons">chat</i>
            <span>AI Chatbot</span>
          </button>

          <button 
            class="nav-item"
            [class.active]="activeRoute() === 'resources'"
            (click)="navigateTo('/home/resources')"
          >
            <i class="material-icons">folder</i>
            <span>Resources</span>
          </button>

          <button 
            class="nav-item"
            [class.active]="activeRoute() === 'approvals'"
            (click)="navigateTo('/home/approvals')"
          >
            <i class="material-icons">assignment</i>
            <span>Pending Approvals</span>
          </button>

          @if (isAdmin()) {
            <button 
              class="nav-item"
              [class.active]="activeRoute() === 'users'"
              (click)="navigateTo('/admin/users')"
            >
              <i class="material-icons">group</i>
              <span>User Management</span>
            </button>

            <button 
              class="nav-item"
              [class.active]="activeRoute() === 'analytics'"
              (click)="navigateTo('/admin/analytics')"
            >
              <i class="material-icons">analytics</i>
              <span>Analytics</span>
            </button>
          }

          <button 
            class="nav-item"
            [class.active]="activeRoute() === 'settings'"
            (click)="navigateTo('/home/settings')"
          >
            <i class="material-icons">settings</i>
            <span>Settings</span>
          </button>
        </nav>

        <!-- User Profile Section -->
        <div class="sidebar-footer">
          <div class="profile-section">
            @if (currentUser()) {
              <div class="profile-info">
                <div class="avatar">
                  <img 
                    [src]="getUserAvatar()" 
                    [alt]="currentUser()!.email"
                    class="avatar-img"
                  />
                </div>
                <div class="user-details">
                  <div class="user-name">{{ getUserDisplayName() }}</div>
                  <div class="user-role">{{ getRoleDisplayName() }}</div>
                </div>
                <div class="profile-actions">
                  <button 
                    class="profile-menu-btn"
                    (click)="toggleProfileMenu()"
                    [class.active]="profileMenuOpen()"
                  >
                    <i class="material-icons">more_vert</i>
                  </button>
                </div>
              </div>

              @if (profileMenuOpen()) {
                <div class="profile-menu">
                  <button class="menu-item" (click)="navigateTo('/home/settings')">
                    <i class="material-icons">person</i>
                    Profile Settings
                  </button>
                  <button class="menu-item" (click)="logout()">
                    <i class="material-icons">logout</i>
                    Sign Out
                  </button>
                </div>
              }
            }
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .home-layout {
      display: flex;
      height: 100vh;
      background-color: #f8f9fa;
    }

    /* Sidebar Styles */
    .sidebar {
      width: 280px;
      background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
      color: white;
      display: flex;
      flex-direction: column;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
      position: relative;
    }

    .sidebar-header {
      padding: 24px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-img {
      max-height: 40px;
      max-width: 200px;
      filter: brightness(0) invert(1); /* Make logo white */
    }

    /* Navigation Styles */
    .sidebar-nav {
      flex: 1;
      padding: 24px 0;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
      padding: 14px 24px;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
      position: relative;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .nav-item.active {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }

    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: #3498db;
    }

    .nav-item i {
      font-size: 20px;
    }

    .nav-item span {
      font-weight: 500;
    }

    /* Profile Section */
    .sidebar-footer {
      padding: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
    }

    .profile-section {
      position: relative;
    }

    .profile-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      transition: background-color 0.3s ease;
    }

    .profile-info:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      background: #3498db;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .user-details {
      flex: 1;
      min-width: 0;
    }

    .user-name {
      font-weight: 600;
      font-size: 14px;
      color: white;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      text-transform: capitalize;
    }

    .profile-actions {
      display: flex;
      align-items: center;
    }

    .profile-menu-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.3s ease;
    }

    .profile-menu-btn:hover,
    .profile-menu-btn.active {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .profile-menu {
      position: absolute;
      bottom: 100%;
      left: 12px;
      right: 12px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      padding: 8px 0;
      z-index: 1000;
      margin-bottom: 8px;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 16px;
      border: none;
      background: none;
      color: #333;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s ease;
    }

    .menu-item:hover {
      background: #f8f9fa;
    }

    .menu-item i {
      font-size: 18px;
      color: #666;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .sidebar {
        width: 240px;
      }
      
      .nav-item {
        padding: 12px 16px;
      }
      
      .nav-item span {
        font-size: 13px;
      }
    }

    @media (max-width: 640px) {
      .home-layout {
        flex-direction: column;
      }
      
      .sidebar {
        width: 100%;
        height: auto;
        max-height: 60px;
        overflow: hidden;
      }
      
      .sidebar-nav {
        display: none;
      }
      
      .sidebar-footer {
        display: none;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
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
