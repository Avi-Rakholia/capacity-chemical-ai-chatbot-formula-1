import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import 'bootstrap';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

  // Load saved sidebar color globally BEFORE Angular starts
const savedColor = localStorage.getItem('sidebarColor');
const originalColor = '#e3e3e3';

if (savedColor === 'default') {
  document.documentElement.style.setProperty('--sidebar-bg', originalColor);
}
else if (savedColor) {
  document.documentElement.style.setProperty('--sidebar-bg', savedColor);
}
else {
  // First-time open → use original
  document.documentElement.style.setProperty('--sidebar-bg', originalColor);
}
