import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DashboardComponent } from '../home/home.component';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { ChatbotComponent } from '../chatbot/chatbot.component';
import { ResourcesComponent } from '../resources/resources.component';
import { ApprovalsComponent } from '../approvals/approvals.component';
import { Users } from '../users/users';
import { AnalyticsComponent } from '../analytics/analytics.component';

const routes: Routes = [
  {
    path: '',
    component: SideBarComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'chatbot', component: ChatbotComponent },
      { path: 'resources', component: ResourcesComponent },
      { path: 'approvals', component: ApprovalsComponent },
      { path: 'analytics', component: AnalyticsComponent},
      { path: 'users', component: Users },

      {
        path: 'settings',
        loadComponent: () =>
          import('../../shared/components/placeholder.component')
            .then(m => m.PlaceholderComponent)
      },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,      // Needed for *ngIf *ngFor
    FormsModule,       // Needed for [(ngModel)]
    SideBarComponent,  // Standalone
    DashboardComponent,
    ChatbotComponent,
    ResourcesComponent,
    ApprovalsComponent,
    Users,
    AnalyticsComponent, // Standalone
    RouterModule.forChild(routes)
  ]
})
export class MainPagesModule { }
