import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SupabaseService } from './core/services/supabase.service';
import { AuthInitService } from './core/services/auth-init.service';
import { LoadingComponent } from './shared/components/loading.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoadingComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('capacity-chemical-ai-chatbot-formula');
  
  private supabaseService = inject(SupabaseService);
  private authInitService = inject(AuthInitService);
  
  authInitialized = signal(false);

  ngOnInit() {
    // Subscribe to auth initialization status
    this.authInitService.initialized$.subscribe(initialized => {
      this.authInitialized.set(initialized);
    });
  }
}