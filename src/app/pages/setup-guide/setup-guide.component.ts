import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-setup-guide',
  imports: [CommonModule],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="card">
            <div class="card-body">
              <h1 class="card-title text-center mb-4">Supabase Setup Guide</h1>
              
              <div class="alert alert-info" role="alert">
                <strong>Important:</strong> You need to configure your Supabase project credentials to use authentication.
              </div>

              <h3>1. Create a Supabase Project</h3>
              <ol>
                <li>Go to <a href="https://supabase.com" target="_blank">supabase.com</a></li>
                <li>Create a new project</li>
                <li>Wait for the project to be set up</li>
              </ol>

              <h3>2. Get Your Project Credentials</h3>
              <ol>
                <li>Go to your project dashboard</li>
                <li>Navigate to Settings → API</li>
                <li>Copy your Project URL and anon public key</li>
              </ol>

              <h3>3. Update Environment Files</h3>
              <p>Update the following files with your Supabase credentials:</p>
              <ul>
                <li><code>src/environments/environment.ts</code></li>
                <li><code>src/environments/environment.prod.ts</code></li>
              </ul>

              <div class="bg-light p-3 rounded mt-3 mb-3">
                <pre><code>export const environment = {{ '{' }}
  production: false, // true for prod
  supabase: {{ '{' }}
    url: 'YOUR_SUPABASE_PROJECT_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
  {{ '}' }},
{{ '}' }};</code></pre>
              </div>

              <h3>4. Configure Authentication (Optional)</h3>
              <ul>
                <li><strong>Email/Password:</strong> Already enabled by default</li>
                <li><strong>Microsoft OAuth:</strong> Configure in Authentication → Providers</li>
                <li><strong>Email Templates:</strong> Customize in Authentication → Templates</li>
              </ul>

              <h3>5. Set Up Database (Optional)</h3>
              <p>Create additional tables for user profiles, roles, etc.</p>

              <div class="alert alert-success mt-4" role="alert">
                <strong>Ready to go!</strong> Once configured, your authentication system will be fully functional.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SetupGuideComponent {}
