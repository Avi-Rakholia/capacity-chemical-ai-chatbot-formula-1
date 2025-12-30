import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

type UserRole = 'user' | 'capacity_admin' | 'nsight_admin';

interface DashboardCard {
  title: string;
  iconUrl: string;
  route: string;
  color: string;
  allowedRoles: UserRole[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class DashboardComponent implements OnInit {

  private router = inject(Router);

  /* ----------------------------------------------------
     BACKEND USER (SINGLE SOURCE OF TRUTH)
  ---------------------------------------------------- */
  currentUser = signal<any>(this.getBackendUser());

  role = computed<UserRole>(() => {
    return this.currentUser()?.role_name || 'user';
  });

  /* ----------------------------------------------------
     DASHBOARD CARD CONFIG
  ---------------------------------------------------- */
  allCards: DashboardCard[] = [
    {
      title: 'Formula Chatbot',
      iconUrl: '/assets/chatbot.svg',
      route: '/home/chatbot',
      color: '#f4f4f4',
      allowedRoles: ['user', 'capacity_admin', 'nsight_admin']
    },
    {
      title: 'Resources',
      iconUrl: '/assets/resources.svg',
      route: '/home/resources',
      color: '#f4f4f4',
      allowedRoles: ['user', 'capacity_admin', 'nsight_admin']
    },
    {
      title: 'Pending Approvals',
      iconUrl: '/assets/pending_approvals.svg',
      route: '/home/approvals',
      color: '#f4f4f4',
      allowedRoles: ['user', 'capacity_admin', 'nsight_admin']
    },
    {
      title: 'Config Settings',
      iconUrl: '/assets/settings.svg',
      route: '/home/settings',
      color: '#f4f4f4',
      allowedRoles: ['user', 'capacity_admin', 'nsight_admin']
    },
    {
      title: 'User Management',
      iconUrl: '/assets/users.svg',
      route: '/admin/users',
      color: '#f4f4f4',
      allowedRoles: ['capacity_admin', 'nsight_admin']
    },
    {
      title: 'Analytics Dashboard',
      iconUrl: '/assets/analytics.svg',
      route: '/admin/analytics',
      color: '#f4f4f4',
      allowedRoles: ['capacity_admin','nsight_admin']
    }
  ];

  /* ----------------------------------------------------
     ROLE-BASED FILTERED CARDS
  ---------------------------------------------------- */
  dashboardCards = computed<DashboardCard[]>(() => {
    const role = this.role();
    return this.allCards.filter(card =>
      card.allowedRoles.includes(role)
    );
  });

  /* ----------------------------------------------------
     INIT
  ---------------------------------------------------- */
  ngOnInit(): void {
    console.log('✅ DASHBOARD USER:', this.currentUser());
    console.log('✅ DASHBOARD ROLE:', this.role());
  }

  /* ----------------------------------------------------
     HELPERS
  ---------------------------------------------------- */
  private getBackendUser() {
    const raw = localStorage.getItem('user_data');
    return raw ? JSON.parse(raw) : null;
  }

  navigateToCard(card: DashboardCard): void {
    this.router.navigate([card.route]);
  }

  getUserDisplayName(): string {
    const user = this.currentUser();
    return (
      user?.username ||
      user?.email?.split('@')[0] ||
      'User'
    );
  }
}
