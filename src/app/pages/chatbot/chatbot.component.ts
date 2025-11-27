import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatbotComponent {
    messages: string[] = [];
  userMessage: string = '';

  sendMessage() {
    if (!this.userMessage.trim()) return;

    this.messages.push(this.userMessage);
    this.userMessage = '';
  }
}
