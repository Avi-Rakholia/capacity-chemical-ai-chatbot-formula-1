import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService, AuthUser } from '../../services/supabase.service';

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
  template: `
    <div class="dashboard-container">
      <!-- Header Section -->
      <header class="dashboard-header">
        <div class="welcome-section">
          <h1 class="welcome-title">
            Welcome back, {{ getUserDisplayName() }}! 👋
          </h1>
          <p class="welcome-subtitle">
            Here's what's happening with your chemical AI assistant today.
          </p>
        </div>
        
        @if (currentUser()) {
          <div class="user-stats">
            <div class="stat-card">
              <div class="stat-value">{{ currentUser()!.role }}</div>
              <div class="stat-label">Role</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">Active</div>
              <div class="stat-label">Status</div>
            </div>
          </div>
        }
      </header>

      <!-- Quick Actions Grid -->
      <section class="quick-actions">
        <h2 class="section-title">Quick Actions</h2>
        
        <div class="cards-grid">
          @for (card of dashboardCards(); track card.title) {
            <div 
              class="action-card"
              [style.background]="card.bgColor"
              (click)="navigateToCard(card)"
            >
              <div class="card-icon" [style.color]="card.color">
                <i class="material-icons">{{ card.icon }}</i>
              </div>
              <div class="card-content">
                <h3 class="card-title">{{ card.title }}</h3>
                <p class="card-description">{{ card.description }}</p>
              </div>
              <div class="card-arrow">
                <i class="material-icons">arrow_forward</i>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Recent Activity Section -->
      <section class="recent-activity">
        <h2 class="section-title">Recent Activity</h2>
        
        <div class="activity-list">
          <div class="activity-item">
            <div class="activity-icon">
              <i class="material-icons">chat</i>
            </div>
            <div class="activity-content">
              <div class="activity-title">AI Chatbot Session</div>
              <div class="activity-time">2 hours ago</div>
            </div>
          </div>
          
          <div class="activity-item">
            <div class="activity-icon">
              <i class="material-icons">folder</i>
            </div>
            <div class="activity-content">
              <div class="activity-title">New Resource Added</div>
              <div class="activity-time">5 hours ago</div>
            </div>
          </div>
          
          <div class="activity-item">
            <div class="activity-icon">
              <i class="material-icons">assignment</i>
            </div>
            <div class="activity-content">
              <div class="activity-title">Approval Completed</div>
              <div class="activity-time">1 day ago</div>
            </div>
          </div>
        </div>
      </section>

      <!-- System Status Section -->
      <section class="system-status">
        <h2 class="section-title">System Status</h2>
        
        <div class="status-grid">
          <div class="status-card">
            <div class="status-indicator online"></div>
            <div class="status-content">
              <div class="status-title">AI Chatbot</div>
              <div class="status-value">Online</div>
            </div>
          </div>
          
          <div class="status-card">
            <div class="status-indicator online"></div>
            <div class="status-content">
              <div class="status-title">Database</div>
              <div class="status-value">Connected</div>
            </div>
          </div>
          
          <div class="status-card">
            <div class="status-indicator online"></div>
            <div class="status-content">
              <div class="status-title">API Services</div>
              <div class="status-value">Operational</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 32px;
      max-width: 1400px;
      margin: 0 auto;
      background: #f8f9fa;
      min-height: 100vh;
    }

    /* Header Section */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      gap: 24px;
    }

    .welcome-section {
      flex: 1;
    }

    .welcome-title {
      font-size: 32px;
      font-weight: 700;
      color: #2c3e50;
      margin: 0 0 8px 0;
      line-height: 1.2;
    }

    .welcome-subtitle {
      font-size: 16px;
      color: #6c757d;
      margin: 0;
      line-height: 1.5;
    }

    .user-stats {
      display: flex;
      gap: 16px;
    }

    .stat-card {
      background: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      text-align: center;
      min-width: 100px;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 4px;
      text-transform: capitalize;
    }

    .stat-label {
      font-size: 12px;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Sections */
    .section-title {
      font-size: 24px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0 0 24px 0;
    }

    /* Quick Actions Grid */
    .quick-actions {
      margin-bottom: 48px;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
    }

    .action-card {
      display: flex;
      align-items: center;
      gap: 20px;
      background: white;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid #e9ecef;
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .card-icon i {
      font-size: 28px;
    }

    .card-content {
      flex: 1;
    }

    .card-title {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0 0 4px 0;
    }

    .card-description {
      font-size: 14px;
      color: #6c757d;
      margin: 0;
      line-height: 1.4;
    }

    .card-arrow {
      color: #adb5bd;
      flex-shrink: 0;
    }

    .card-arrow i {
      font-size: 20px;
    }

    /* Recent Activity */
    .recent-activity {
      margin-bottom: 48px;
    }

    .activity-list {
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      border-bottom: 1px solid #f8f9fa;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      background: #e3f2fd;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-icon i {
      font-size: 20px;
      color: #2196f3;
    }

    .activity-content {
      flex: 1;
    }

    .activity-title {
      font-size: 15px;
      font-weight: 500;
      color: #2c3e50;
      margin: 0 0 2px 0;
    }

    .activity-time {
      font-size: 13px;
      color: #6c757d;
    }

    /* System Status */
    .system-status {
      margin-bottom: 32px;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .status-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-indicator.online {
      background: #28a745;
    }

    .status-indicator.offline {
      background: #dc3545;
    }

    .status-indicator.warning {
      background: #ffc107;
    }

    .status-content {
      flex: 1;
    }

    .status-title {
      font-size: 14px;
      font-weight: 500;
      color: #2c3e50;
      margin: 0 0 2px 0;
    }

    .status-value {
      font-size: 12px;
      color: #28a745;
      font-weight: 500;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 20px;
      }

      .dashboard-header {
        flex-direction: column;
        gap: 20px;
      }

      .user-stats {
        align-self: stretch;
        justify-content: center;
      }

      .welcome-title {
        font-size: 24px;
      }

      .cards-grid {
        grid-template-columns: 1fr;
      }

      .action-card {
        padding: 20px;
      }

      .status-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
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
