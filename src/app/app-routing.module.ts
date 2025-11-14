import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPath } from './shared/path-enums/login-path';


export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: LoginPath.login
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {})],
    exports: [RouterModule]
})

export class AppRoutingModule { }