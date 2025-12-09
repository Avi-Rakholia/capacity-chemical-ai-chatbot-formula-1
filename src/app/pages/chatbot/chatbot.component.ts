import { 
  Component, 
  ChangeDetectionStrategy, 
  ChangeDetectorRef,
  ViewChild,
  ElementRef, 
  HostListener            // ✅ Added
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatbotComponent {

  messages: string[] = [];
  userMessage: string = '';
  menuOpen: boolean = false;

  constructor(private cdr: ChangeDetectorRef) {}

  // Toggle menu
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    this.cdr.markForCheck();
  }

  // Send message
  sendMessage() {
    if (!this.userMessage.trim()) return;
    this.messages.push(this.userMessage);
    this.userMessage = '';
    this.cdr.markForCheck();
  }

  // ---------------------------------------
  // FILE ATTACHMENT HANDLING
  // ---------------------------------------
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;   // ✅ Correct strong typing

  triggerFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    } else {
      console.error("❌ fileInput ViewChild not found!");
    }
  }
  
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
  const menuButton = document.querySelector('.menu-btn');
  const dropdown = document.querySelector('.dropdown');

  // If click is inside menu button or dropdown → do nothing
  if (menuButton?.contains(event.target as Node) ||
      dropdown?.contains(event.target as Node)) {
    return;
  }

  // Otherwise → close menu
  if (this.menuOpen) {
    this.menuOpen = false;
    this.cdr.markForCheck();
  }
}
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      console.log("Selected file:", file);
      // TODO: Upload or preview file here
    }
  }

  // Card actions
  onSearchFormula() {
    this.messages.push("→ Navigating to Search Formula…");
    this.cdr.markForCheck();
  }

  onCreateFormula() {
    this.messages.push("→ Opening Create Formula…");
    this.cdr.markForCheck();
  }

  onGenerateQuote() {
    this.messages.push("→ Preparing Quote Generator…");
    this.cdr.markForCheck();
  }
}
