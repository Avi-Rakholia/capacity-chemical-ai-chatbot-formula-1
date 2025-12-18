import { Injectable } from '@angular/core';
 
@Injectable({ providedIn: 'root' })
export class FontService {
  private sizeKey = 'app-font-size';
  private familyKey = 'app-font-family';
 
  constructor() {
    this.applySavedSettings();
  }
 
  setFontSize(size: string) {
    document.documentElement.style.setProperty('--font-size', size);
    localStorage.setItem(this.sizeKey, size);
  }
 
  setFontFamily(family: string) {
    document.documentElement.style.setProperty('--font-family', family);
    localStorage.setItem(this.familyKey, family);
  }
 
  applySavedSettings() {
    const savedSize = localStorage.getItem(this.sizeKey);
    const savedFamily = localStorage.getItem(this.familyKey);
 
    if (savedSize) {
      this.setFontSize(savedSize);
    }
 
    if (savedFamily) {
      this.setFontFamily(savedFamily);
    }
  }
}
 