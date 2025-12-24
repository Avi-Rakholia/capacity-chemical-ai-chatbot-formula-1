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

// Interfaces for attachment modal
interface Quote {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  url?: string;
}

interface KnowledgeBaseItem {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  url?: string;
}

interface Template {
  template_id: string;
  title: string;
  description?: string;
}

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
  conversationId = signal<string | null>(null); // Python AI service conversation ID
  isStreaming = signal(false);
  
  // File attachment state
  selectedFiles = signal<File[]>([]);
  selectedResources = signal<any[]>([]);
  showResourcePicker = signal(false);
  availableResources = signal<any[]>([]);
  
  // Attachment modal state
  showAttachmentModal = signal(false);
  activeTab = signal<'knowledgeBase' | 'quotes' | 'templates' | 'files'>('knowledgeBase');
  availableQuotes = signal<any[]>([]);
  availableKnowledgeBase = signal<any[]>([]);
  availableTemplates = signal<any[]>([]);
  selectedQuotes = signal<any[]>([]);
  selectedKnowledgeBase = signal<any[]>([]);
  selectedTemplates = signal<any[]>([]);

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
      error: (error: any) => {
        console.error('Error loading resources:', error);
      }
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
          // Store conversation_id from the session if available
          if (response.data.conversation_id) {
            this.conversationId.set(response.data.conversation_id);
          }
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
    this.clearAllSelections();

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
    let lastUpdateTime = Date.now();
    const updateThrottleMs = 50; // Update UI at most every 50ms

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
            // Keep the raw response in the data but display parsed version
            const currentRawResponse = (updated[aiMsgIndex].response || '') + event.chunk;
            
            // Try to parse if we have what looks like complete JSON
            let displayResponse = currentRawResponse;
            if (currentRawResponse.includes('{') && currentRawResponse.includes('}')) {
              try {
                // Try to find and parse JSON from the response
                const jsonMatch = currentRawResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0]);
                  if (parsed && typeof parsed === 'object') {
                    // Extract the actual response/message content
                    displayResponse = parsed.response || parsed.message || parsed.answer || parsed.result || currentRawResponse;
                  }
                }
              } catch (e) {
                // Not complete JSON yet, keep building
                displayResponse = currentRawResponse;
              }
            }
            
            updated[aiMsgIndex] = {
              ...updated[aiMsgIndex],
              response: displayResponse
            };
            return updated;
          });
          
          // Throttle change detection to prevent excessive re-renders
          const now = Date.now();
          if (now - lastUpdateTime >= updateThrottleMs) {
            this.cdr.markForCheck();
            lastUpdateTime = now;
          }
        }

        if (event.done) {
          // Finalize streaming
          this.messages.update(msgs => {
            const updated = [...msgs];
            let finalResponse = event.full_response || updated[aiMsgIndex].response;
            
            // Try to parse JSON response and extract the actual message
            try {
              const jsonMatch = finalResponse.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed && typeof parsed === 'object') {
                  // Extract response from various possible JSON structures
                  finalResponse = parsed.response || parsed.message || parsed.answer || parsed.result || finalResponse;
                }
              }
            } catch (e) {
              // If not JSON, use the response as-is
            }
            
            updated[aiMsgIndex] = {
              ...updated[aiMsgIndex],
              isStreaming: false,
              interaction_id: event.interaction_id,
              response: finalResponse
            };
            return updated;
          });
          
          // Store conversation_id if received from server
          if (event.conversation_id) {
            this.conversationId.set(event.conversation_id);
            console.log('Stored conversation_id:', event.conversation_id);
          }
          
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

  // Toggle attachment modal
  toggleAttachmentModal(): void {
    this.showAttachmentModal.set(!this.showAttachmentModal());
    if (this.showAttachmentModal()) {
      this.loadAvailableItems();
    }
  }

  // Close attachment modal
  closeAttachmentModal(): void {
    this.showAttachmentModal.set(false);
  }

  // Get total selected count for all attachment types
  getTotalSelectedCount(): number {
    return this.selectedFiles().length + 
           this.selectedResources().length + 
           this.selectedQuotes().length + 
           this.selectedKnowledgeBase().length + 
           this.selectedTemplates().length;
  }

  // Load available items for the modal
  private loadAvailableItems(): void {
    const resources = this.availableResources();
    
    // Categorize resources based on their category field
    const knowledgeResources = resources.filter(r => r.category === 'knowledge');
    const quoteResources = resources.filter(r => r.category === 'quotes');
    
    // Set knowledge base items from resources with 'knowledge' category
    this.availableKnowledgeBase.set(knowledgeResources.map(resource => ({
      id: resource.resource_id.toString(),
      title: resource.file_name,
      description: resource.description || `Knowledge resource: ${resource.file_name}`,
      url: resource.file_url
    })));
    
    // Set quotes from resources with 'quotes' category
    this.availableQuotes.set(quoteResources.map(resource => ({
      id: resource.resource_id.toString(),
      title: resource.file_name,
      description: resource.description || `Quote resource: ${resource.file_name}`,
      url: resource.file_url
    })));
    
    // Load templates that are already loaded
    const templates = this.templates();
    this.availableTemplates.set(templates.map((template: any) => ({
      template_id: template.template_id,
      title: template.title,
      description: template.description || (template.content ? template.content.substring(0, 100) + '...' : 'Template content')
    })));
  }

  // File drag and drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFileSelection(Array.from(files));
    }
  }

  // Handle file selection (used by both click and drag-drop)
  private handleFileSelection(files: File[]): void {
    const currentFiles = this.selectedFiles();
    const newFiles = [...currentFiles, ...files];
    this.selectedFiles.set(newFiles);
  }

  // Clear all selections after sending message
  clearAllSelections(): void {
    this.selectedFiles.set([]);
    this.selectedResources.set([]);
    this.selectedQuotes.set([]);
    this.selectedKnowledgeBase.set([]);
    this.selectedTemplates.set([]);
    this.showAttachmentModal.set(false);
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

    // Add quotes
    this.selectedQuotes().forEach(quote => {
      attachments.push({
        attachment_type: 'resource_reference',
        resource_id: quote.id,
        file_name: `Quote: ${quote.title || quote.name}`,
        file_url: quote.url || ''
      });
    });

    // Add knowledge base items
    this.selectedKnowledgeBase().forEach(kb => {
      attachments.push({
        attachment_type: 'resource_reference',
        resource_id: kb.id,
        file_name: `KB: ${kb.title || kb.name}`,
        file_url: kb.url || ''
      });
    });

    // Add templates
    this.selectedTemplates().forEach(template => {
      attachments.push({
        attachment_type: 'resource_reference',
        resource_id: template.template_id,
        file_name: `Template: ${template.title}`,
        file_url: ''
      });
    });

    return attachments;
  }

  formatFileSize(bytes: number): string {
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
    // Open attachment modal instead of direct file input
    this.showAttachmentModal.set(true);
    this.loadAttachmentOptions();
    this.cdr.markForCheck();
  }

  // Load data for attachment modal
  loadAttachmentOptions() {
    // Load quotes (you'll need to implement the quotes service)
    // this.quotesService.getQuotes().subscribe(quotes => this.availableQuotes.set(quotes));
    
    // Load knowledge base items (you'll need to implement this service)
    // this.knowledgeBaseService.getItems().subscribe(items => this.availableKnowledgeBase.set(items));
    
    // Templates are already loaded in loadTemplates()
    const templates = this.templates();
    this.availableTemplates.set(templates.map((template: any) => ({
      template_id: template.template_id,
      title: template.title,
      description: template.description || (template.content ? template.content.substring(0, 100) + '...' : 'Template content')
    })));
  }

  // Direct file input trigger (for when user selects "Files" in modal)
  triggerDirectFileInput() {
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
      this.handleFileSelection(Array.from(files));
      console.log("Selected files:", this.selectedFiles());
      
      // Reset input to allow selecting the same file again
      input.value = '';
    }
  }

  // Remove file from selection
  removeFile(file: File) {
    this.selectedFiles.update(files => files.filter(f => f !== file));
  }

  // Remove resource from selection
  removeResource(index: number) {
    this.selectedResources.update(resources => resources.filter((_, i) => i !== index));
  }

  // Add quote attachment
  toggleQuoteSelection(quote: any) {
    const currentQuotes = this.selectedQuotes();
    const isSelected = currentQuotes.find(q => q.id === quote.id);
    
    if (isSelected) {
      this.selectedQuotes.update(quotes => quotes.filter(q => q.id !== quote.id));
    } else {
      this.selectedQuotes.update(quotes => [...quotes, quote]);
    }
  }

  // Add knowledge base attachment
  toggleKnowledgeBaseSelection(item: any) {
    const currentItems = this.selectedKnowledgeBase();
    const isSelected = currentItems.find(kb => kb.id === item.id);
    
    if (isSelected) {
      this.selectedKnowledgeBase.update(items => items.filter(kb => kb.id !== item.id));
    } else {
      this.selectedKnowledgeBase.update(items => [...items, item]);
    }
  }

  // Add template attachment
  toggleTemplateSelection(template: any) {
    const currentTemplates = this.selectedTemplates();
    const isSelected = currentTemplates.find(t => t.template_id === template.template_id);
    
    if (isSelected) {
      this.selectedTemplates.update(templates => templates.filter(t => t.template_id !== template.template_id));
    } else {
      this.selectedTemplates.update(templates => [...templates, template]);
    }
  }

  // Remove different types of attachments
  removeQuote(index: number) {
    this.selectedQuotes.update(quotes => quotes.filter((_, i) => i !== index));
  }

  removeKnowledgeBaseItem(index: number) {
    this.selectedKnowledgeBase.update(items => items.filter((_, i) => i !== index));
  }

  removeTemplate(index: number) {
    this.selectedTemplates.update(templates => templates.filter((_, i) => i !== index));
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