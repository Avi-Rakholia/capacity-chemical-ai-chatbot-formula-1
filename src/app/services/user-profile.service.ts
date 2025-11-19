import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService, AuthUser } from './supabase.service';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'nsight' | 'capacity' | 'user';
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private supabaseService = inject(SupabaseService);
  
  private userProfile = signal<UserProfile | null>(null);
  public userProfile$ = this.userProfile.asReadonly();

  constructor() {
    // Listen to auth state changes and update profile
    this.supabaseService.currentUser$.subscribe(user => {
      if (user) {
        this.loadUserProfile(user);
      } else {
        this.userProfile.set(null);
      }
    });
  }

  private async loadUserProfile(user: AuthUser): Promise<void> {
    try {
      const supabase = this.supabaseService.getSupabaseClient();
      
      // Try to get profile from database first
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        this.userProfile.set({
          ...profile,
          createdAt: new Date(profile.created_at),
          updatedAt: new Date(profile.updated_at)
        });
      } else {
        // Create profile from auth metadata if not exists
        await this.createUserProfile(user);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      
      // Fallback to auth metadata
      this.userProfile.set({
        id: user.id,
        username: user.metadata?.username || '',
        email: user.email || '',
        role: user.role || 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  private async createUserProfile(user: AuthUser): Promise<void> {
    try {
      const supabase = this.supabaseService.getSupabaseClient();
      
      const newProfile = {
        id: user.id,
        username: user.metadata?.username || '',
        email: user.email || '',
        role: user.role || 'user',
        first_name: user.metadata?.firstName || '',
        last_name: user.metadata?.lastName || '',
        avatar: user.metadata?.avatar || ''
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single();

      if (data) {
        this.userProfile.set({
          ...data,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        });
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
    try {
      const currentProfile = this.userProfile();
      if (!currentProfile) {
        return { success: false, error: 'No profile found' };
      }

      const supabase = this.supabaseService.getSupabaseClient();
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          username: updates.username,
          first_name: updates.firstName,
          last_name: updates.lastName,
          avatar: updates.avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentProfile.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      if (data) {
        this.userProfile.set({
          ...data,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  getCurrentProfile(): UserProfile | null {
    return this.userProfile();
  }
}
