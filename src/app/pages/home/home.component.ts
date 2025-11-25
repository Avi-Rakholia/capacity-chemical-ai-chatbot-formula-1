import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService, AuthUser } from '../../core/services/supabase.service';

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
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  currentUser = signal<AuthUser | null>(null);

  dashboardCards = computed<DashboardCard[]>(() => {
    const user = this.currentUser();
    const isAdmin = user?.role === 'nsight' || user?.role === 'capacity';

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
    // Subscribe to current user changes
    this.supabaseService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

    navigateToCard(card: DashboardCard): void {
    this.router.navigate([card.route]);
  }

  getUserDisplayName(): string {
    const user = this.currentUser();
    if (!user) return 'User';
    
    // Try to get username from metadata, fallback to email prefix
    const username = user.metadata?.username || user.metadata?.display_name;
    if (username) return username;
    
    return user.email?.split('@')[0] || 'User';
  }
}
