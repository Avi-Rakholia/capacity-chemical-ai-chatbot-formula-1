import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  imports: [CommonModule],
  template: `
    <div class="placeholder-container">
      <div class="placeholder-content">
        <div class="placeholder-icon">
          <i class="material-icons">{{ getIcon() }}</i>
        </div>
        <h1 class="placeholder-title">{{ getTitle() }}</h1>
        <p class="placeholder-description">
          This {{ getPageName() }} page is under development. 
          It will be available in a future release.
        </p>
        <div class="placeholder-features">
          <h3>Coming Soon:</h3>
          <ul>
            <li *ngFor="let feature of getFeatures()">{{ feature }}</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .placeholder-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      padding: 40px;
      background: #f8f9fa;
    }

    .placeholder-content {
      text-align: center;
      max-width: 600px;
      background: white;
      padding: 60px 40px;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .placeholder-icon {
      width: 120px;
      height: 120px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .placeholder-icon i {
      font-size: 60px;
      color: white;
    }

    .placeholder-title {
      font-size: 32px;
      font-weight: 700;
      color: #2c3e50;
      margin: 0 0 16px 0;
    }

    .placeholder-description {
      font-size: 18px;
      color: #6c757d;
      margin: 0 0 32px 0;
      line-height: 1.6;
    }

    .placeholder-features {
      text-align: left;
      max-width: 400px;
      margin: 0 auto;
    }

    .placeholder-features h3 {
      font-size: 20px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0 0 16px 0;
      text-align: center;
    }

    .placeholder-features ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .placeholder-features li {
      padding: 8px 0;
      font-size: 16px;
      color: #495057;
      position: relative;
      padding-left: 24px;
    }

    .placeholder-features li:before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #28a745;
      font-weight: bold;
    }

    @media (max-width: 768px) {
      .placeholder-container {
        padding: 20px;
        min-height: 70vh;
      }

      .placeholder-content {
        padding: 40px 24px;
      }

      .placeholder-title {
        font-size: 24px;
      }

      .placeholder-description {
        font-size: 16px;
      }

      .placeholder-icon {
        width: 80px;
        height: 80px;
      }

      .placeholder-icon i {
        font-size: 40px;
      }
    }
  `]
})
export class PlaceholderComponent implements OnInit {
  private currentRoute: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.currentRoute = this.route.snapshot.url.join('/');
  }

  getPageName(): string {
    const routeMap: { [key: string]: string } = {
      'chatbot': 'AI Chatbot',
      'resources': 'Resources',
      'approvals': 'Approvals',
      'settings': 'Settings',
      'users': 'User Management',
      'analytics': 'Analytics'
    };

    for (const [route, name] of Object.entries(routeMap)) {
      if (this.currentRoute.includes(route)) {
        return name;
      }
    }

    return 'Page';
  }

  getTitle(): string {
    return this.getPageName();
  }

  getIcon(): string {
    const iconMap: { [key: string]: string } = {
      'chatbot': 'chat',
      'resources': 'folder',
      'approvals': 'assignment',
      'settings': 'settings',
      'users': 'group',
      'analytics': 'analytics'
    };

    for (const [route, icon] of Object.entries(iconMap)) {
      if (this.currentRoute.includes(route)) {
        return icon;
      }
    }

    return 'construction';
  }

  getFeatures(): string[] {
    const featureMap: { [key: string]: string[] } = {
      'chatbot': [
        'AI-powered chemical assistant',
        'Natural language processing',
        'Chemical formula recognition',
        'Real-time conversation',
        'Historical chat sessions'
      ],
      'resources': [
        'Chemical database access',
        'Safety data sheets',
        'Research papers repository',
        'Formula calculator',
        'Search and filtering'
      ],
      'approvals': [
        'Request management system',
        'Approval workflow',
        'Status tracking',
        'Email notifications',
        'Document attachments'
      ],
      'settings': [
        'User preferences',
        'Account settings',
        'Privacy controls',
        'Notification settings',
        'Theme customization'
      ],
      'users': [
        'User account management',
        'Role assignment',
        'Permissions control',
        'Activity monitoring',
        'Bulk operations'
      ],
      'analytics': [
        'Usage statistics',
        'Performance metrics',
        'User engagement data',
        'Custom reports',
        'Data visualization'
      ]
    };

    for (const [route, features] of Object.entries(featureMap)) {
      if (this.currentRoute.includes(route)) {
        return features;
      }
    }

    return ['Advanced functionality', 'User-friendly interface', 'Responsive design'];
  }
}
