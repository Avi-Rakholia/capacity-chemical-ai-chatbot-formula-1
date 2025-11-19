import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPath } from './shared/path-enums/login-path';
import { CreateAccountPath } from './shared/path-enums/create-account-path';
import { LoginComponent } from './pages/login/login.component';
import { CreateAccount } from './pages/create-account/create-account.component';
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';


export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard]
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
        path: 'auth/callback',
        component: AuthCallbackComponent
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard]
    },
    {
        path: 'setup-guide',
        loadComponent: () => import('./pages/setup-guide/setup-guide.component').then(m => m.SetupGuideComponent)
    },
    {
        path: 'admin',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [roleGuard(['nsight', 'capacity'])]
    },
    {
        path: '**',
        redirectTo: '/login'
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {})],
    exports: [RouterModule]
})

export class AppRoutingModule { }