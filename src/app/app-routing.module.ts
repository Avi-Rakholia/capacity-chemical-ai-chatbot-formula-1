import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginPath } from './shared/path-enums/login-path';
import { CreateAccountPath } from './shared/path-enums/create-account-path';

import { LoginComponent } from './pages/login/login.component';
import { CreateAccount } from './pages/create-account/create-account.component';
import { PendingApprovalsComponent } from './pages/pending-approval/pending-approvals.component';
import { ResourcesComponent } from './pages/resources/resources.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';   // ⭐ NEW IMPORT


export const routes: Routes = [

  {
    path: '',
    pathMatch: 'full',
    redirectTo: LoginPath.login
  },

  {
    path: LoginPath.login,
    pathMatch: 'full',
    component: LoginComponent
  },

  {
    path: CreateAccountPath.createAccount,
    pathMatch: 'full',
    component: CreateAccount
  },

  {
    path: 'pending-approval',
    pathMatch: 'full',
    component: PendingApprovalsComponent
  },

  {
    path: 'resources',
    pathMatch: 'full',
    component: ResourcesComponent
  },

  {
    path: 'analytics',            // ⭐ NEW ROUTE
    pathMatch: 'full',
    component: AnalyticsComponent
  }
  

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
