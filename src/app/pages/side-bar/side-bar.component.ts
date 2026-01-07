import {
  Component,
  inject,
  OnInit,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterOutlet,
  NavigationEnd
} from '@angular/router';
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

  /* ----------------------------------------------------
     BACKEND USER (SOURCE OF TRUTH FOR ROLE)
  ---------------------------------------------------- */
  backendUser = signal<any>(this.getBackendUser());

  role = computed<'nsight_admin' | 'capacity_admin' | 'user'>(() => {
    const user = this.backendUser();
    return user?.role_name ?? 'user';
  });

  /* ----------------------------------------------------
     UI STATE
  ---------------------------------------------------- */
  activeRoute = signal<string>('dashboard');
  profileMenuOpen = signal<boolean>(false);

  open = signal<boolean>(true);
  isOpen = computed(() => this.open());
  isCollapsed = computed(() => !this.open());

  isMobileView = false;

  logoUrlExpanded = '/assets/capacity-chemical.svg';
  logoUrlCollapsed = '/assets/capacity-chemical-c.svg';

  /* ----------------------------------------------------
     INIT
  ---------------------------------------------------- */
  ngOnInit() {
    this.checkWindowSize();

    const savedMode = localStorage.getItem('sidebarMode');
    if (savedMode === 'collapse') this.open.set(false);
    if (savedMode === 'expand') this.open.set(true);

    /** Protect route if auth is lost */
    this.authService.currentUser$.subscribe(user => {
      if (!user) this.router.navigate(['/login']);
    });

    this.updateActiveRoute();
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.updateActiveRoute());

    console.log('✅ SIDEBAR ROLE:', this.role());
  }

  /* ----------------------------------------------------
     BACKEND USER LOADER
  ---------------------------------------------------- */
  private getBackendUser() {
    const raw = localStorage.getItem('user_data');
    return raw ? JSON.parse(raw) : null;
  }

  /* ----------------------------------------------------
     SIDEBAR OPEN / COLLAPSE
  ---------------------------------------------------- */
  toggleOpen(): void {
    this.open.update(v => !v);
    if (!this.open()) this.profileMenuOpen.set(false);
  }

  setOpen(value: boolean): void {
    this.open.set(value);
    if (!value) this.profileMenuOpen.set(false);
  }

  /* ----------------------------------------------------
     ROUTING
  ---------------------------------------------------- */
  navigateTo(route: string): void {
    this.router.navigate([route]).then(() => {
      if (this.isMobileView) this.open.set(false);
      this.profileMenuOpen.set(false);
      this.updateActiveRoute();
    });
  }

  private updateActiveRoute(): void {
    const url = this.router.url;

    if (url.includes('chatbot')) this.activeRoute.set('chatbot');
    else if (url.includes('resources')) this.activeRoute.set('resources');
    else if (url.includes('approvals')) this.activeRoute.set('approvals');
    else if (url.includes('users')) this.activeRoute.set('users');
    else if (url.includes('analytics')) this.activeRoute.set('analytics');
    else if (url.includes('settings')) this.activeRoute.set('settings');
    else this.activeRoute.set('dashboard');
  }

  /* ----------------------------------------------------
     PROFILE MENU
  ---------------------------------------------------- */
  toggleProfileMenu(): void {
    this.profileMenuOpen.update(v => !v);
  }

  /* ----------------------------------------------------
     USER DISPLAY
  ---------------------------------------------------- */
  getUserDisplayName(): string {
    const user = this.backendUser();
    if (!user) return 'User';

    return (
      user.username ||
      user.email?.split('@')[0] ||
      'User'
    );
  }

  getUserAvatar(): string {
    const name = this.getUserDisplayName();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=3498db&color=fff&size=40`;
  }

  getRoleDisplayName(): string {
    const roleMap: Record<string, string> = {
      nsight_admin: 'Nsight Admin',
      capacity_admin: 'Capacity Admin',
      user: 'User'
    };

    return roleMap[this.role()] || 'User';
  }

  /* ----------------------------------------------------
     ROLE CHECKS
  ---------------------------------------------------- */
  isAdmin(): boolean {
    return (
      this.role() === 'nsight_admin' ||
      this.role() === 'capacity_admin'
    );
  }

  isUser(): boolean {
    return this.role() === 'user';
  }

  /* ----------------------------------------------------
     LOGOUT
  ---------------------------------------------------- */
  async logout(): Promise<void> {
    this.profileMenuOpen.set(false);
    await this.authService.logout();

    localStorage.removeItem('user_data');
    localStorage.removeItem('user');

    this.router.navigate(['/login']);
  }

  /* ----------------------------------------------------
     RESPONSIVE
  ---------------------------------------------------- */
  onResize = () => this.checkWindowSize();

  private checkWindowSize() {
    const isMobile = window.innerWidth < 640;

    if (isMobile && !this.isMobileView) {
      this.open.set(false);
    }

    this.isMobileView = isMobile;
  }
}
