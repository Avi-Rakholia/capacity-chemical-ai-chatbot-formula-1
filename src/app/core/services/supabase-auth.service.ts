import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  metadata?: any;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: AuthUser;
    session: {
      access_token: string;
      refresh_token: string;
    };
    access_token?: string;
  };
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseAuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private apiUrl = 'http://localhost:3001/auth/supabase';
  
  // Signals for reactive state management
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  
  currentUser = signal<AuthUser | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => {
    const role = this.currentUser()?.role?.toLowerCase();
    return role === 'admin';
  });
  isSupervisor = computed(() => {
    const role = this.currentUser()?.role?.toLowerCase();
    return role === 'admin' || role === 'supervisor';
  });

  constructor() {
    this.loadUserFromStorage();
  }

  /**
   * Register a new user
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.handleAuthSuccess(response.data);
        }
      })
    );
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.handleAuthSuccess(response.data);
        }
      })
    );
  }

  /**
   * Sign in (alias for login) - Promise-based for component compatibility
   */
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: any }> {
    try {
      const response = await this.login({ email, password }).toPromise();
      if (response?.success && response.data) {
        return { user: response.data.user, error: null };
      }
      return { user: null, error: { message: response?.error || 'Login failed' } };
    } catch (error: any) {
      return { user: null, error: { message: error.error?.error || 'Login failed' } };
    }
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithOAuth(provider: 'azure' | 'google' | 'github'): Promise<{ error: any }> {
    // For OAuth, we'll redirect to the provider
    // In a real implementation, this would open the OAuth flow
    window.location.href = `${this.apiUrl}/oauth/${provider}`;
    return { error: null };
  }

  /**
   * Logout user
   */
  logout(): Observable<AuthResponse> {
    const token = this.getAccessToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/logout`, {}, { headers }).pipe(
      tap(() => {
        this.clearAuth();
        this.router.navigate(['/login']);
      })
    );
  }

  /**
   * Get current user from server
   */
  getCurrentUser(): Observable<any> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }

    return this.http.get<any>(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.currentUser.set({
            id: response.data.id,
            email: response.data.email,
            name: response.data.metadata?.name,
            role: response.data.metadata?.role,
            metadata: response.data.metadata
          });
          this.currentUserSubject.next(this.currentUser());
        }
      })
    );
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {
      refresh_token: refreshToken
    }).pipe(
      tap(response => {
        if (response.success && response.data?.session) {
          this.setAccessToken(response.data.session.access_token);
          if (response.data.session.refresh_token) {
            this.setRefreshToken(response.data.session.refresh_token);
          }
        }
      })
    );
  }

  /**
   * Request password reset
   */
  requestPasswordReset(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/reset-password`, { email });
  }

  /**
   * Update password
   */
  updatePassword(password: string): Observable<AuthResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }

    return this.http.put<AuthResponse>(
      `${this.apiUrl}/update-password`,
      { password },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  /**
   * Get access token from storage
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Get refresh token from storage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticatedSync(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(data: any): void {
    if (data.access_token || data.session?.access_token) {
      const accessToken = data.access_token || data.session.access_token;
      const refreshToken = data.session?.refresh_token;

      this.setAccessToken(accessToken);
      if (refreshToken) {
        this.setRefreshToken(refreshToken);
      }

      // Set user data
      if (data.user) {
        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.user_metadata?.display_name,
          role: data.user.user_metadata?.role,
          metadata: data.user.user_metadata
        };
        this.currentUser.set(user);
        this.currentUserSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
      }
    }
  }

  /**
   * Set access token in storage
   */
  private setAccessToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  /**
   * Set refresh token in storage
   */
  private setRefreshToken(token: string): void {
    localStorage.setItem('refresh_token', token);
  }

  /**
   * Clear authentication data
   */
  private clearAuth(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.currentUserSubject.next(null);
  }

  /**
   * Load user from storage on init
   */
  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    const token = this.getAccessToken();

    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        this.currentUser.set(user);
        this.currentUserSubject.next(user);
        
        // Optionally verify token is still valid
        this.getCurrentUser().subscribe({
          error: () => this.clearAuth()
        });
      } catch (error) {
        this.clearAuth();
      }
    }
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const userRole = this.currentUser()?.role?.toLowerCase();
    return userRole === role.toLowerCase();
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const userRole = this.currentUser()?.role?.toLowerCase();
    return roles.some(role => role.toLowerCase() === userRole);
  }
}
