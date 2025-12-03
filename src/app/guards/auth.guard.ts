import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseAuthService } from '../core/services/supabase-auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(SupabaseAuthService);
  const router = inject(Router);
  return true
  // console.log('Auth guard checking...', state.url);
  
  // // Check if user is authenticated (token exists)
  // const hasToken = authService.isAuthenticatedSync();
  
  // console.log('Has token:', hasToken);
  // console.log('Current user:', authService.currentUser());
  
  // if (hasToken) {
  //   console.log('Auth guard: Access granted');
  //   return true;
  // }

  // // If not authenticated, redirect to login
  // console.log('Auth guard: Access denied, redirecting to login');
  // router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  // return false;
};
