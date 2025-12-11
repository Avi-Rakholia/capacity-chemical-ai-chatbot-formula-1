import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SupabaseAuthService } from '../../core/services/supabase-auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss'],
  host: {
    '(window:resize)': 'onResize()'
  }
})
export class SideBarComponent implements OnInit {
  private authService = inject(SupabaseAuthService);
  private router = inject(Router);

  // Current Supabase user → signal
  currentUser = this.authService.currentUser;

  activeRoute = signal<string>('dashboard');
  profileMenuOpen = signal<boolean>(false);

  // Sidebar open (expanded) / collapsed
  open = signal<boolean>(true);
  isOpen = computed(() => this.open());
  isCollapsed = computed(() => !this.open());

  // Mobile view
  isMobileView = false;

  logoUrlExpanded = '/assets/capacity-chemical.svg';
  logoUrlCollapsed = '/assets/capacity-chemical-c.svg';

  constructor() {}

  ngOnInit() {
    this.checkWindowSize();

    /* ----------------------------------------------------
         LOAD USER DEFAULT SIDEBAR MODE (expand/collapse)
    ------------------------------------------------------*/
    const savedMode = localStorage.getItem('sidebarMode');

    if (savedMode === 'collapse') {
      this.open.set(false); // collapsed by default
    } 
    else if (savedMode === 'expand') {
      this.open.set(true); // expanded by default
    }

    // Auth listener → redirect if logged out
    this.authService.currentUser$.subscribe((user) => {
      if (!user) this.router.navigate(['/login']);
    });

    // Active route tracking
    this.updateActiveRoute();
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.updateActiveRoute());
  }

  /* ---------------------------------------
     SIDEBAR OPEN/COLLAPSE BEHAVIOR
  --------------------------------------- */

  toggleOpen(): void {
    this.open.update((v) => !v);
    if (!this.open()) this.profileMenuOpen.set(false);
  }

  setOpen(value: boolean) {
    this.open.set(value);
    if (!value) this.profileMenuOpen.set(false);
  }

  /* ---------------------------------------
     ROUTING
  --------------------------------------- */

  navigateTo(route: string): void {
    this.router.navigate([route]).then(() => {
      if (this.isMobileView) this.open.set(false);
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

  /* ---------------------------------------
     USER DISPLAY FUNCTIONS
  --------------------------------------- */

  getUserDisplayName(): string {
    const user = this.currentUser();
    if (!user) return 'User';

    const username =
      user.metadata?.username ||
      user.metadata?.display_name ||
      user.email?.split('@')[0];

    return username || 'User';
  }

  getUserAvatar(): string {
    const user = this.currentUser();

    if (user?.metadata?.avatar) return user.metadata.avatar;

    const name = this.getUserDisplayName();

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
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

  /* ---------------------------------------
     ADMIN CHECK — used by sidebar + home page
  --------------------------------------- */
  isAdmin(): boolean {
    const user = this.currentUser();
    return user?.role === 'nsight' || user?.role === 'capacity';
  }

  isUser(): boolean {
    const user = this.currentUser();
    return user?.role === 'user';
  }

  /* ---------------------------------------
     LOGOUT
  --------------------------------------- */
  async logout(): Promise<void> {
    this.profileMenuOpen.set(false);
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  /* ---------------------------------------
     RESPONSIVE BEHAVIOR
  --------------------------------------- */
  onResize = () => this.checkWindowSize();

  private checkWindowSize() {
    const w = window.innerWidth;
    const mobile = w < 640;

    /* ---------------------------------------------------------
       When switching INTO mobile mode:
       → collapse automatically ONCE
       → do NOT override saved desktop preference
    ----------------------------------------------------------*/
    if (mobile && !this.isMobileView) {
      this.open.set(false); // auto collapse on mobile
    }

    this.isMobileView = mobile;
  }
}
