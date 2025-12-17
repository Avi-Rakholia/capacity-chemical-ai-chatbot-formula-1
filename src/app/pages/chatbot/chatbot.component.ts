import { 
  Component, 
  ChangeDetectionStrategy, 
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage, ChatTemplate, ChatAttachment, StreamEvent } from '../../services/chat.service';
import { ResourceService } from '../../services/resource.service';
import { SupabaseAuthService } from '../../core/services/supabase-auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chatbot',
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onClickOutside($event)'
  }
})
export class ChatbotComponent implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private resourceService = inject(ResourceService);
  private authService = inject(SupabaseAuthService);
  private cdr = inject(ChangeDetectorRef);

  // State signals
  messages = signal<ChatMessage[]>([]);
  userMessage = signal('');
  menuOpen = signal(false);
  showTemplates = signal(true);
  templates = signal<ChatTemplate[]>([]);
  currentSessionId = signal<number | null>(null);
  isStreaming = signal(false);
  
  // File attachment state
  selectedFiles = signal<File[]>([]);
  selectedResources = signal<any[]>([]);
  showResourcePicker = signal(false);
  availableResources = signal<any[]>([]);

  private streamSubscription?: Subscription;

  ngOnInit() {
    this.loadTemplates();
    this.loadResources();
    this.createNewSession();
  }

  ngOnDestroy() {
    this.streamSubscription?.unsubscribe();
  }

  loadTemplates() {
    this.chatService.getTemplates().subscribe({
      next: (response) => {
        if (response.success) {
          this.templates.set(response.data);
          this.cdr.markForCheck();
        }
      },
      error: (error) => console.error('Error loading templates:', error)
    });
  }

  loadResources() {
    this.resourceService.getAllResources().subscribe({
      next: (response: any) => {
        if (response.success) {
          // Filter approved resources only
          const approved = response.data.filter((r: any) => r.approval_status === 'Approved');
          this.availableResources.set(approved);
          this.cdr.markForCheck();
        }
      },
      error: (error: any) => console.error('Error loading resources:', error)
    });
  }

  createNewSession() {
    const userId = this.authService.getUserId();
    
    if (!userId) {
      console.error('User not authenticated');
      return;
    }
    
    this.chatService.createSession({ 
      session_title: 'New Chat',
      user_id: userId 
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentSessionId.set(response.data.chat_session_id);
          this.messages.set([]);
          this.showTemplates.set(true);
          this.cdr.markForCheck();
        }
      },
      error: (error) => console.error('Error creating session:', error)
    });
  }

  // Toggle menu
  toggleMenu() {
    this.menuOpen.update(open => !open);
    this.cdr.markForCheck();
  }

  // Send message with SSE streaming
  sendMessage() {
    const message = this.userMessage().trim();
    if (!message) return;

    const sessionId = this.currentSessionId();
    if (!sessionId) {
      console.error('No active session');
      return;
    }

    // Hide templates when first message is sent
    if (this.showTemplates()) {
      this.showTemplates.set(false);
    }

    // Add user message to chat
    const userMsg: ChatMessage = {
      chat_session_id: sessionId,
      prompt: message,
      isUser: true,
      attachments: this.buildAttachments()
    };
    this.messages.update(msgs => [...msgs, userMsg]);

    // Clear input and attachments
    this.userMessage.set('');
    this.selectedFiles.set([]);
    this.selectedResources.set([]);

    // Add placeholder for AI response
    const aiMsg: ChatMessage = {
      chat_session_id: sessionId,
      prompt: '',
      response: '',
      isUser: false,
      isStreaming: true
    };
    this.messages.update(msgs => [...msgs, aiMsg]);
    this.isStreaming.set(true);

    const aiMsgIndex = this.messages().length - 1;
    const userId = this.authService.getUserId();

    if (!userId) {
      console.error('User not authenticated');
      this.messages.update(msgs => {
        const updated = [...msgs];
        updated[aiMsgIndex] = {
          ...updated[aiMsgIndex],
          response: 'Error: User not authenticated. Please log in again.',
          isStreaming: false
        };
        return updated;
      });
      this.isStreaming.set(false);
      this.cdr.markForCheck();
      return;
    }

    // Start streaming
    this.streamSubscription = this.chatService.streamMessage(
      sessionId,
      message,
      userId,
      userMsg.attachments
    ).subscribe({
      next: (event: StreamEvent) => {
        if (event.chunk) {
          // Append chunk to AI response
          this.messages.update(msgs => {
            const updated = [...msgs];
            updated[aiMsgIndex] = {
              ...updated[aiMsgIndex],
              response: (updated[aiMsgIndex].response || '') + event.chunk
            };
            return updated;
          });
          this.cdr.markForCheck();
        }

        if (event.done) {
          // Finalize streaming
          this.messages.update(msgs => {
            const updated = [...msgs];
            updated[aiMsgIndex] = {
              ...updated[aiMsgIndex],
              isStreaming: false,
              interaction_id: event.interaction_id,
              response: event.full_response || updated[aiMsgIndex].response
            };
            return updated;
          });
          this.isStreaming.set(false);
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        console.error('Streaming error:', error);
        this.messages.update(msgs => {
          const updated = [...msgs];
          updated[aiMsgIndex] = {
            ...updated[aiMsgIndex],
            isStreaming: false,
            response: 'Error: Failed to get response from AI service.'
          };
          return updated;
        });
        this.isStreaming.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  // Build attachments array from selected files and resources
  private buildAttachments(): ChatAttachment[] {
    const attachments: ChatAttachment[] = [];

    // Add local files
    this.selectedFiles().forEach(file => {
      attachments.push({
        attachment_type: 'local_file',
        file_name: file.name,
        file_size: this.formatFileSize(file.size),
        mime_type: file.type
      });
    });

    // Add resource references
    this.selectedResources().forEach(resource => {
      attachments.push({
        attachment_type: 'resource_reference',
        resource_id: resource.resource_id,
        file_name: resource.file_name,
        file_url: resource.file_url
      });
    });

    return attachments;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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
  
  onClickOutside(event: Event) {
    const menuButton = document.querySelector('.menu-btn');
    const dropdown = document.querySelector('.dropdown');

    // If click is inside menu button or dropdown → do nothing
    if (menuButton?.contains(event.target as Node) ||
        dropdown?.contains(event.target as Node)) {
      return;
    }

    // Otherwise → close menu
    if (this.menuOpen()) {
      this.menuOpen.set(false);
      this.cdr.markForCheck();
    }
  }
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      this.selectedFiles.update(existing => [...existing, ...fileArray]);
      console.log("Selected files:", this.selectedFiles());
      
      // Reset input to allow selecting the same file again
      input.value = '';
    }
  }

  // Remove file from selection
  removeFile(index: number) {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
  }

  // Remove resource from selection
  removeResource(index: number) {
    this.selectedResources.update(resources => resources.filter((_, i) => i !== index));
  }

  // Toggle resource picker
  toggleResourcePicker() {
    this.showResourcePicker.update(show => !show);
  }

  // Select a resource
  selectResource(resource: any) {
    if (!this.selectedResources().find(r => r.resource_id === resource.resource_id)) {
      this.selectedResources.update(resources => [...resources, resource]);
    }
  }

  // Card actions
  onSearchFormula() {
    // TODO: Implement search formula navigation
    console.log("→ Navigating to Search Formula…");
  }

  onCreateFormula() {
    // TODO: Implement create formula navigation
    console.log("→ Opening Create Formula…");
  }

  onGenerateQuote() {
    // TODO: Implement quote generator navigation
    console.log("→ Preparing Quote Generator…");
  }
}