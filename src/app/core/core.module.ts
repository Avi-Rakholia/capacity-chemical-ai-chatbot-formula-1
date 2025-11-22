import { NgModule, Optional, SkipSelf } from '@angular/core';
import { SupabaseService } from './services/supabase.service';
import { AuthInitService } from './services/auth-init.service';
import { UserProfileService } from './services/user-profile.service';

@NgModule({
  providers: [SupabaseService, AuthInitService, UserProfileService]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only.');
    }
  }
}
