import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthInitService {
  private supabaseService = inject(SupabaseService);
  private initialized = new BehaviorSubject<boolean>(false);
  
  public initialized$ = this.initialized.asObservable();

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Wait for Supabase session to be checked
      await this.supabaseService.getSession();
      
      // Small delay to ensure everything is properly initialized
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.initialized.next(true);
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Even on error, mark as initialized to prevent infinite loading
      this.initialized.next(true);
    }
  }

  isInitialized(): boolean {
    return this.initialized.value;
  }
}
