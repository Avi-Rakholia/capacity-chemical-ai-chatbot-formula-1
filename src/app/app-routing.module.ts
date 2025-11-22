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
        redirectTo: '/home/dashboard'
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
        path: 'home',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
        canActivate: [authGuard],
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'chatbot',
                loadComponent: () => import('./shared/components/placeholder.component').then(m => m.PlaceholderComponent)
            },
            {
                path: 'resources',
                loadComponent: () => import('./shared/components/placeholder.component').then(m => m.PlaceholderComponent)
            },
            {
                path: 'approvals',
                loadComponent: () => import('./shared/components/placeholder.component').then(m => m.PlaceholderComponent)
            },
            {
                path: 'settings',
                loadComponent: () => import('./shared/components/placeholder.component').then(m => m.PlaceholderComponent)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: 'dashboard',
        redirectTo: '/home/dashboard',
        pathMatch: 'full'
    },
    {
        path: 'setup-guide',
        loadComponent: () => import('./pages/setup-guide/setup-guide.component').then(m => m.SetupGuideComponent)
    },
    {
        path: 'admin',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
        canActivate: [roleGuard(['nsight', 'capacity'])],
        children: [
            {
                path: 'users',
                loadComponent: () => import('./shared/components/placeholder.component').then(m => m.PlaceholderComponent)
            },
            {
                path: 'analytics',
                loadComponent: () => import('./shared/components/placeholder.component').then(m => m.PlaceholderComponent)
            },
            {
                path: '',
                redirectTo: 'users',
                pathMatch: 'full'
            }
        ]
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