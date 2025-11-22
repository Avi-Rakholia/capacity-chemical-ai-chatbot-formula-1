import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SideBarComponent } from './side-bar.component';

@NgModule({
  imports: [
    SideBarComponent,
    RouterModule.forChild([
      {
        path: '',
        component: SideBarComponent,
        children: [
          {
            path: 'dashboard',
            loadChildren: () => import('../dashboard/dashboard.module').then(m => m.DashboardModule)
          },
          {
            path: 'chatbot',
            loadComponent: () => import('../../shared/components/placeholder.component').then(m => m.PlaceholderComponent)
          },
          {
            path: 'resources',
            loadComponent: () => import('../../shared/components/placeholder.component').then(m => m.PlaceholderComponent)
          },
          {
            path: 'approvals',
            loadComponent: () => import('../../shared/components/placeholder.component').then(m => m.PlaceholderComponent)
          },
          {
            path: 'settings',
            loadComponent: () => import('../../shared/components/placeholder.component').then(m => m.PlaceholderComponent)
          },
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          }
        ]
      }
    ])
  ],
  exports: [SideBarComponent]
})
export class SideBarModule {}
