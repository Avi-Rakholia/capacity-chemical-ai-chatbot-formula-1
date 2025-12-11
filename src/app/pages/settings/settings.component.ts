import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontService } from 'src/app/core/font.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, NgFor],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {

  /** TRUE ORIGINAL SIDEBAR COLOR OF YOUR WEBSITE */
  originalSidebarColor = '#e3e3e3';

  /** FONT OPTIONS */
  fontFamilies = [
    'Inter', 'Arial', 'Roboto', 'Georgia', 'Courier New',
    'Times New Roman', 'Verdana', 'Tahoma', 'sans-serif'
  ];

  selectedFamily = 'Inter';

  /** DEFAULT VALUES */
  selectedDrawer = 'expand';
  sidebarColor = this.originalSidebarColor;

  constructor(private fontService: FontService) {}

  ngOnInit() {
    const root = getComputedStyle(document.documentElement);

    /** FONT LOADING */
    const savedFamily = root.getPropertyValue('--font-family').trim();
    if (savedFamily) {
      this.selectedFamily = savedFamily.replace(/['"]/g, '');
    }

    /** DRAWER MODE LOADING */
    const savedMode = localStorage.getItem('sidebarMode');
    if (savedMode === 'collapse' || savedMode === 'expand') {
      this.selectedDrawer = savedMode;
    }

    /** SIDEBAR COLOR LOADING */
    const savedColor = localStorage.getItem('sidebarColor');

    if (!savedColor) {
      // First time user → apply original color
      this.sidebarColor = this.originalSidebarColor;
      document.documentElement.style.setProperty('--sidebar-bg', this.originalSidebarColor);
      return;
    }

    if (savedColor === 'default') {
      // “Default” = Always original color
      this.sidebarColor = this.originalSidebarColor;
      document.documentElement.style.setProperty('--sidebar-bg', this.originalSidebarColor);
      return;
    }

    // Custom user-selected color
    this.sidebarColor = savedColor;
    document.documentElement.style.setProperty('--sidebar-bg', savedColor);
  }

  /** FONT UPDATE */
  updateFamily() {
    this.fontService.setFontFamily(this.selectedFamily);
  }

  /** SIDEBAR COLOR CHANGE */
  updateColorPreview(value: string) {
    if (value === 'default') {
      /** Apply original website color */
      this.sidebarColor = this.originalSidebarColor;
      document.documentElement.style.setProperty('--sidebar-bg', this.originalSidebarColor);
      localStorage.setItem('sidebarColor', 'default');
      return;
    }

    /** Apply custom color */
    this.sidebarColor = value;
    document.documentElement.style.setProperty('--sidebar-bg', value);
    localStorage.setItem('sidebarColor', value);
  }

  /** SIDEBAR MODE CHANGE */
  selectDrawer(mode: string, event: any) {
    this.selectedDrawer = mode;

    document.querySelectorAll('.drawer-option')
      .forEach(el => el.classList.remove('selected'));

    (event.target as HTMLElement).classList.add('selected');

    localStorage.setItem('sidebarMode', mode);
  }
}
