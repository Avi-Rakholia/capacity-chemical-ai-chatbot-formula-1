import { NgModule } from '@angular/core';
import { AuthPagesModule } from '../pages/auth-pages/auth-pages.module';
import { AuthCallbackComponent } from './auth-callback/auth-callback.component';

@NgModule({
  imports: [AuthPagesModule, AuthCallbackComponent],
  exports: [AuthPagesModule, AuthCallbackComponent]
})
export class AuthModule {}
