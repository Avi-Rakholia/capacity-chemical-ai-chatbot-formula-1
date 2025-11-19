import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPath } from './shared/path-enums/login-path';
import { CreateAccountPath } from './shared/path-enums/create-account-path';
import { LoginComponent } from './pages/login/login.component';
import { CreateAccount } from './pages/create-account/create-account.component';


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
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {})],
    exports: [RouterModule]
})

export class AppRoutingModule { }