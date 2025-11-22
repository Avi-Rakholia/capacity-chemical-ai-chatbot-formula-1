import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService, AuthUser } from '../../core/services/supabase.service';

interface DashboardCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  bgColor: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
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
        title: 'AI Chatbot',
        description: 'Interact with our intelligent chemical assistant',
        icon: 'chat',
        route: '/home/chatbot',
        color: '#2196f3',
        bgColor: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
      },
      {
        title: 'Resources',
        description: 'Access chemical databases and documentation',
        icon: 'folder',
        route: '/home/resources',
        color: '#4caf50',
        bgColor: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)'
      },
      {
        title: 'Pending Approvals',
        description: 'Review and manage pending requests',
        icon: 'assignment',
        route: '/home/approvals',
        color: '#ff9800',
        bgColor: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)'
      }
    ];

    if (isAdmin) {
      baseCards.push(
        {
          title: 'User Management',
          description: 'Manage users and permissions',
          icon: 'group',
          route: '/admin/users',
          color: '#9c27b0',
          bgColor: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)'
        },
        {
          title: 'Analytics Dashboard',
          description: 'View system analytics and reports',
          icon: 'analytics',
          route: '/admin/analytics',
          color: '#f44336',
          bgColor: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)'
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
