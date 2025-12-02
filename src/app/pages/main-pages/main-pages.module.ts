import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from '../home/home.component';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { ChatbotComponent } from '../chatbot/chatbot.component';
import { ResourcesComponent } from '../resources/resources.component';
import { ApprovalsComponent } from '../approvals/approvals.component';
import { SettingsComponent } from '../settings/settings.component';
import { Users } from '../users/users';

const routes: Routes = [
  {
    path: '',
    component: SideBarComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'chatbot',
        component: ChatbotComponent
        // loadComponent: () => import('../../shared/components/placeholder.component').then(m => m.PlaceholderComponent)
      },
      {
        path: 'resources',
        component: ResourcesComponent
        // loadComponent: () => import('../../shared/components/placeholder.component').then(m => m.PlaceholderComponent)
      },
      {
        path: 'approvals',
        component: ApprovalsComponent
        // loadComponent: () => import('../../shared/components/placeholder.component').then(m => m.PlaceholderComponent)
      },
      {
        path: 'users',
        component: Users,
      },
      {
        path: 'settings',
        // component: SettingsComponent
        loadComponent: () => import('../../shared/components/placeholder.component').then(m => m.PlaceholderComponent)
      }
    ]
  }
];

@NgModule({
  imports: [
    DashboardComponent,
    SideBarComponent,
    ChatbotComponent,
    ResourcesComponent,
    ApprovalsComponent,
    SettingsComponent,
    RouterModule.forChild(routes)
  ],
  exports: [DashboardComponent, SideBarComponent]
})
export class MainPagesModule {}
