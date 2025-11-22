import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPath } from './shared/path-enums/login-path';
import { CreateAccountPath } from './shared/path-enums/create-account-path';
import { AuthCallbackComponent } from './auth/auth-callback/auth-callback.component';
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
        loadChildren: () => import('./pages/login/login.module').then(m => m.LoginModule)
    },
    {
        path: CreateAccountPath.createAccount,
        pathMatch: 'full',
        loadChildren: () => import('./pages/create-account/create-account.module').then(m => m.CreateAccountModule)
    },
    {
        path: 'auth/callback',
        component: AuthCallbackComponent
    },
    {
        path: 'home',
        canActivate: [authGuard],
        loadChildren: () => import('./pages/side-bar/side-bar.module').then(m => m.SideBarModule)
    },
    {
        path: 'dashboard',
        redirectTo: '/home/dashboard',
        pathMatch: 'full'
    },
    {
        path: 'setup-guide',
        loadChildren: () => import('./pages/setup-guide/setup-guide.module').then(m => m.SetupGuideModule)
    },
    {
        path: 'admin',
        canActivate: [roleGuard(['nsight', 'capacity'])],
        loadChildren: () => import('./pages/side-bar/side-bar.module').then(m => m.SideBarModule)
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