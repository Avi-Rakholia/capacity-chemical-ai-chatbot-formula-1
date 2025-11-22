import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { filter, take, switchMap, timeout, catchError } from 'rxjs/operators';
import { SupabaseService, AuthUser } from '../services/supabase.service';
import { AuthInitService } from '../services/auth-init.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const supabaseService = inject(SupabaseService);
    const authInitService = inject(AuthInitService);
    const router = inject(Router);

    // Wait for auth to be initialized, then check user role
    return authInitService.initialized$.pipe(
      filter(initialized => initialized), // Wait until initialized
      take(1), // Take only the first emission
      switchMap(() => {
        // Now check if user has the required role
        const currentUser = supabaseService.getCurrentUser();
        if (currentUser) {
          if (currentUser.role && allowedRoles.includes(currentUser.role)) {
            return of(true);
          } else {
            router.navigate(['/dashboard']);
            return of(false);
          }
        }
        
        // If no current user, check session one more time
        return new Observable<boolean>(subscriber => {
          supabaseService.getSession().then(session => {
            if (session?.user) {
              const userRole = session.user.user_metadata?.['role'] || 'user';
              if (allowedRoles.includes(userRole)) {
                subscriber.next(true);
              } else {
                router.navigate(['/dashboard']);
                subscriber.next(false);
              }
            } else {
              router.navigate(['/login']);
              subscriber.next(false);
            }
            subscriber.complete();
          }).catch(error => {
            console.error('Role guard session check error:', error);
            router.navigate(['/login']);
            subscriber.next(false);
            subscriber.complete();
          });
        });
      }),
      timeout(5000),
      catchError(error => {
        console.error('Role guard timeout or error:', error);
        router.navigate(['/login']);
        return of(false);
      })
    );
  };
};
