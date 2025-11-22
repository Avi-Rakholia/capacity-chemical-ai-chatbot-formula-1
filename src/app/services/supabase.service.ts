import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient, AuthError, User, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthUser {
  id: string;
  email?: string;
  role?: 'nsight' | 'capacity' | 'user';
  metadata?: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  username: string;
  role: 'nsight' | 'capacity' | 'user';
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  private sessionSubject = new BehaviorSubject<Session | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public session$ = this.sessionSubject.asObservable();

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );

    // Initialize by getting the current session
    this.initializeSession();

    // Listen to auth state changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.sessionSubject.next(session);
      
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata?.['role'] || 'user',
          metadata: session.user.user_metadata
        };
        this.currentUserSubject.next(authUser);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  /**
   * Initialize the session on service creation
   */
  private async initializeSession(): Promise<void> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata?.['role'] || 'user',
          metadata: session.user.user_metadata
        };
        this.currentUserSubject.next(authUser);
        this.sessionSubject.next(session);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  }

  /**
   * Sign up a new user
   */
  async signUp(credentials: SignUpCredentials): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await this.supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          username: credentials.username,
          role: credentials.role,
          display_name: credentials.username
        }
      }
    });

    return { user: data.user, error };
  }

  /**
   * Sign in a user with email and password
   */
  async signIn(credentials: LoginCredentials): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    return { user: data.user, error };
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithOAuth(provider: 'azure' | 'github' | 'google'): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    return { error };
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.auth.signOut();
    return { error };
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    return { error };
  }

  /**
   * Update user password
   */
  async updatePassword(password: string): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await this.supabase.auth.updateUser({
      password
    });

    return { user: data.user, error };
  }

  /**
   * Update user metadata
   */
  async updateUserMetadata(metadata: any): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await this.supabase.auth.updateUser({
      data: metadata
    });

    return { user: data.user, error };
  }

  /**
   * Get Supabase client instance (for advanced usage)
   */
  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }
}
