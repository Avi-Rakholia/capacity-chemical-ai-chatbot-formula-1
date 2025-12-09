import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
// import { SupabaseService, AuthUser } from '../../core/services/supabase.service'; // ⛔ TEMPORARILY DISABLED

interface DashboardCard {
  title: string;
  iconUrl: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class DashboardComponent implements OnInit {

  private router = inject(Router);

  // currentUser = signal<AuthUser | null>(null); // ⛔ Disabled

  // 👇 TEMP FIX — force admin mode so all cards show
  currentUser = signal<any>({
    role: 'capacity', // treat current user as admin
    email: 'temp-ui-user@example.com',
    metadata: { username: 'UI Tester' }
  });

  dashboardCards = computed<DashboardCard[]>(() => {
    const user = this.currentUser();
    const isAdmin = true; // ⛔ TEMP override → always show admin cards

    const baseCards: DashboardCard[] = [
      {
        title: 'Formula Chatbot',
        iconUrl: '/assets/chatbot.svg',
        route: '/home/chatbot',
        color: '#f4f4f4'
      },
      {
        title: 'Resources',
        iconUrl: '/assets/resources.svg',
        route: '/home/resources',
        color: '#f4f4f4'
      },
      {
        title: 'Pending Approvals',
        iconUrl: '/assets/pending_approvals.svg',
        route: '/home/approvals',
        color: '#f4f4f4'
      },
      {
        title: 'Config Settings',
        iconUrl: '/assets/settings.svg',
        route: '/home/settings',
        color: '#f4f4f4'
      }
    ];

    if (isAdmin) {
      baseCards.push(
        {
          title: 'User Management',
          iconUrl: '/assets/users.svg',
          route: '/admin/users',
          color: '#f4f4f4'
        },
        {
          title: 'Analytics Dashboard',
          iconUrl: '/assets/analytics.svg',
          route: '/admin/analytics',
          color: '#f4f4f4'
        }
      );
    }

    return baseCards;
  });

  ngOnInit() {
    // ❌ Entire Supabase subscription disabled
    // this.supabaseService.currentUser$.subscribe(user => {
    //   this.currentUser.set(user);
    // });
  }

  navigateToCard(card: DashboardCard): void {
    this.router.navigate([card.route]);
  }

  getUserDisplayName(): string {
    const user = this.currentUser();
    return user?.metadata?.username || user?.email?.split('@')[0] || 'User';
  }
}
