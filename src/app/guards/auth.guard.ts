import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { filter, take, switchMap, timeout, catchError } from 'rxjs/operators';
import { SupabaseService } from '../core/services/supabase.service';
import { AuthInitService } from '../core/services/auth-init.service';

export const authGuard: CanActivateFn = (route, state) => {
  const supabaseService = inject(SupabaseService);
  const authInitService = inject(AuthInitService);
  const router = inject(Router);

  // Wait for auth to be initialized, then check user status
  return authInitService.initialized$.pipe(
    filter(initialized => initialized), // Wait until initialized
    take(1), // Take only the first emission
    switchMap(() => {
      // Now check if user is authenticated
      const currentUser = supabaseService.getCurrentUser();
      if (currentUser) {
        return of(true);
      }
      
      // If no current user, check session one more time
      return new Observable<boolean>(subscriber => {
        supabaseService.getSession().then(session => {
          if (session?.user) {
            subscriber.next(true);
          } else {
            router.navigate(['/login']);
            subscriber.next(false);
          }
          subscriber.complete();
        }).catch(error => {
          console.error('Auth guard session check error:', error);
          router.navigate(['/login']);
          subscriber.next(false);
          subscriber.complete();
        });
      });
    }),
    timeout(5000), // 5 second timeout
    catchError(error => {
      console.error('Auth guard timeout or error:', error);
      router.navigate(['/login']);
      return of(false);
    })
  );
};
