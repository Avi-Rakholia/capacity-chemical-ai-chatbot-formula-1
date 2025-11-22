import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CreateAccount } from './create-account.component';

@NgModule({
  imports: [
    CreateAccount,
    RouterModule.forChild([{ path: '', component: CreateAccount }])
],
  exports: [CreateAccount]
})
export class CreateAccountModule {}
