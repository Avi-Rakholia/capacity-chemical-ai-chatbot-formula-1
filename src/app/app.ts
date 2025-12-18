import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SupabaseService } from './core/services/supabase.service';
import { AuthInitService } from './core/services/auth-init.service';
import { LoadingComponent } from './shared/components/loading.component';
import { FontService } from './core/font.service';
 
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
 
  protected readonly title = signal('capacity-chemical-ai-chatbot-formula');
 
  // Using Angular inject() API
  private supabaseService = inject(SupabaseService);
  private authInitService = inject(AuthInitService);
  private fontService = inject(FontService);
 
  authInitialized = signal(false);
 
  constructor() {
    // ThemeService constructor automatically calls loadTheme()
    // No extra work needed here
  }
 
  ngOnInit() {
    this.authInitService.initialized$.subscribe(initialized => {
      this.authInitialized.set(initialized);
    });
  }
}
 
 