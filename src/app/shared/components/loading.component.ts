import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  imports: [CommonModule],
  template: `
    <div class="loading-container d-flex justify-content-center align-items-center min-vh-100">
      <div class="text-center">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Checking authentication...</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      background-color: #f8f9fa;
    }
  `]
})
export class LoadingComponent {}
