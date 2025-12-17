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
  // MySQL user data
  user_id?: number;
  username?: string;
  role_id?: number;
  role_name?: string;
  permissions?: any;
  status?: string;
  last_login?: string;
  created_on?: string;
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
    userData?: any; // Complete MySQL user data
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
  isCapacityAdmin = computed(() => {
    const role = this.currentUser()?.role_name?.toLowerCase() || this.currentUser()?.role?.toLowerCase();
    return role === 'capacity_admin' || role === 'capacity admin';
  });
  isNsightAdmin = computed(() => {
    const role = this.currentUser()?.role_name?.toLowerCase() || this.currentUser()?.role?.toLowerCase();
    return role === 'nsight_admin' || role === 'nsight admin';
  });
  isAdmin = computed(() => this.isCapacityAdmin() || this.isNsightAdmin());
  isUser = computed(() => {
    const role = this.currentUser()?.role_name?.toLowerCase() || this.currentUser()?.role?.toLowerCase();
    return role === 'user';
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
          const userData = response.data.userData; // MySQL user data
          
          const user: AuthUser = {
            id: response.data.id,
            email: response.data.email,
            name: response.data.metadata?.name,
            role: response.data.metadata?.role || response.data.role,
            metadata: response.data.metadata,
            
            // MySQL user data
            user_id: userData?.user_id,
            username: userData?.username,
            role_id: userData?.role_id,
            role_name: userData?.role_name,
            permissions: userData?.permissions,
            status: userData?.status,
            last_login: userData?.last_login,
            created_on: userData?.created_on
          };
          
          this.currentUser.set(user);
          this.currentUserSubject.next(user);
          localStorage.setItem('user', JSON.stringify(user));
          
          if (userData) {
            localStorage.setItem('user_data', JSON.stringify(userData));
          }
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
    console.log('✅ handleAuthSuccess called with data:', data);
    
    if (data.access_token || data.session?.access_token) {
      const accessToken = data.access_token || data.session.access_token;
      const refreshToken = data.session?.refresh_token;

      console.log('💾 Storing access token');
      this.setAccessToken(accessToken);
      if (refreshToken) {
        console.log('💾 Storing refresh token');
        this.setRefreshToken(refreshToken);
      }

      // Set user data - prioritize MySQL userData
      if (data.user) {
        const userData = data.userData; // MySQL user data
        
        console.log('📦 Received userData from backend:', userData);
        
        if (!userData) {
          console.error('❌ ERROR: userData is missing from backend response!');
          console.error('Backend response data:', data);
        }
        
        if (!userData?.user_id) {
          console.error('❌ ERROR: user_id is missing from userData!');
          console.error('userData object:', userData);
        }
        
        const user: AuthUser = {
          // Supabase user data
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.user_metadata?.display_name || data.user.name,
          role: data.user.user_metadata?.role || data.user.role,
          metadata: data.user.user_metadata || data.user.metadata,
          
          // MySQL user data (for all operations)
          user_id: userData?.user_id,
          username: userData?.username,
          role_id: userData?.role_id,
          role_name: userData?.role_name,
          permissions: userData?.permissions,
          status: userData?.status,
          last_login: userData?.last_login,
          created_on: userData?.created_on
        };
        
        console.log('👤 Setting complete user data:', user);
        console.log('🔑 MySQL user_id for operations:', user.user_id);
        
        if (!user.user_id) {
          console.error('❌ CRITICAL: Final user object has no user_id!');
        }
        
        this.currentUser.set(user);
        this.currentUserSubject.next(user);
        
        // Store both Supabase and MySQL data
        localStorage.setItem('user', JSON.stringify(user));
        
        // Store MySQL user data separately for easy access
        if (userData) {
          localStorage.setItem('user_data', JSON.stringify(userData));
          console.log('💾 Stored MySQL user data separately:', userData);
        } else {
          console.error('❌ ERROR: Cannot store user_data - userData is null/undefined!');
        }
      } else {
        console.error('❌ ERROR: data.user is missing!');
      }
    } else {
      console.warn('⚠️ No access token found in auth response');
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
    // localStorage.removeItem('access_token');
    // localStorage.removeItem('refresh_token');
    // localStorage.removeItem('user');
    // this.currentUser.set(null);
    // this.currentUserSubject.next(null);
  }

  /**
   * Load user from storage on init
   */
  private loadUserFromStorage(): void {
    console.log('Loading user from storage...');
    const userStr = localStorage.getItem('user');
    const token = this.getAccessToken();

    console.log('User string from storage:', userStr);
    console.log('Token from storage:', token ? 'exists' : 'not found');

    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        console.log('Parsed user:', user);
        this.currentUser.set(user);
        this.currentUserSubject.next(user);
        
        // Optionally verify token is still valid
        this.getCurrentUser().subscribe({
          next: (response) => {
            console.log('Token verification successful:', response);
          },
          error: (error) => {
            console.error('Token verification failed:', error);
            this.clearAuth();
          }
        });
      } catch (error) {
        console.error('Error parsing user from storage:', error);
        this.clearAuth();
      }
    } else {
      console.log('No user or token found in storage');
    }
  }

  /**
   * Check if user has specific role
   * Supports: capacity_admin, nsight_admin, user
   */
  hasRole(role: string): boolean {
    const user = this.currentUser();
    const userRole = (user?.role_name || user?.role)?.toLowerCase().replace(/\s+/g, '_');
    const checkRole = role.toLowerCase().replace(/\s+/g, '_');
    return userRole === checkRole;
  }

  /**
   * Check if user has any of the specified roles
   * Supports: capacity_admin, nsight_admin, user
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUser();
    const userRole = (user?.role_name || user?.role)?.toLowerCase().replace(/\s+/g, '_');
    return roles.some(role => role.toLowerCase().replace(/\s+/g, '_') === userRole);
  }

  /**
   * Get MySQL user_id for database operations
   * This is the primary key used in all backend operations
   */
  getUserId(): number | undefined {
    const user = this.currentUser();
    console.log('🔍 getUserId() called - Current user:', user);
    console.log('🔍 user_id value:', user?.user_id);
    
    if (!user) {
      console.warn('⚠️ No current user found');
      return undefined;
    }
    
    if (!user.user_id) {
      console.warn('⚠️ Current user has no user_id. User object:', user);
      console.warn('⚠️ Checking localStorage...');
      const storedUser = localStorage.getItem('user');
      const storedUserData = localStorage.getItem('user_data');
      console.warn('Stored user:', storedUser);
      console.warn('Stored user_data:', storedUserData);
    }
    
    return user?.user_id;
  }

  /**
   * Get complete MySQL user data
   */
  getUserData(): any {
    const userStr = localStorage.getItem('user_data');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    return null;
  }

  /**
   * Get role_id for role-based operations
   */
  getRoleId(): number | undefined {
    return this.currentUser()?.role_id;
  }

  /**
   * Get user permissions
   */
  getPermissions(): any {
    return this.currentUser()?.permissions || {};
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const permissions = this.getPermissions();
    return permissions && permissions[permission] === true;
  }
}
