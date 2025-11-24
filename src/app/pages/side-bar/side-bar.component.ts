import { Component, inject, OnInit, HostListener, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SupabaseService, AuthUser } from '../../core/services/supabase.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss'],
})
export class SideBarComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  // Signals
  currentUser = signal<AuthUser | null>(null);
  activeRoute = signal<string>('dashboard');
  profileMenuOpen = signal<boolean>(false);

  // open state: true = expanded, false = collapsed
  open = signal<boolean>(true);

  // Computed to switch styles in template
  isOpen = computed(() => this.open());
  isCollapsed = computed(() => !this.open());

  // Mobile view detection
  isMobileView = false;

  logoUrlExpanded = '/assets/capacity-chemical.svg';
  logoUrlCollapsed = '/assets/capacity-chemical-c.svg';

  constructor() {}

  ngOnInit() {
    this.checkWindowSize();

    const initialUser = this.supabaseService.getCurrentUser();
    if (initialUser) {
      this.currentUser.set(initialUser);
    }

    this.supabaseService.currentUser$.subscribe((user) => {
      this.currentUser.set(user);

      if (!user && initialUser) {
        this.router.navigate(['/login']);
      }
    });

    this.updateActiveRoute();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.updateActiveRoute();
    });
  }

  toggleOpen(): void {
    this.open.update((v) => !v);
    if (!this.open()) {
      this.profileMenuOpen.set(false);
    }
  }

  setOpen(value: boolean) {
    this.open.set(value);
    if (!value) {
      this.profileMenuOpen.set(false);
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]).then(() => {
      if (this.isMobileView) {
        this.open.set(false);
      }
      this.profileMenuOpen.set(false);
      this.updateActiveRoute();
    });
  }

  private updateActiveRoute(): void {
    const currentUrl = this.router.url;
    if (currentUrl.includes('chatbot')) this.activeRoute.set('chatbot');
    else if (currentUrl.includes('resources')) this.activeRoute.set('resources');
    else if (currentUrl.includes('approvals')) this.activeRoute.set('approvals');
    else if (currentUrl.includes('users')) this.activeRoute.set('users');
    else if (currentUrl.includes('analytics')) this.activeRoute.set('analytics');
    else if (currentUrl.includes('settings')) this.activeRoute.set('settings');
    else this.activeRoute.set('dashboard');
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen.update((open) => !open);
  }

  getUserDisplayName(): string {
    const user = this.currentUser();
    if (!user) return 'User';

    const username = user.metadata?.username || user.metadata?.display_name;
    if (username) return username;

    return user.email?.split('@')[0] || 'User';
  }

  getUserAvatar(): string {
    const user = this.currentUser();
    if (user?.metadata?.avatar) return user.metadata.avatar;

    const displayName = this.getUserDisplayName();
    const initials = displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName
    )}&background=3498db&color=fff&size=40`;
  }

  getRoleDisplayName(): string {
    const user = this.currentUser();
    if (!user?.role) return 'User';

    const roleMap: { [key: string]: string } = {
      nsight: 'Nsight Admin',
      capacity: 'Capacity Admin',
      user: 'User',
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

  @HostListener('window:resize', [])
  onResize() {
    this.checkWindowSize();
  }

  private checkWindowSize() {
    const w = window.innerWidth;
    this.isMobileView = w < 640;
    this.open.set(!this.isMobileView);
  }
}
