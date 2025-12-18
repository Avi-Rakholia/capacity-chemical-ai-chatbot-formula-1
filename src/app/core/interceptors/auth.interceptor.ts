import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SupabaseAuthService } from '../services/supabase-auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(SupabaseAuthService);
  const token = authService.getAccessToken();

  // Skip auth for auth endpoints
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  // Add token to request if available
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      // If 401 error, try to refresh token
      if (error.status === 401 && !req.url.includes('/refresh')) {
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Retry the request with new token
            const newToken = authService.getAccessToken();
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // If refresh fails, logout user
            authService.logout().subscribe();
            return throwError(() => refreshError);
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};
