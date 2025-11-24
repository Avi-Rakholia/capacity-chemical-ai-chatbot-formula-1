import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chatbot-container">
      <h1>AI Chatbot</h1>
      <p>Interact with our intelligent chemical assistant</p>
    </div>
  `,
  styleUrls: ['./chatbot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatbotComponent {}
