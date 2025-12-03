import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseAuthService } from '../core/services/supabase-auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(SupabaseAuthService);
    const router = inject(Router);
    // TODO
    return true
    // Check if user is authenticated (token exists)
    const hasToken = authService.isAuthenticatedSync();
    
    if (!hasToken) {
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Check if user has the required role
    const currentUser = authService.currentUser();
    if (!currentUser?.role) {
      router.navigate(['/home/dashboard']);
      return false;
    }

    const userRole = currentUser.role.toLowerCase();
    const hasRole = allowedRoles.some(role => role.toLowerCase() === userRole);

    if (!hasRole) {
      router.navigate(['/home/dashboard']);
      return false;
    }

    return true;
  };
};
