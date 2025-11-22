import { NgModule } from '@angular/core';
import { LoginModule } from '../pages/login/login.module';
import { CreateAccountModule } from '../pages/create-account/create-account.module';
import { AuthCallbackComponent } from './auth-callback/auth-callback.component';

@NgModule({
  imports: [LoginModule, CreateAccountModule, AuthCallbackComponent],
  exports: [LoginModule, CreateAccountModule, AuthCallbackComponent]
})
export class AuthModule {}
